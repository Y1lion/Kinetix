import express from "express";

import {
	getProducts,
	addProduct,
	deleteProduct,
} from "../controllers/productController.js";

import {
	getUsers,
	createUser,
	deleteUser,
} from "../controllers/userController.js";
import { uploadImageController } from "../controllers/imageController.js";
import { uploadImage } from "../middleware/uploadImage.js";

import { requireAuth } from "../middleware/requireAuth.js";
import { requireAdmin } from "../middleware/requireAdmin.js";

const router = express.Router();

router.use(requireAuth);
router.use(requireAdmin);

/**
 * @openapi
 * /api/admin/products:
 *   get:
 *     summary: Get all products
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Products retrieved successfully
 *       401:
 *         description: User not authenticated
 *       403:
 *         description: Admin access required
 *       500:
 *         description: Unable to retrieve products
 *
 *   post:
 *     summary: Create a product
 *     description: Creates a product and generates its tags through the AI pipeline.
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - imageURL
 *               - name
 *               - description
 *               - price
 *             properties:
 *               imageURL:
 *                 type: string
 *                 example: https://example.com/football.jpg
 *               name:
 *                 type: string
 *                 example: Match Football
 *               description:
 *                 type: string
 *                 example: Professional football for training.
 *               price:
 *                 type: number
 *                 minimum: 0
 *                 example: 25.99
 *     responses:
 *       201:
 *         description: Product created successfully
 *       400:
 *         description: Invalid or missing product data
 *       401:
 *         description: User not authenticated
 *       403:
 *         description: Admin access required
 */
router.get("/products", getProducts);
router.post("/products", addProduct);

// Upload a product image to Azure Blob Storage.
/**
 * @openapi
 * /api/admin/images/upload:
 *   post:
 *     summary: Upload a product image to Azure Blob Storage
 *     description: Uploads a JPG, PNG or WebP image (maximum 5 MB) and returns its public URL.
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - image
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Product image (JPG, PNG or WebP, maximum 5 MB).
 *     responses:
 *       201:
 *         description: Image uploaded successfully
 *       400:
 *         description: Missing, invalid or oversized image
 *       401:
 *         description: User not authenticated
 *       403:
 *         description: Admin access required
 *       500:
 *         description: Unable to upload image
 */
router.post(
	"/images/upload",
	(req, res, next) => {
		uploadImage.single("image")(req, res, (error) => {
			if (error) {
				return res.status(400).json({
					message: error.message,
				});
			}

			next();
		});
	},
	uploadImageController,
);

/**
 * @openapi
 * /api/admin/products/{productId}:
 *   delete:
 *     summary: Delete a product
 *     description: Deletes the product from MongoDB, baskets and Meilisearch.
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product deleted successfully
 *       400:
 *         description: Invalid product ID
 *       401:
 *         description: User not authenticated
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Product not found
 *       500:
 *         description: Unable to delete product
 */
router.delete("/products/:productId", deleteProduct);

/**
 * @openapi
 * /api/admin/users:
 *   get:
 *     summary: Get all users
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *       401:
 *         description: User not authenticated
 *       403:
 *         description: Admin access required
 *       500:
 *         description: Unable to retrieve users
 *
 *   post:
 *     summary: Create a standard user
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - name
 *               - surname
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: mario.rossi@example.com
 *               name:
 *                 type: string
 *                 example: Mario
 *               surname:
 *                 type: string
 *                 example: Rossi
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 example: SecurePass123!
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Invalid or missing user data
 *       401:
 *         description: User not authenticated
 *       403:
 *         description: Admin access required
 *       409:
 *         description: Email already exists
 */
router.get("/users", getUsers);
router.post("/users", createUser);

/**
 * @openapi
 * /api/admin/users/{userId}:
 *   delete:
 *     summary: Delete a user
 *     description: Deletes the user and their basket entries.
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       400:
 *         description: Invalid user ID or self-deletion attempt
 *       401:
 *         description: User not authenticated
 *       403:
 *         description: Admin access required
 *       404:
 *         description: User not found
 *       500:
 *         description: Unable to delete user
 */
router.delete("/users/:userId", deleteUser);

export default router;
