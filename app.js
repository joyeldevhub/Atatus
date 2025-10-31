// STEP 1: Turn on monitoring BEFORE anything else
require('./tracing');

// STEP 2: Import what we need
const express = require('express');
const { trace } = require('@opentelemetry/api');

const app = express();
const PORT = 3001;

// Sample data - pretend this is from a database
const orders = [
  { id: 1, product: 'Laptop', amount: 999.99, status: 'completed' },
  { id: 2, product: 'Phone', amount: 599.99, status: 'pending' },
  { id: 3, product: 'Tablet', amount: 299.99, status: 'completed' }
];

// ENDPOINT 1: Health Check - "Is the app working?"
app.get('/health', (req, res) => {
  const span = trace.getActiveSpan(); // Get current "trace" (journey tracking)
  const spanContext = span?.spanContext();
  const traceId = spanContext?.traceId || 'no-trace';
  const spanId = spanContext?.spanId || 'no-span';
  
  console.log(`\n✅ === SUCCESS LOG ===`);
  console.log(`🏥 Health check - trace_id: ${traceId}, span_id: ${spanId}, service.name: unknown-service`);
  console.log(`⏰ Request Time: ${new Date().toISOString()}`);
  console.log(`==================\n`);
  
  res.json({ 
    status: 'ok', 
    trace_id: traceId,
    span_id: spanId,
    service_name: 'unknown-service',
    status_code: 0,
    timestamp: new Date().toISOString()
  });
});

// ENDPOINT 2: Get Orders - "Show me the orders"
app.get('/orders', (req, res) => {
  const span = trace.getActiveSpan();
  const spanContext = span?.spanContext();
  const traceId = spanContext?.traceId || 'no-trace';
  const spanId = spanContext?.spanId || 'no-span';
  
  console.log(`\n✅ === SUCCESS LOG ===`);
  console.log(`📦 Orders request - trace_id: ${traceId}, span_id: ${spanId}, service.name: unknown-service`);
  console.log(`⏰ Request Time: ${new Date().toISOString()}`);
  console.log(`==================\n`);
  
  // Check if user wants to simulate an error
  if (req.query.fail === 'true') {
    console.error(`\n🚨 === ERROR TRIGGERED ===`);
    console.error(`❌ ERROR simulated - trace_id: ${traceId}, span_id: ${spanId}, status.code: 2`);
    console.error(`⏰ Error Time: ${new Date().toISOString()}`);
    console.error(`🔗 Correlation: This error can be tracked using trace_id: ${traceId}`);
    console.error(`========================\n`);
    
    span?.setStatus({ code: 2, message: 'Simulated error' }); // Mark as error
    return res.status(500).json({ 
      error: 'Simulated failure', 
      trace_id: traceId,
      span_id: spanId,
      service_name: 'unknown-service',
      status_code: 2,
      timestamp: new Date().toISOString()
    });
  }
  
  // Return successful response
  res.json({ 
    orders: orders, 
    trace_id: traceId,
    span_id: spanId,
    service_name: 'unknown-service',
    status_code: 0,
    message: 'Orders retrieved successfully',
    timestamp: new Date().toISOString()
  });
});

// Start the server
app.listen(PORT, () => {
  console.log('\n🚀 Server is running!');
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`📦 Orders: http://localhost:${PORT}/orders`);
  console.log(`💥 Error test: http://localhost:${PORT}/orders?fail=true`);
  console.log(`📊 Metrics: http://localhost:9090/metrics`);
  console.log('\n✨ Ready for testing!\n');
});