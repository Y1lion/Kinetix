import dotenv from "dotenv";
import { loadKeyVaultSecrets } from "./config/keyVault.js";
import { initApplicationInsights } from "./config/applicationInsights.js";

dotenv.config({ path: "../.env" });

// In Azure, load production secrets from Key Vault using Managed Identity.
// In local development, this function does nothing and .env is used instead.
await loadKeyVaultSecrets();

// Initialize Azure Application Insights after secrets have been loaded.
initApplicationInsights();

// Load server.js only after Application Insights initialization
await import("./server.js");
