"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link"; // Aggiunto l'import del Link

import Input from "../components/input";
import MailIcon from "../components/icons/mailIcon";
import UserIcon from "../components/icons/userIcon";
import LockIcon from "../components/icons/lockIcon";

type FormData = {
	email: string;
	name: string;
	surname: string;
	password: string;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export default function RegisterPage() {
	const router = useRouter();

	const [form, setForm] = useState<FormData>({
		email: "",
		name: "",
		surname: "",
		password: "",
	});

	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setForm((prev) => ({
			...prev,
			[e.target.name]: e.target.value,
		}));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		setSuccess("");

		try {
			const res = await fetch(`${API_URL}/api/auth/register`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(form),
			});

			const data = await res.json().catch(() => null);

			if (!res.ok) {
				setError(data?.message || "Error during sign up");
				return;
			}

			setSuccess("Registration successful! Redirecting to Login...");

			setForm({ email: "", name: "", surname: "", password: "" });

			setTimeout(() => {
				router.push("/login");
			}, 1500);
		} catch (err) {
			console.error("Connection Error:", err);
			setError("Connection Error");
		}
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-background text-text transition-colors duration-300">
			<form
				onSubmit={handleSubmit}
				className="bg-background/80 backdrop-blur-md border border-primary/20 p-8 rounded-2xl shadow-xl w-full max-w-md space-y-4"
			>
				<h1 className="text-2xl font-bold text-center text-primary">Sign Up</h1>

				<Input
					type="email"
					name="email"
					placeholder="Email"
					value={form.email}
					onChange={handleChange}
					icon={<MailIcon />}
				/>
				<Input
					type="text"
					name="name"
					placeholder="Name"
					value={form.name}
					onChange={handleChange}
					icon={<UserIcon />}
				/>
				<Input
					type="text"
					name="surname"
					placeholder="Surname"
					value={form.surname}
					onChange={handleChange}
					icon={<UserIcon />}
				/>
				<Input
					type="password"
					name="password"
					placeholder="Password"
					value={form.password}
					onChange={handleChange}
					icon={<LockIcon />}
				/>

				<button type="submit" className="btn btn-primary w-full">
					Register
				</button>

				{error && <p className="text-secondary text-sm text-center">{error}</p>}
				{success && (
					<p className="text-primary text-sm text-center font-medium">
						{success}
					</p>
				)}

				{/* --- NUOVA SEZIONE LINK AL LOGIN --- */}
				<div className="text-center mt-4 text-sm">
					Already have an account?{" "}
					<Link
						href="/login"
						className="text-primary hover:underline font-bold transition-all"
					>
						Sign in
					</Link>
				</div>
			</form>
		</div>
	);
}
