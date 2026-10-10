import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
	{
		// Local accounts require an email; Microsoft accounts may not provide one.
		email: {
			type: String,
			required: function () {
				return !this.microsoftId;
			},
		},
		name: { type: String, required: true },
		surname: { type: String, required: true },

		// Local accounts use passwords; Microsoft accounts do not.
		password: {
			type: String,
			required: function () {
				return !this.microsoftId;
			},
		},

		// Unique identifier for a Microsoft Entra ID account.
		microsoftId: {
			type: String,
			unique: true,
			sparse: true,
		},

		role: {
			type: String,
			enum: ["user", "admin"],
			default: "user",
		},
	},
	{ timestamps: true },
);

// Enforce unique email addresses only when the email is a string.
// Microsoft-only accounts can exist without an email address.
userSchema.index(
	{ email: 1 },
	{
		name: "email_unique_partial",
		unique: true,
		partialFilterExpression: {
			email: { $type: "string" },
		},
	},
);

export default mongoose.model("User", userSchema);
