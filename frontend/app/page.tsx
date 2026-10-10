"use client";

import React, { useState, useEffect } from "react";
import ProductModal from "./components/productModal";

interface Product {
	_id?: string;
	name: string;
	price: number;
	description: string;
	imageURL: string;
	tags: string[];
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export default function HomePage() {
	const [searchQuery, setSearchQuery] = useState("");
	const [imageUrlInput, setImageUrlInput] = useState(""); // URL submitted by USER
	const [activeImageUrl, setActiveImageUrl] = useState(""); // URL searched
	const [products, setProducts] = useState<Product[]>([]);
	const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
	const [loading, setLoading] = useState(false);

	// 🚀 UNIFIED SEARCH: Gestisce testo, immagini pubbliche, o caricamento iniziale
	const fetchProducts = async (textQuery: string, imgUrl: string) => {
		try {
			setLoading(true);
			let endpoint = "";

			if (imgUrl.trim()) {
				// If image present, query hybrid for image and text
				endpoint = `${API_URL}/api/search?imageUrl=${encodeURIComponent(imgUrl.trim())}&q=${encodeURIComponent(textQuery)}`;
			} else if (textQuery.trim()) {
				// else only text
				endpoint = `${API_URL}/api/search?q=${encodeURIComponent(textQuery)}`;
			} else {
				// Get all products
				endpoint = `${API_URL}/api/products`;
			}

			const res = await fetch(endpoint);
			if (!res.ok) {
				console.error("API error:", res.status);
				setProducts([]);
				return;
			}

			const data = await res.json();
			setProducts(
				Array.isArray(data)
					? data
					: Array.isArray(data.products)
						? data.products
						: [],
			);
		} catch (err) {
			console.error("API error:", err);
			setProducts([]);
		} finally {
			setLoading(false);
		}
	};

	// Debounce
	useEffect(() => {
		const t = setTimeout(() => {
			if (!activeImageUrl) {
				if (searchQuery.length >= 2 || searchQuery === "") {
					fetchProducts(searchQuery, "");
				}
			} else {
				// If image active, update results combining new text
				fetchProducts(searchQuery, activeImageUrl);
			}
		}, 300);

		return () => clearTimeout(t);
	}, [searchQuery, activeImageUrl]);

	// Triggers for image search
	const handleImageSearchSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		setActiveImageUrl(imageUrlInput);
	};

	// Filter Reset
	const handleResetImage = () => {
		setImageUrlInput("");
		setActiveImageUrl("");
	};

	return (
		<main className="min-h-screen bg-background text-text">
			{/* HERO SECTION */}
			<section className="p-10 text-center flex flex-col items-center justify-center">
				<h1 className="text-4xl font-bold mb-6">Never Settle</h1>

				<div className="w-full max-w-xl space-y-4 bg-background/50 p-6 rounded-2xl border border-text/10 shadow-sm">
					{/* 1. TEXT SEARCH INPUT */}
					<div className="flex flex-col text-left">
						<label className="text-sm font-semibold mb-1 opacity-80">
							Search by keywords or intent
						</label>
						<input
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							placeholder="Type an intent like 'I want to play tennis'..."
							className="w-full p-3 rounded-xl border border-text/20 bg-background text-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
						/>
					</div>

					<div className="relative flex items-center justify-center py-1">
						<span className="absolute bg-background px-3 text-xs uppercase tracking-wider opacity-50">
							OR
						</span>
						<div className="w-full border-t border-text/10"></div>
					</div>

					{/* 2. PUBLIC IMAGE URL INPUT */}
					<form
						onSubmit={handleImageSearchSubmit}
						className="flex flex-col text-left"
					>
						<label className="text-sm font-semibold mb-1 opacity-80">
							Search by public image URL (Azure Vision)
						</label>
						<div className="flex gap-2">
							<input
								value={imageUrlInput}
								onChange={(e) => setImageUrlInput(e.target.value)}
								placeholder="Paste a public URL (e.g. https://domain.com/photo.jpg)"
								className="flex-1 p-3 rounded-xl border border-text/20 bg-background text-text focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-all text-sm"
							/>
							<button
								type="submit"
								className="btn btn-secondary text-sm font-semibold whitespace-nowrap"
							>
								Analyze Image
							</button>
						</div>
					</form>

					{/* Image Filter */}
					{activeImageUrl && (
						<div className="flex items-center justify-between bg-secondary/10 p-3 rounded-xl border border-secondary/20 text-sm">
							<div className="flex items-center gap-3 truncate">
								<img
									src={activeImageUrl}
									alt="Preview"
									className="w-8 h-8 rounded-md object-cover border border-secondary"
								/>
								<span className="truncate font-medium text-secondary">
									Active Image Filter
								</span>
							</div>
							<button
								onClick={handleResetImage}
								className="text-xs font-bold underline cursor-pointer hover:text-secondary-hover"
							>
								Clear Image
							</button>
						</div>
					)}
				</div>
			</section>

			{/* PRODUCTS GRID */}
			<section className="p-6">
				{loading ? (
					<div className="flex justify-center items-center py-20">
						<p className="text-lg font-medium animate-pulse text-primary">
							Analyzing credentials and processing entities...
						</p>
					</div>
				) : products.length === 0 ? (
					<div className="text-center py-20">
						<p className="opacity-60">
							No products found for this hybrid execution criteria.
						</p>
					</div>
				) : (
					<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
						{products.map((p, i) => (
							<div
								key={p._id || i}
								onClick={() => setSelectedProduct(p)}
								className="group bg-background border border-text/10 rounded-2xl p-4 cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-primary/30"
							>
								<div className="overflow-hidden rounded-xl bg-text/5 mb-3">
									<img
										src={p.imageURL}
										alt={p.name}
										className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500"
									/>
								</div>
								<h3 className="font-bold text-lg group-hover:text-primary transition-colors line-clamp-1">
									{p.name}
								</h3>
								<p className="text-sm opacity-70 mt-1 line-clamp-2 min-h-[40px]">
									{p.description}
								</p>
								<div className="flex items-center justify-between mt-3 pt-2 border-t border-text/5">
									<span className="font-black text-xl text-primary">
										{p.price}€
									</span>
									<span className="text-xs bg-text/5 px-2 py-1 rounded-md font-medium uppercase tracking-wider opacity-60">
										Quick View
									</span>
								</div>
							</div>
						))}
					</div>
				)}
			</section>

			{/* MODAL QUICK VIEW */}
			<ProductModal
				key={selectedProduct?._id ?? "closed"}
				product={selectedProduct}
				onClose={() => setSelectedProduct(null)}
			/>
		</main>
	);
}
