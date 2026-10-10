import { uploadProductImage } from "../services/blobStorageService.js";

export const uploadImageController = async (req, res) => {
	try {
		if (!req.file) {
			return res.status(400).json({
				message: "No image file provided.",
			});
		}

		const imageURL = await uploadProductImage(req.file);

		return res.status(201).json({
			message: "Image uploaded successfully.",
			imageURL,
		});
	} catch (error) {
		console.error("Image upload error:", error);

		if (
			error.message === "Unsupported image format." ||
			error.message === "Invalid image file." ||
			error.message === "File content does not match the image format."
		) {
			return res.status(400).json({
				message: error.message,
			});
		}

		return res.status(500).json({
			message: "Unable to upload image.",
		});
	}
};
