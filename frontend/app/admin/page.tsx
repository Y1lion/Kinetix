"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

type Product = {
	_id: string;
	imageURL: string;
	name: string;
	description: string;
	price: number;
	tags: string[];
};

type User = {
	_id: string;
	email: string;
	name: string;
	surname: string;
	role: "user" | "admin";
};

type ApiError = Error & {
	status?: number;
};

type ProductForm = {
	imageURL: string;
	name: string;
	description: string;
	price: string;
};

type UserForm = {
	name: string;
	surname: string;
	email: string;
	password: string;
};

const emptyProductForm: ProductForm = {
	imageURL: "",
	name: "",
	description: "",
	price: "",
};

const emptyUserForm: UserForm = {
	name: "",
	surname: "",
	email: "",
	password: "",
};

const inputClassName =
	"w-full rounded-lg border border-primary/30 bg-background px-3 py-2 text-text outline-none transition-colors focus:border-primary";

async function readResponse<T>(response: Response): Promise<T> {
	const data = await response.json().catch(() => null);

	if (!response.ok) {
		const error = new Error(data?.message ?? "Request failed") as ApiError;

		error.status = response.status;

		throw error;
	}

	return data as T;
}

async function fetchProducts(): Promise<Product[]> {
	const response = await fetch(`${API_URL}/api/admin/products`, {
		credentials: "include",
		cache: "no-store",
	});

	const data = await readResponse<{
		products: Product[];
	}>(response);

	return data.products;
}

async function fetchUsers(): Promise<User[]> {
	const response = await fetch(`${API_URL}/api/admin/users`, {
		credentials: "include",
		cache: "no-store",
	});

	const data = await readResponse<{
		users: User[];
	}>(response);

	return data.users;
}

