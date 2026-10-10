import express from "express";
import mongoose from "mongoose";

import cors from "cors";
import swaggerJsDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

import path from "path";
import { fileURLToPath } from "url";

import session from "express-session";
import MongoStore from "connect-mongo";

import { initMeilisearch } from "./scripts/initMeili.js";
import { meili } from "./config/meilisearch.js";
import Product from "./models/product.js";
import { seedProductsIfEmpty } from "./scripts/seedProducts.js";

import authRoutes from "./routes/auth.js";
import productsRoutes from "./routes/products.js";
import basketRoutes from "./routes/basket.js";
import searchRoutes from "./routes/search.js";
import adminRoutes from "./routes/admin.js";
import healthRoutes from "./routes/health.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

if (!process.env.MONGO_URI) {
	throw new Error("MONGO_URI environment variable is not defined");
}

if (!process.env.SESSION_SECRET) {
	throw new Error("SESSION_SECRET environment variable is not defined");
}

const app = express();

const PORT = process.env.PORT || 3001;
const isProduction = process.env.NODE_ENV === "production";

if (isProduction) {
	app.set("trust proxy", 1);
}

app.use(
	cors({
		origin: process.env.FRONTEND_URL || "http://localhost:3000",
		credentials: true,
	}),
);

app.use(express.json());

app.use(
	session({
		name: "kinetix.sid",
		secret: process.env.SESSION_SECRET,
		resave: false,
		saveUninitialized: false,
		store: MongoStore.create({
			mongoUrl: process.env.MONGO_URI,
			collectionName: "sessions",
		}),
		cookie: {
			httpOnly: true,
			secure: isProduction,
			sameSite: isProduction ? "none" : "lax",
			maxAge: 1000 * 60 * 60 * 24,
		},
	}),
);

// --- SWAGGER ---
const swaggerOptions = {
	definition: {
		openapi: "3.0.0",
		info: {
			title: "Kinetix API",
			version: "1.0.0",
			description: "Interactive Documentation for Kinetix",
		},
		servers: [
			{
				url: "/",
				description: "Current Server",
			},
		],
		components: {
			securitySchemes: {
				cookieAuth: {
					type: "apiKey",
					in: "cookie",
					name: "kinetix.sid",
				},
			},
		},
	},
	apis: [
		path.join(__dirname, "routes", "*.js"),
		path.join(__dirname, "server.js"),
	],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);

// Expose the OpenAPI specification as JSON for Azure API Management.
app.get("/api-docs.json", (req, res) => {
	res.json(swaggerDocs);
});

// Serve the interactive Swagger UI documentation.
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));
// --- SWAGGER ---

app.use("/api/auth", authRoutes);
app.use("/api/products", productsRoutes);
app.use("/api/basket", basketRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/health", healthRoutes);

// Periodically restore the Meilisearch index if its data is lost.
// MongoDB Atlas remains the persistent source of truth.
let isCheckingMeilisearch = false;

const checkMeilisearchIndex = async () => {
	if (isCheckingMeilisearch) {
		return;
	}

	isCheckingMeilisearch = true;

	try {
		const index = meili.index("products");
		const mongoCount = await Product.countDocuments();

		let meiliCount = 0;
		let indexExists = true;

		try {
			const stats = await index.getStats();
			meiliCount = stats.numberOfDocuments;
		} catch (error) {
			indexExists = false;
			console.warn("Meilisearch index check failed:", error.message);
		}

		if (!indexExists || meiliCount !== mongoCount) {
			console.warn(
				`Meilisearch recovery needed: MongoDB=${mongoCount}, Meilisearch=${meiliCount}`,
			);

			await initMeilisearch();

			console.log("Meilisearch index restored successfully");
		}
	} catch (error) {
		console.error("Meilisearch recovery check failed:", error.message);
	} finally {
		isCheckingMeilisearch = false;
	}
};

const startServer = async () => {
	try {
		await mongoose.connect(process.env.MONGO_URI);
		console.log("MongoDB connected");

		await seedProductsIfEmpty();

		try {
			await initMeilisearch();
			console.log("Meilisearch initialized");
		} catch (meiliError) {
			console.warn("Meilisearch initialization failed:", meiliError.message);
		}

		app.listen(PORT, "0.0.0.0", () => {
			console.log(`Server running on port ${PORT}`);
			console.log(`Swagger UI available at http://localhost:${PORT}/api-docs`);
		});

		// Check Meilisearch every 5 minutes.
		setInterval(checkMeilisearchIndex, 5 * 60 * 1000);
	} catch (error) {
		console.error("Server startup failed:", error.message);
		process.exit(1);
	}
};

startServer();
