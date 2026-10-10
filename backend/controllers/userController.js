import bcrypt from "bcryptjs";
import mongoose from "mongoose";

import User from "../models/user.js";
import Basket from "../models/basket.js";

export const getUsers = async (req, res) => {
	try {
		const users = await User.find().select("-password").sort({ createdAt: -1 });

		return res.status(200).json({
			users,
		});
	} catch (error) {
		console.error("Get users error:", error);

		return res.status(500).json({
			message: "Unable to retrieve users",
		});
	}
};

export const createUser = async (req, res) => {
	try {
		const { email, name, surname, password } = req.body;

		if (!email || !name || !surname || !password) {
			return res.status(400).json({
				message: "All user fields are required",
			});
		}

		const normalizedEmail = email.trim().toLowerCase();

		if (!normalizedEmail.includes("@")) {
			return res.status(400).json({
				message: "Email is not valid",
			});
		}

		if (password.length < 6) {
			return res.status(400).json({
				message: "Password must contain at least 6 characters",
			});
		}

		const existingUser = await User.findOne({
			email: normalizedEmail,
		});

		if (existingUser) {
			return res.status(409).json({
				message: "Email already exists",
			});
		}

		const hashedPassword = await bcrypt.hash(password, 10);

		const user = await User.create({
			email: normalizedEmail,
			name: name.trim(),
			surname: surname.trim(),
			password: hashedPassword,
			role: "user",
		});

		return res.status(201).json({
			message: "User created successfully",
			user: {
				id: user._id.toString(),
				email: user.email,
				name: user.name,
				surname: user.surname,
				role: user.role,
			},
		});
	} catch (error) {
		console.error("Create user error:", error);

		return res.status(500).json({
			message: "Unable to create user",
		});
	}
};

export const deleteUser = async (req, res) => {
	try {
		const { userId } = req.params;

		if (!mongoose.Types.ObjectId.isValid(userId)) {
			return res.status(400).json({
				message: "Invalid user ID",
			});
		}

		if (req.session.user.id === userId) {
			return res.status(400).json({
				message: "You cannot delete your own admin account",
			});
		}

		const user = await User.findById(userId);

		// Reject unknown users and accounts without a local password.
		if (!user || !user.password) {
			return res.status(401).json({
				message: "Invalid email or password",
			});
		}

		await Basket.deleteMany({
			userEmail: user.email.toLowerCase(),
		});

		await User.findByIdAndDelete(userId);

		return res.status(200).json({
			message: "User deleted successfully",
		});
	} catch (error) {
		console.error("Delete user error:", error);

		return res.status(500).json({
			message: "Unable to delete user",
		});
	}
};