export default function AdminPage() {
	const router = useRouter();

	const [products, setProducts] = useState<Product[]>([]);
	const [users, setUsers] = useState<User[]>([]);

	const [productForm, setProductForm] = useState<ProductForm>(emptyProductForm);
	// Store the image selected for Azure Blob Storage upload.
	const [productImageFile, setProductImageFile] = useState<File | null>(null);
	const [imageInputKey, setImageInputKey] = useState(0);

	const [userForm, setUserForm] = useState<UserForm>(emptyUserForm);

	const [loading, setLoading] = useState(true);
	const [creatingProduct, setCreatingProduct] = useState(false);
	const [creatingUser, setCreatingUser] = useState(false);

	const [deletingProductId, setDeletingProductId] = useState<string | null>(
		null,
	);

	const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

	const [message, setMessage] = useState("");
	const [isError, setIsError] = useState(false);

	useEffect(() => {
		let cancelled = false;

		Promise.all([fetchProducts(), fetchUsers()])
			.then(([loadedProducts, loadedUsers]) => {
				if (cancelled) {
					return;
				}

				setProducts(loadedProducts);
				setUsers(loadedUsers);
			})
			.catch((error: ApiError) => {
				if (cancelled) {
					return;
				}

				if (error.status === 401) {
					router.replace("/login");
					return;
				}

				if (error.status === 403) {
					router.replace("/");
					return;
				}

				setMessage(error.message);
				setIsError(true);
			})
			.finally(() => {
				if (!cancelled) {
					setLoading(false);
				}
			});

		return () => {
			cancelled = true;
		};
	}, [router]);

	const handleRequestError = (error: ApiError) => {
		if (error.status === 401) {
			router.replace("/login");
			return;
		}

		if (error.status === 403) {
			router.replace("/");
			return;
		}

		setMessage(error.message);
		setIsError(true);
	};

	const clearMessage = () => {
		setMessage("");
		setIsError(false);
	};

	const handleAddProduct = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		clearMessage();

		const price = Number(productForm.price);

		if (!Number.isFinite(price) || price < 0) {
			setMessage("Price must be a valid non-negative number.");
			setIsError(true);
			return;
		}

		setCreatingProduct(true);

		try {
			let imageURL = productForm.imageURL.trim();

			if (productImageFile) {
				// Upload the image to Azure Blob Storage before creating the product.
				const formData = new FormData();
				formData.append("image", productImageFile);

				const uploadResponse = await fetch(
					`${API_URL}/api/admin/images/upload`,
					{
						method: "POST",
						credentials: "include",
						body: formData,
					},
				);

				const uploadData = await readResponse<{ imageURL: string }>(
					uploadResponse,
				);

				imageURL = uploadData.imageURL;
			}

			if (!imageURL) {
				throw new Error("Select an image or enter an image URL.");
			}

			// Create the product using the uploaded image URL.
			const response = await fetch(`${API_URL}/api/admin/products`, {
				method: "POST",
				credentials: "include",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					imageURL,
					name: productForm.name.trim(),
					description: productForm.description.trim(),
					price,
				}),
			});

			const data = await readResponse<{
				message: string;
				product: Product;
			}>(response);

			setProducts((currentProducts) => [data.product, ...currentProducts]);

			setProductForm(emptyProductForm);
			setProductImageFile(null);
			setImageInputKey((currentKey) => currentKey + 1);
			setMessage("Product added successfully.");
		} catch (error) {
			handleRequestError(error as ApiError);
		} finally {
			setCreatingProduct(false);
		}
	};

	const handleDeleteProduct = async (
		productId: string,
		productName: string,
	) => {
		const confirmed = window.confirm(`Delete "${productName}"?`);

		if (!confirmed) {
			return;
		}

		clearMessage();
		setDeletingProductId(productId);

		try {
			const response = await fetch(
				`${API_URL}/api/admin/products/${productId}`,
				{
					method: "DELETE",
					credentials: "include",
				},
			);

			await readResponse<{ message: string }>(response);

			setProducts((currentProducts) =>
				currentProducts.filter((product) => product._id !== productId),
			);

			window.dispatchEvent(new Event("basket-updated"));

			setMessage("Product deleted successfully.");
		} catch (error) {
			handleRequestError(error as ApiError);
		} finally {
			setDeletingProductId(null);
		}
	};

	const handleAddUser = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		clearMessage();

		if (userForm.password.length < 6) {
			setMessage("Password must contain at least 6 characters.");
			setIsError(true);
			return;
		}

		setCreatingUser(true);

		try {
			const response = await fetch(`${API_URL}/api/admin/users`, {
				method: "POST",
				credentials: "include",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					name: userForm.name.trim(),
					surname: userForm.surname.trim(),
					email: userForm.email.trim(),
					password: userForm.password,
				}),
			});

			await readResponse<{ message: string }>(response);

			const updatedUsers = await fetchUsers();

			setUsers(updatedUsers);
			setUserForm(emptyUserForm);
			setMessage("User added successfully.");
		} catch (error) {
			handleRequestError(error as ApiError);
		} finally {
			setCreatingUser(false);
		}
	};

	const handleDeleteUser = async (userId: string, email: string) => {
		const confirmed = window.confirm(`Delete the user "${email}"?`);

		if (!confirmed) {
			return;
		}

		clearMessage();
		setDeletingUserId(userId);

		try {
			const response = await fetch(`${API_URL}/api/admin/users/${userId}`, {
				method: "DELETE",
				credentials: "include",
			});

			await readResponse<{ message: string }>(response);

			setUsers((currentUsers) =>
				currentUsers.filter((user) => user._id !== userId),
			);

			setMessage("User deleted successfully.");
		} catch (error) {
			handleRequestError(error as ApiError);
		} finally {
			setDeletingUserId(null);
		}
	};

	if (loading) {
		return (
			<main className="flex min-h-screen items-center justify-center bg-background text-text">
				<p className="font-semibold">Loading Admin Dashboard...</p>
			</main>
		);
	}

	return (
		<main className="min-h-screen bg-background px-4 py-10 text-text sm:px-6">
			<div className="mx-auto max-w-6xl">
				<header className="mb-8">
					<h1 className="text-3xl font-bold">Admin Dashboard</h1>

					<p className="mt-2 opacity-70">
						Manage products and registered users.
					</p>
				</header>

				{message && (
					<div
						className={`mb-6 rounded-lg border p-3 text-sm ${
							isError
								? "border-red-500/30 bg-red-500/10 text-red-500"
								: "border-green-500/30 bg-green-500/10 text-green-600"
						}`}
					>
						{message}
					</div>
				)}

				<div className="grid gap-8 lg:grid-cols-2">
					<section className="rounded-xl border border-primary/20 p-5">
						<h2 className="text-xl font-bold">Add Product</h2>

						<p className="mt-1 text-sm opacity-60">
							Tags are generated automatically by the AI pipeline.
						</p>
						{/* Select a product image to upload to Azure Blob Storage. */}
						<div className="space-y-2">
							<label
								htmlFor="product-image"
								className="block text-sm font-medium"
							>
								Product image
							</label>

							<input
								id="product-image"
								type="file"
								key={imageInputKey}
								accept="image/jpeg,image/png,image/webp"
								onChange={(event) => {
									const file = event.target.files?.[0] ?? null;
									setProductImageFile(file);
								}}
								className={inputClassName}
								disabled={creatingProduct}
							/>

							<p className="text-xs opacity-60">
								JPG, PNG or WebP. Maximum 5 MB.
							</p>
						</div>
						<form onSubmit={handleAddProduct} className="mt-5 space-y-3">
							<input
								type="url"
								placeholder="Image URL"
								value={productForm.imageURL}
								onChange={(event) =>
									setProductForm((currentForm) => ({
										...currentForm,
										imageURL: event.target.value,
									}))
								}
								className={inputClassName}
								required={!productImageFile}
							/>

							<input
								type="text"
								placeholder="Product name"
								value={productForm.name}
								onChange={(event) =>
									setProductForm((currentForm) => ({
										...currentForm,
										name: event.target.value,
									}))
								}
								className={inputClassName}
								required
							/>

							<textarea
								placeholder="Description"
								value={productForm.description}
								onChange={(event) =>
									setProductForm((currentForm) => ({
										...currentForm,
										description: event.target.value,
									}))
								}
								className={`${inputClassName} min-h-28 resize-y`}
								required
							/>

							<input
								type="number"
								min="0"
								step="0.01"
								placeholder="Price"
								value={productForm.price}
								onChange={(event) =>
									setProductForm((currentForm) => ({
										...currentForm,
										price: event.target.value,
									}))
								}
								className={inputClassName}
								required
							/>

							<button
								type="submit"
								disabled={creatingProduct}
								className="btn btn-primary w-full disabled:cursor-not-allowed disabled:opacity-50"
							>
								{creatingProduct ? "Creating product..." : "Add Product"}
							</button>
						</form>
					</section>

					<section className="rounded-xl border border-primary/20 p-5">
						<h2 className="text-xl font-bold">Add User</h2>

						<p className="mt-1 text-sm opacity-60">
							New accounts receive the standard user role.
						</p>

						<form onSubmit={handleAddUser} className="mt-5 space-y-3">
							<input
								type="text"
								placeholder="Name"
								value={userForm.name}
								onChange={(event) =>
									setUserForm((currentForm) => ({
										...currentForm,
										name: event.target.value,
									}))
								}
								className={inputClassName}
								required
							/>

							<input
								type="text"
								placeholder="Surname"
								value={userForm.surname}
								onChange={(event) =>
									setUserForm((currentForm) => ({
										...currentForm,
										surname: event.target.value,
									}))
								}
								className={inputClassName}
								required
							/>

							<input
								type="email"
								placeholder="Email"
								value={userForm.email}
								onChange={(event) =>
									setUserForm((currentForm) => ({
										...currentForm,
										email: event.target.value,
									}))
								}
								className={inputClassName}
								required
							/>

							<input
								type="password"
								minLength={6}
								placeholder="Password"
								value={userForm.password}
								onChange={(event) =>
									setUserForm((currentForm) => ({
										...currentForm,
										password: event.target.value,
									}))
								}
								className={inputClassName}
								required
							/>

							<button
								type="submit"
								disabled={creatingUser}
								className="btn btn-primary w-full disabled:cursor-not-allowed disabled:opacity-50"
							>
								{creatingUser ? "Creating user..." : "Add User"}
							</button>
						</form>
					</section>
				</div>

				<div className="mt-8 grid gap-8 lg:grid-cols-2">
					<section className="rounded-xl border border-primary/20 p-5">
						<div className="mb-4 flex items-center justify-between">
							<h2 className="text-xl font-bold">Products</h2>

							<span className="rounded-full bg-primary/10 px-3 py-1 text-sm text-primary">
								{products.length}
							</span>
						</div>

						{products.length === 0 ? (
							<p className="text-sm opacity-60">No products found.</p>
						) : (
							<div className="max-h-[500px] space-y-3 overflow-y-auto">
								{products.map((product) => (
									<article
										key={product._id}
										className="rounded-lg border border-primary/10 p-3"
									>
										<div className="flex items-start justify-between gap-4">
											<div className="min-w-0">
												<p className="font-semibold">{product.name}</p>

												<p className="text-sm text-primary">
													€{Number(product.price).toFixed(2)}
												</p>

												<p className="mt-1 line-clamp-2 text-sm opacity-60">
													{product.description}
												</p>

												{product.tags?.length > 0 && (
													<div className="mt-2 flex flex-wrap gap-1">
														{product.tags.map((tag) => (
															<span
																key={`${product._id}-${tag}`}
																className="rounded-full bg-primary/10 px-2 py-1 text-xs text-primary"
															>
																{tag}
															</span>
														))}
													</div>
												)}
											</div>

											<button
												type="button"
												disabled={deletingProductId === product._id}
												onClick={() =>
													void handleDeleteProduct(product._id, product.name)
												}
												className="shrink-0 text-sm font-semibold text-red-500 disabled:opacity-50"
											>
												{deletingProductId === product._id
													? "Deleting..."
													: "Delete"}
											</button>
										</div>
									</article>
								))}
							</div>
						)}
					</section>

					<section className="rounded-xl border border-primary/20 p-5">
						<div className="mb-4 flex items-center justify-between">
							<h2 className="text-xl font-bold">Users</h2>

							<span className="rounded-full bg-primary/10 px-3 py-1 text-sm text-primary">
								{users.length}
							</span>
						</div>

						{users.length === 0 ? (
							<p className="text-sm opacity-60">No users found.</p>
						) : (
							<div className="max-h-[500px] space-y-3 overflow-y-auto">
								{users.map((user) => (
									<article
										key={user._id}
										className="rounded-lg border border-primary/10 p-3"
									>
										<div className="flex items-start justify-between gap-4">
											<div className="min-w-0">
												<p className="font-semibold">
													{user.name} {user.surname}
												</p>

												<p className="break-all text-sm opacity-60">
													{user.email}
												</p>

												<span className="mt-2 inline-block rounded-full bg-primary/10 px-2 py-1 text-xs uppercase text-primary">
													{user.role}
												</span>
											</div>

											<button
												type="button"
												disabled={deletingUserId === user._id}
												onClick={() =>
													void handleDeleteUser(user._id, user.email)
												}
												className="shrink-0 text-sm font-semibold text-red-500 disabled:opacity-50"
											>
												{deletingUserId === user._id ? "Deleting..." : "Delete"}
											</button>
										</div>
									</article>
								))}
							</div>
						)}
					</section>
				</div>
			</div>
		</main>
	);
}
