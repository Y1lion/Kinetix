import appInsights from "applicationinsights";

/**
 * Initializes Azure Application Insights telemetry.
 *
 * If the connection string is not available, telemetry is disabled.
 * This allows the application to run locally without Application Insights.
 */
export function initApplicationInsights() {
	const connectionString = process.env.APPLICATIONINSIGHTS_CONNECTION_STRING;

	if (!connectionString) {
		console.log(
			"APPLICATIONINSIGHTS_CONNECTION_STRING is not defined. Application Insights is disabled.",
		);
		return;
	}

	try {
		appInsights
			.setup(connectionString)
			.setAutoCollectRequests(true)
			.setAutoCollectPerformance(true, true)
			.setAutoCollectExceptions(true)
			.setAutoCollectDependencies(true)
			.setAutoCollectConsole(true, true)
			.setSendLiveMetrics(true)
			.start();

		console.log("Azure Application Insights initialized successfully.");
	} catch (error) {
		console.error(
			"Failed to initialize Azure Application Insights:",
			error.message,
		);
	}
}
