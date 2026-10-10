import { randomBytes } from "node:crypto";

import {
	microsoftClient,
	microsoftRedirectUri,
} from "../config/microsoftAuth.js";

import User from "../models/user.js";

const MICROSOFT_SCOPES = ["openid", "profile", "email"];

const MICROSOFT_CONSUMER_TENANT_ID = "9188040d-6c67-4c5b-b112-36a304b66dad";

const GUID_REGEX =
	/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Convert callback-based session methods into promises.
const saveSession = (session) =>
	new Promise((resolve, reject) => {
		session.save((error) => {
			if (error) reject(error);
			else resolve();
		});
	});

const regenerateSession = (session) =>
	new Promise((resolve, reject) => {
		session.regenerate((error) => {
			if (error) reject(error);
			else resolve();
		});
	});

// Redirect only to the configured frontend.
const getFrontendUrl = () =>
	(process.env.FRONTEND_URL || "http://localhost:3000").replace(/\/$/, "");

const redirectToFrontend = (res, status) => {
	const url = new URL("/login", getFrontendUrl());
	url.searchParams.set("microsoft", status);

	return res.redirect(url.toString());
};

// Start the Microsoft Entra ID authorization flow.
export const startMicrosoftLogin = async (req, res) => {
	try {
		const state = randomBytes(32).toString("hex");

		// Generate PKCE parameters.
		const pkceCodes = await microsoftClient.cryptoProvider.generatePkceCodes();

		// Save temporary authentication data in the existing session.
		req.session.microsoftAuthState = state;
		req.session.microsoftPkceVerifier = pkceCodes.verifier;

		await saveSession(req.session);

		// Request an authorization code from Microsoft.
		const authorizationUrl = await microsoftClient.getAuthCodeUrl({
			scopes: MICROSOFT_SCOPES,
			redirectUri: microsoftRedirectUri,
			state,
			responseMode: "query",
			codeChallenge: pkceCodes.challenge,
			codeChallengeMethod: "S256",
		});

		return res.redirect(authorizationUrl);
	} catch (error) {
		console.error("Microsoft login initialization failed:", error.message);

		return res.status(500).json({
			message: "Unable to start Microsoft login",
		});
	}
};

// Handle the redirect from Microsoft Entra ID.
export const microsoftCallback = async (req, res) => {
	try {
		const { code, state, error } = req.query;

		// Handle an authentication error returned by Microsoft.
		if (error) {
			console.warn("Microsoft authentication was rejected");

			return redirectToFrontend(res, "failed");
		}

		// Validate the CSRF state and required PKCE verifier.
		if (
			typeof code !== "string" ||
			typeof state !== "string" ||
			!req.session?.microsoftAuthState ||
			state !== req.session.microsoftAuthState ||
			!req.session.microsoftPkceVerifier
		) {
			return res.status(400).json({
				message: "Invalid Microsoft authentication response",
			});
		}

		const codeVerifier = req.session.microsoftPkceVerifier;

		// Remove one-time authentication parameters before token exchange.
		delete req.session.microsoftAuthState;
		delete req.session.microsoftPkceVerifier;

		await saveSession(req.session);

		// Exchange the authorization code using PKCE.
		const tokenResponse = await microsoftClient.acquireTokenByCode({
			code,
			scopes: MICROSOFT_SCOPES,
			redirectUri: microsoftRedirectUri,
			codeVerifier,
		});

		if (!tokenResponse?.idTokenClaims) {
			return res.status(401).json({
				message: "Microsoft identity information is missing",
			});
		}

		// MSAL validates the ID token during the authorization code flow.
		const claims = tokenResponse.idTokenClaims;

		const tenantId = claims.tid;
		const objectId = claims.oid;

		// Require stable Microsoft identity identifiers.
		if (
			typeof tenantId !== "string" ||
			typeof objectId !== "string" ||
			!GUID_REGEX.test(tenantId) ||
			!GUID_REGEX.test(objectId)
		) {
			return res.status(401).json({
				message: "Invalid Microsoft identity",
			});
		}

		// Identify the account using tenant ID and object ID, not email.
		const microsoftId = `${tenantId}:${objectId}`;

		let user = await User.findOne({ microsoftId });

		if (!user) {
			// Microsoft email claims are optional and are not treated
			// as verified proof of ownership of an existing Kinetix account.
			const microsoftEmail =
				typeof claims.email === "string"
					? claims.email.trim().toLowerCase()
					: null;

			// Never link a Microsoft identity to an existing account by email.
			if (microsoftEmail) {
				const existingUser = await User.findOne({
					email: microsoftEmail,
				});

				if (existingUser) {
					return redirectToFrontend(res, "email-conflict");
				}
			}

			// Read optional profile information.
			const name =
				typeof claims.given_name === "string" && claims.given_name.trim()
					? claims.given_name.trim()
					: "Microsoft";

			const surname =
				typeof claims.family_name === "string" && claims.family_name.trim()
					? claims.family_name.trim()
					: "User";

			// Create a Microsoft-only account without a local password.
			// Do not store an unverified email claim.
			try {
				user = await User.create({
					microsoftId,
					name,
					surname,
					role: "user",
				});
			} catch (createError) {
				// Handle concurrent first-time logins safely.
				if (createError.code === 11000) {
					user = await User.findOne({ microsoftId });

					if (!user) {
						throw createError;
					}
				} else {
					throw createError;
				}
			}
		}

		// Generate a fresh session ID to prevent session fixation.
		await regenerateSession(req.session);

		// Store only the information required by Kinetix.
		req.session.user = {
			id: user._id.toString(),
			email: user.email ?? null,
			name: user.name,
			surname: user.surname,
			role: user.role,
		};

		await saveSession(req.session);

		// Return to the frontend after successful authentication.
		return res.redirect(`${getFrontendUrl()}/`);
	} catch (error) {
		// Never log authorization codes, tokens, or client secrets.
		console.error("Microsoft callback failed:", error.message);

		return redirectToFrontend(res, "failed");
	}
};
