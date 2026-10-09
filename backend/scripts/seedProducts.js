import Product from "../models/product.js";
import productsDataset from "../data/productsDataset.js";

export const seedProductsIfEmpty = async () => {
	try {
		const productsCount = await Product.countDocuments();

		if (productsCount > 0) {
			console.log(
				`Product seed skipped: the collection already contains ${productsCount} product(s).`,
			);
			return;
		}

		const insertedProducts = await Product.insertMany(productsDataset);

		console.log(
			`Product seed completed: ${insertedProducts.length} products inserted.`,
		);
	} catch (err) {
		console.error("Product seed failed:", err);
		throw err;
	}
};
