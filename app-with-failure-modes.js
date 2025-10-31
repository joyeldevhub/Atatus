// App with failure simulation modes for Task 5
require('./tracing-with-failure-handling');

const express = require('express');
const { trace } = require('@opentelemetry/api');

const app = express();
const PORT = 3001;

// Failure simulation flags
let simulateTraceFailure = false;
let simulateMetricsFailure = false;

// Sample orders data
const orders = [
  { id: 1, product: 'Laptop', amount: 999.99, status: 'completed' },
  { id: 2, product: 'Phone', amount: 599.99, status: 'pending' },
  { id: 3, product: 'Tablet', amount: 299.99, status: 'completed' }
];

// Helper function to safely get telemetry data
function getSafeTelemetry() {
  try {
    if (simulateTraceFailure) {
      throw new Error('Simulated trace failure');
    }
    
    const span = trace.getActiveSpan();
    const spanContext = span?.spanContext();
    return {
      traceId: spanContext?.traceId || 'trace-unavailable',
      spanId: spanContext?.spanId || 'span-unavailable',
      available: true
    };
  } catch (error) {
    console.log('🚨 Telemetry failure detected:', error.message);
    console.log('🔄 App continues with degraded telemetry');
    return {
      traceId: 'telemetry-failed',
      spanId: 'telemetry-failed', 
      available: false
    };
  }
}

// Control endpoint for failure simulation
app.get('/simulate-failure', (req, res) => {
  const mode = req.query.mode;
  
  switch(mode) {
    case 'trace':
      simulateTraceFailure = !simulateTraceFailure;
      console.log(`🎭 Trace failure simulation: ${simulateTraceFailure ? 'ON' : 'OFF'}`);
      break;
    case 'metrics':
      simulateMetricsFailure = !simulateMetricsFailure;
      console.log(`🎭 Metrics failure simulation: ${simulateMetricsFailure ? 'ON' : 'OFF'}`);
      break;
    case 'reset':
      simulateTraceFailure = false;
      simulateMetricsFailure = false;
      console.log('🔄 All failure simulations reset');
      break;
    default:
      return res.json({
        error: 'Invalid mode. Use: trace, metrics, or reset',
        current_state: {
          trace_failure: simulateTraceFailure,
          metrics_failure: simulateMetricsFailure
        }
      });
  }
  
  res.json({
    message: `Failure simulation updated`,
    trace_failure: simulateTraceFailure,
    metrics_failure: simulateMetricsFailure
  });
});

// Health endpoint with failure handling
app.get('/health', (req, res) => {
  const telemetry = getSafeTelemetry();
  
  console.log(`\n✅ === SUCCESS LOG ===`);
  console.log(`🏥 Health check - trace_id: ${telemetry.traceId}, span_id: ${telemetry.spanId}`);
  console.log(`📊 Telemetry Status: ${telemetry.available ? 'Working' : 'Degraded'}`);
  console.log(`⏰ Request Time: ${new Date().toISOString()}`);
  console.log(`==================\n`);
  
  res.json({ 
    status: 'ok', 
    trace_id: telemetry.traceId,
    span_id: telemetry.spanId,
    telemetry_available: telemetry.available,
    service_name: 'unknown-service',
    status_code: 0,
    timestamp: new Date().toISOString()
  });
});

// Orders endpoint with failure handling
app.get('/orders', (req, res) => {
  const telemetry = getSafeTelemetry();
  
  console.log(`\n✅ === SUCCESS LOG ===`);
  console.log(`📦 Orders request - trace_id: ${telemetry.traceId}, span_id: ${telemetry.spanId}`);
  console.log(`📊 Telemetry Status: ${telemetry.available ? 'Working' : 'Degraded'}`);
  console.log(`⏰ Request Time: ${new Date().toISOString()}`);
  console.log(`==================\n`);
  
  // Error simulation
  if (req.query.fail === 'true') {
    console.error(`\n🚨 === ERROR TRIGGERED ===`);
    console.error(`❌ ERROR simulated - trace_id: ${telemetry.traceId}, span_id: ${telemetry.spanId}, status.code: 2`);
    console.error(`📊 Telemetry Status: ${telemetry.available ? 'Working' : 'Degraded'}`);
    console.error(`⏰ Error Time: ${new Date().toISOString()}`);
    console.error(`🔗 Correlation: This error can be tracked using trace_id: ${telemetry.traceId}`);
    console.error(`========================\n`);
    
    return res.status(500).json({ 
      error: 'Simulated failure', 
      trace_id: telemetry.traceId,
      span_id: telemetry.spanId,
      telemetry_available: telemetry.available,
      service_name: 'unknown-service',
      status_code: 2,
      timestamp: new Date().toISOString()
    });
  }
  
  // Success response
  res.json({ 
    orders: orders, 
    trace_id: telemetry.traceId,
    span_id: telemetry.spanId,
    telemetry_available: telemetry.available,
    service_name: 'unknown-service',
    status_code: 0,
    message: 'Orders retrieved successfully',
    timestamp: new Date().toISOString()
  });
});

// Start the server
app.listen(PORT, () => {
  console.log('\n🚀 Server is running with failure simulation capabilities!');
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`📦 Orders: http://localhost:${PORT}/orders`);
  console.log(`💥 Error test: http://localhost:${PORT}/orders?fail=true`);
  console.log(`📊 Metrics: http://localhost:9090/metrics`);
  console.log(`🎭 Failure control: http://localhost:${PORT}/simulate-failure?mode=trace|metrics|reset`);
  console.log('\n✨ Ready for Task 5 failure testing!\n');
});