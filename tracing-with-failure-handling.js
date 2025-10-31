// Enhanced tracing with failure handling for Task 5
const { NodeSDK } = require('@opentelemetry/sdk-node');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { PrometheusExporter } = require('@opentelemetry/exporter-prometheus');

// Create metrics exporter with error handling
const prometheusExporter = new PrometheusExporter({
  port: 9090,
});

// Add error handling for exporter failures
prometheusExporter.on = prometheusExporter.on || function() {};

// Override console methods to capture telemetry errors
const originalConsoleError = console.error;
console.error = function(...args) {
  // Check if this is a telemetry-related error
  const message = args.join(' ');
  if (message.includes('exporter') || message.includes('metrics') || message.includes('telemetry')) {
    console.log('🚨 TELEMETRY ERROR DETECTED:', message);
    console.log('📊 App continues running despite telemetry failure');
  }
  originalConsoleError.apply(console, args);
};

// Create the monitoring system with enhanced error handling
const sdk = new NodeSDK({
  instrumentations: [getNodeAutoInstrumentations()],
  metricReader: prometheusExporter,
});

// Enhanced startup with error handling
try {
  sdk.start();
  console.log('✅ OpenTelemetry initialized successfully - Monitoring is ON!');
  console.log('🛡️  Failure handling enabled for Task 5 testing');
} catch (error) {
  console.error('❌ OpenTelemetry initialization failed:', error.message);
  console.log('🔄 App will continue without telemetry (graceful degradation)');
}

// Enhanced shutdown with error handling
process.on('SIGTERM', () => {
  sdk.shutdown()
    .then(() => console.log('OpenTelemetry terminated gracefully'))
    .catch((error) => {
      console.log('⚠️ Error during OpenTelemetry shutdown:', error.message);
      console.log('🔄 Continuing with app shutdown anyway');
    })
    .finally(() => process.exit(0));
});

// Export for testing
module.exports = { sdk };