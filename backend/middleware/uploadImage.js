import { BlobServiceClient } from "@azure/storage-blob";
import { DefaultAzureCredential } from "@azure/identity";
import { randomUUID } from "node:crypto";

const storageAccountName = "kinetixstorage1";
const containerName = "product-images";

// Authenticate using Managed Identity on Azure or Azure CLI locally.
const credential = new DefaultAzureCredential();

const blobServiceClient = new BlobServiceClient(
	`https://${storageAccountName}.blob.core.windows.net`,
	credential,
);

const containerClient = blobServiceClient.getContainerClient(containerName);

const allowedMimeTypes = new Map([
	["image/jpeg", ".jpg"],
	["image/png", ".png"],
	["image/webp", ".webp"],
]);

export const uploadProductImage = async (file) => {
	if (!file?.buffer || !file?.mimetype) {
		throw new Error("Invalid image file.");
	}

	const extension = allowedMimeTypes.get(file.mimetype);

	if (!extension) {
		throw new Error("Unsupported image format.");
	}

	// Generate a unique filename to avoid overwriting existing images.
	const blobName = `${randomUUID()}${extension}`;
	const blockBlobClient = containerClient.getBlockBlobClient(blobName);

	// Store the image with its correct content type.
	await blockBlobClient.uploadData(file.buffer, {
		blobHTTPHeaders: {
			blobContentType: file.mimetype,
		},
	});

	return blockBlobClient.url;
};
