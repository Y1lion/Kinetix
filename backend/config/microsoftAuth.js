import { ConfidentialClientApplication } from "@azure/msal-node";

const clientId = process.env.MICROSOFT_CLIENT_ID;
const tenantId = process.env.MICROSOFT_TENANT_ID;
const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;
const redirectUri = process.env.MICROSOFT_REDIRECT_URI;

// Validate the required Microsoft Entra ID configuration.
if (!clientId || !tenantId || !clientSecret || !redirectUri) {
	throw new Error("Microsoft Entra ID configuration is incomplete");
}

// Configure MSAL for the OAuth 2.0 authorization code flow.
export const microsoftAuthConfig = {
	auth: {
		clientId,
		// Support organizational and personal Microsoft accounts.
		authority: "https://login.microsoftonline.com/common",
		clientSecret,
	},
};

export const microsoftClient = new ConfidentialClientApplication(
	microsoftAuthConfig,
);

export const microsoftRedirectUri = redirectUri;
