import express from "express";
import {
	register,
	login,
	getCurrentUser,
	logout,
} from "../controllers/authController.js";
import {
	startMicrosoftLogin,
	microsoftCallback,
} from "../controllers/microsoftAuthController.js";

import { requireAuth } from "../middleware/requireAuth.js";

const router = express.Router();

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     description: Creates a new user profile in MongoDB Atlas and hashes the password.
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - surname
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 example: Mario
 *               surname:
 *                 type: string
 *                 example: Rossi
 *               email:
 *                 type: string
 *                 format: email
 *                 example: mario.rossi@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "SecurePass123!"
 *     responses:
 *       201:
 *         description: User registered successfully.
 *       400:
 *         description: Invalid input data.
 *       409:
 *         description: Email already exists.
 *       500:
 *         description: Internal server error.
 */
router.post("/register", register);
/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     summary: Log in an existing user
 *     description: Authenticates the user and creates a persistent session stored in MongoDB.
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: mario.rossi@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "SecurePass123!"
 *     responses:
 *       200:
 *         description: Login successful. Returns user data.
 *       400:
 *         description: Missing email or password in the request.
 *       401:
 *         description: Invalid email or password (Authentication failed).
 *       500:
 *         description: Internal server error.
 */
router.post("/login", login);
/**
 * @openapi
 * /api/auth/me:
 *   get:
 *     summary: Get the current authenticated user
 *     description: Returns the user stored in the current session.
 *     tags:
 *       - Authentication
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Current authenticated user returned successfully.
 *       401:
 *         description: User not authenticated.
 *       500:
 *         description: Internal server error.
 */
router.get("/me", requireAuth, getCurrentUser);

/**
 * @openapi
 * /api/auth/logout:
 *   post:
 *     summary: Log out the current user
 *     description: Destroys the current user session and clears the session cookie.
 *     tags:
 *       - Authentication
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Logout successful.
 *       401:
 *         description: User not authenticated.
 *       500:
 *         description: Unable to destroy the session.
 */
router.post("/logout", requireAuth, logout);

/**
 * @openapi
 * /api/auth/microsoft:
 *   get:
 *     summary: Sign in with Microsoft
 *     description: >
 *       Starts the Microsoft Entra ID authentication flow using
 *       OAuth 2.0 Authorization Code with PKCE.
 *       Redirects the browser to the Microsoft sign-in page.
 *       Supports organizational and personal Microsoft accounts.
 *     tags:
 *       - Authentication
 *     responses:
 *       302:
 *         description: Redirects the browser to Microsoft Entra ID.
 *         headers:
 *           Location:
 *             description: Microsoft authorization URL.
 *             schema:
 *               type: string
 *               format: uri
 *       500:
 *         description: Unable to start Microsoft authentication.
 */
router.get("/microsoft", startMicrosoftLogin);

/**
 * @openapi
 * /api/auth/microsoft/callback:
 *   get:
 *     summary: Microsoft authentication callback
 *     description: >
 *       Handles the authorization response from Microsoft Entra ID.
 *       Validates the OAuth state, exchanges the authorization code
 *       using PKCE, identifies or creates the corresponding MongoDB
 *       user, and establishes a Kinetix session.
 *       Redirects the browser to the frontend after authentication.
 *       This endpoint is intended to be called by Microsoft Entra ID,
 *       not directly by the frontend.
 *     tags:
 *       - Authentication
 *     parameters:
 *       - in: query
 *         name: code
 *         required: false
 *         description: Authorization code returned by Microsoft after successful authentication.
 *         schema:
 *           type: string
 *       - in: query
 *         name: state
 *         required: false
 *         description: CSRF protection value generated when authentication started.
 *         schema:
 *           type: string
 *       - in: query
 *         name: error
 *         required: false
 *         description: Error identifier returned by Microsoft when authentication fails.
 *         schema:
 *           type: string
 *     responses:
 *       302:
 *         description: >
 *           Redirects to the frontend after successful authentication
 *           or to the login page when authentication fails or an email
 *           conflict is detected.
 *         headers:
 *           Location:
 *             description: Frontend redirect URL.
 *             schema:
 *               type: string
 *               format: uri
 *       400:
 *         description: Invalid authorization response, state, or PKCE parameters.
 *       401:
 *         description: Missing or invalid Microsoft identity information.
 */
router.get("/microsoft/callback", microsoftCallback);

export default router;
