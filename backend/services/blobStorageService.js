import { BlobServiceClient } from "@azure/storage-blob";
import { ManagedIdentityCredential } from "@azure/identity";
import { randomUUID } from "node:crypto";

const storageAccountName = "kinetixstorage1";
const containerName = "product-images";

// Authenticate using the existing user-assigned managed identity.
const credential = new ManagedIdentityCredential(
	"672e8670-f7ee-481b-bb97-44c1ffc3e73c",
);

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

	// Verify the actual file signature, not only the MIME type.
	const buffer = file.buffer;

	const isJpeg =
		buffer.length >= 3 &&
		buffer[0] === 0xff &&
		buffer[1] === 0xd8 &&
		buffer[2] === 0xff;

	const isPng =
		buffer.length >= 8 &&
		buffer
			.subarray(0, 8)
			.equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));

	const isWebp =
		buffer.length >= 12 &&
		buffer.toString("ascii", 0, 4) === "RIFF" &&
		buffer.toString("ascii", 8, 12) === "WEBP";

	const validImage =
		(file.mimetype === "image/jpeg" && isJpeg) ||
		(file.mimetype === "image/png" && isPng) ||
		(file.mimetype === "image/webp" && isWebp);

	if (!validImage) {
		throw new Error("File content does not match the image format.");
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
