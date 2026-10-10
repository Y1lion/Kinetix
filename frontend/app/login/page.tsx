"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import Input from "../components/input";
import MailIcon from "../components/icons/mailIcon";
import LockIcon from "../components/icons/lockIcon";

type FormData = {
	email: string;
	password: string;
};

const MICROSOFT_AUTH_URL =
	process.env.NEXT_PUBLIC_MICROSOFT_AUTH_URL ||
	"https://kinetix-backend.icystone-4f68f29d.switzerlandnorth.azurecontainerapps.io";
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export default function LoginPage() {
	const router = useRouter();

	const [form, setForm] = useState<FormData>({
		email: "",
		password: "",
	});

	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");
	const [isLoading, setIsLoading] = useState(false);

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setForm((prev) => ({
			...prev,
			[e.target.name]: e.target.value,
		}));
	};

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();

		setError("");
		setSuccess("");
		setIsLoading(true);

		try {
			const res = await fetch(`${API_URL}/api/auth/login`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},

				// Permette al browser di ricevere e salvare il cookie di sessione
				credentials: "include",

				body: JSON.stringify(form),
			});

			const data = await res.json().catch(() => null);

			if (!res.ok) {
				setError(data?.message || "Error during sign in");
				return;
			}

			setSuccess("Sign in successful!");
			setForm({
				email: "",
				password: "",
			});

			router.replace("/");
			router.refresh();
		} catch (error) {
			console.error("Login request failed:", error);
			setError("Connection error");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-background text-text transition-colors duration-300">
			<form
				onSubmit={handleSubmit}
				className="bg-background/80 backdrop-blur-md border border-primary/20 p-8 rounded-2xl shadow-xl w-full max-w-md space-y-4"
			>
				<h1 className="text-2xl font-bold text-center text-primary mb-6">
					Sign In
				</h1>

				<Input
					type="email"
					name="email"
					placeholder="Email"
					value={form.email}
					onChange={handleChange}
					icon={<MailIcon />}
				/>

				<Input
					type="password"
					name="password"
					placeholder="Password"
					value={form.password}
					onChange={handleChange}
					icon={<LockIcon />}
				/>

				<button
					type="submit"
					disabled={isLoading}
					className="btn btn-primary w-full mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{isLoading ? "Signing in..." : "Login"}
				</button>

				<button
					type="button"
					onClick={() => {
						window.location.href = `${MICROSOFT_AUTH_URL}/api/auth/microsoft`;
					}}
				>
					Continue with Microsoft
				</button>

				{error && (
					<p className="text-secondary text-sm text-center mt-4">{error}</p>
				)}

				{success && (
					<p className="text-primary text-sm text-center mt-4">{success}</p>
				)}

				<div className="text-center mt-6 text-sm">
					Don&apos;t have an account?{" "}
					<Link
						href="/register"
						className="text-primary hover:underline font-bold transition-all"
					>
						Sign up
					</Link>
				</div>
			</form>
		</div>
	);
}
