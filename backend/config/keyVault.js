import { SecretClient } from "@azure/keyvault-secrets";
import { DefaultAzureCredential } from "@azure/identity";

/**
 * Loads production secrets from Azure Key Vault into environment variables.
 *
 * Local development:
 * - If AZURE_KEYVAULT_NAME is not defined, the application keeps using
 *   the environment variables loaded from the local .env file.
 *
 * Azure production:
 * - Azure Container Apps uses a Managed Identity.
 * - DefaultAzureCredential automatically uses that identity.
 * - Secrets are retrieved from Azure Key Vault.
 */
export async function loadKeyVaultSecrets() {
	const vaultName = process.env.AZURE_KEYVAULT_NAME;

	// Local development: use environment variables from .env
	if (!vaultName) {
		console.log(
			"AZURE_KEYVAULT_NAME is not defined. Using local environment variables.",
		);
		return;
	}

	const vaultUrl = `https://${vaultName}.vault.azure.net`;

	// DefaultAzureCredential uses Managed Identity when running on Azure.
	const credential = new DefaultAzureCredential();
	const client = new SecretClient(vaultUrl, credential);

	console.log(`Connecting to Azure Key Vault: ${vaultName}...`);

	/**
	 * Maps Azure Key Vault secret names to the environment variables
	 * expected by the Kinetix backend.
	 */
	const secretMappings = {
		"mongo-uri": "MONGO_URI",
		"session-secret": "SESSION_SECRET",
		"meili-master-key": "MEILI_MASTER_KEY",
		"azure-language-key": "AZURE_LANGUAGE_KEY",
		"azure-vision-key": "AZURE_VISION_KEY",
	};

	try {
		for (const [secretName, envVarName] of Object.entries(secretMappings)) {
			const secret = await client.getSecret(secretName);

			if (!secret.value) {
				throw new Error(`Secret '${secretName}' does not contain a value.`);
			}

			process.env[envVarName] = secret.value;
		}

		console.log("Secrets successfully loaded from Azure Key Vault.");
	} catch (error) {
		console.error(
			"Failed to load secrets from Azure Key Vault:",
			error.message,
		);

		throw error;
	}
}
