// Enhanced tracing with resource attributes for bonus validation
const { NodeSDK } = require('@opentelemetry/sdk-node');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { PrometheusExporter } = require('@opentelemetry/exporter-prometheus');
const { Resource } = require('@opentelemetry/resources');
const { SemanticResourceAttributes } = require('@opentelemetry/semantic-conventions');

// Create resource with deployment attributes
const resource = new Resource({
  [SemanticResourceAttributes.SERVICE_NAME]: 'orders-api',
  [SemanticResourceAttributes.SERVICE_VERSION]: '1.2.3',
  [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: 'development',
  [SemanticResourceAttributes.SERVICE_NAMESPACE]: 'ecommerce',
  [SemanticResourceAttributes.SERVICE_INSTANCE_ID]: 'orders-api-001',
  'deployment.region': 'us-east-1',
  'team.name': 'platform-team',
  'git.commit': 'abc123def456'
});

// Create metrics exporter
const prometheusExporter = new PrometheusExporter({
  port: 9090,
});

// Create the monitoring system with resource attributes
const sdk = new NodeSDK({
  resource: resource,
  instrumentations: [getNodeAutoInstrumentations()],
  metricReader: prometheusExporter,
});

// Start with enhanced logging
try {
  sdk.start();
  console.log('✅ OpenTelemetry initialized with resource attributes!');
  console.log('🏷️  Service Name:', resource.attributes[SemanticResourceAttributes.SERVICE_NAME]);
  console.log('🔢 Service Version:', resource.attributes[SemanticResourceAttributes.SERVICE_VERSION]);
  console.log('🌍 Environment:', resource.attributes[SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]);
  console.log('📦 Namespace:', resource.attributes[SemanticResourceAttributes.SERVICE_NAMESPACE]);
} catch (error) {
  console.error('❌ OpenTelemetry initialization failed:', error.message);
}

// Enhanced shutdown
process.on('SIGTERM', () => {
  sdk.shutdown()
    .then(() => console.log('OpenTelemetry terminated gracefully'))
    .catch((error) => console.log('Error during shutdown:', error.message))
    .finally(() => process.exit(0));
});

// Export resource for validation
module.exports = { sdk, resource };