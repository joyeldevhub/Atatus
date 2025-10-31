// This file sets up OpenTelemetry - think of it as "turning on the monitoring"
const { NodeSDK } = require('@opentelemetry/sdk-node');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { PrometheusExporter } = require('@opentelemetry/exporter-prometheus');

// Create metrics exporter (exposes metrics at /metrics endpoint)
const prometheusExporter = new PrometheusExporter({
  port: 9090, // Metrics available at http://localhost:9090/metrics
});

// Create the monitoring system
const sdk = new NodeSDK({
  instrumentations: [getNodeAutoInstrumentations()], // Auto-detect what to monitor
  metricReader: prometheusExporter, // Export metrics in Prometheus format
});

// Start monitoring
sdk.start();
console.log('✅ OpenTelemetry initialized successfully - Monitoring is ON!');

// Clean shutdown when app stops
process.on('SIGTERM', () => {
  sdk.shutdown()
    .then(() => console.log('OpenTelemetry terminated'))
    .catch((error) => console.log('Error terminating OpenTelemetry', error))
    .finally(() => process.exit(0));
});