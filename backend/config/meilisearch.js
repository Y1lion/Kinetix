import { Meilisearch } from "meilisearch";

let client;

function getClient() {
	if (!client) {
		const host = process.env.MEILI_HOST;
		const apiKey = process.env.MEILI_MASTER_KEY;

		if (!host) {
			throw new Error("MEILI_HOST environment variable is not defined");
		}

		if (!apiKey) {
			throw new Error("MEILI_MASTER_KEY environment variable is not defined");
		}

		client = new Meilisearch({
			host,
			apiKey,
		});
	}

	return client;
}

export const meili = new Proxy(
	{},
	{
		get(_target, property) {
			return getClient()[property];
		},
	},
);
