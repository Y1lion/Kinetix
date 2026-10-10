import multer from "multer";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"];

export const uploadImage = multer({
	storage: multer.memoryStorage(),

	limits: {
		fileSize: MAX_FILE_SIZE,
		files: 1,
	},

	fileFilter: (req, file, callback) => {
		if (!allowedMimeTypes.includes(file.mimetype)) {
			return callback(new Error("Only JPG, PNG and WebP images are allowed."));
		}

		callback(null, true);
	},
});
