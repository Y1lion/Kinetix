import { meili } from "../config/meilisearch.js";
import Product from "../models/product.js";

export async function initMeilisearch() {
	try {
		const index = meili.index("products");

		const settingsTask = await index.updateSettings({
			searchableAttributes: ["name", "description", "tags"],
			filterableAttributes: ["tags", "price"],
			displayedAttributes: ["name", "description", "price", "imageURL", "tags"],
		});

		await meili.waitForTask(settingsTask.taskUid);

		console.log("Meilisearch settings updated successfully");

		const products = await Product.find({});

		const docs = products.map((p) => ({
			id: p._id.toString(),
			name: p.name,
			description: p.description,
			price: p.price,
			imageURL: p.imageURL,
			tags: p.tags,
		}));

		const indexingTask = await index.addDocuments(docs);

		await meili.waitForTask(indexingTask.taskUid);

		console.log(`Successfully indexed ${docs.length} products`);
	} catch (err) {
		console.error("Meilisearch initialization failed:", err);
		throw err;
	}
}
