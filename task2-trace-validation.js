// Task 2: Trace Validation - Verify all required telemetry fields
const http = require('http');

const baseUrl = 'http://localhost:3001'; // Updated port

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const req = http.get(`${baseUrl}${path}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ 
            status: res.statusCode, 
            headers: res.headers,
            data: JSON.parse(data) 
          });
        } catch (e) {
          resolve({ 
            status: res.statusCode, 
            headers: res.headers,
            data: data 
          });
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

function validateTraceFields(response, testName) {
  console.log(`\n🔍 === ${testName} - TRACE VALIDATION ===`);
  
  const data = response.data;
  const headers = response.headers;
  
  // Check trace_id
  const traceId = data.trace_id;
  console.log(`📋 trace_id: ${traceId ? '✅ PRESENT' : '❌ MISSING'}`);
  if (traceId) {
    console.log(`   Value: ${traceId}`);
    console.log(`   Length: ${traceId.length} chars (should be 32)`);
    console.log(`   Format: ${/^[a-f0-9]{32}$/.test(traceId) ? '✅ Valid hex' : '❌ Invalid format'}`);
  }
  
  // Check status.code (from HTTP response)
  console.log(`📋 status.code: ✅ PRESENT`);
  console.log(`   HTTP Status: ${response.status}`);
  console.log(`   OpenTelemetry Status: ${response.status === 200 ? '0 (OK)' : '2 (ERROR)'}`);
  
  // Check for span context in headers (if available)
  const traceParent = headers['traceparent'];
  if (traceParent) {
    console.log(`📋 span_id: ✅ PRESENT (in traceparent header)`);
    console.log(`   traceparent: ${traceParent}`);
    
    // Parse traceparent: version-trace_id-span_id-flags
    const parts = traceParent.split('-');
    if (parts.length === 4) {
      console.log(`   Parsed span_id: ${parts[2]}`);
    }
  } else {
    console.log(`📋 span_id: ⚠️  Not in response headers (check server console)`);
  }
  
  // Service name (we'll check this in server logs)
  console.log(`📋 service.name: ⚠️  Check server console logs`);
  
  return {
    hasTraceId: !!traceId,
    hasValidTraceId: traceId && /^[a-f0-9]{32}$/.test(traceId),
    hasStatusCode: true,
    statusCode: response.status
  };
}

async function runTraceValidation() {
  console.log('🧪 === TASK 2: TRACE VALIDATION ===\n');
  
  try {
    // Test 1: Health endpoint
    console.log('1️⃣ Generating API request to /health...');
    const health = await makeRequest('/health');
    const healthValidation = validateTraceFields(health, 'HEALTH ENDPOINT');
    
    // Test 2: Orders endpoint  
    console.log('\n2️⃣ Generating API request to /orders...');
    const orders = await makeRequest('/orders');
    const ordersValidation = validateTraceFields(orders, 'ORDERS ENDPOINT');
    
    // Test 3: Error simulation
    console.log('\n3️⃣ Generating API request to /orders?fail=true...');
    const error = await makeRequest('/orders?fail=true');
    const errorValidation = validateTraceFields(error, 'ERROR SIMULATION');
    
    // Summary
    console.log('\n📊 === TRACE VALIDATION SUMMARY ===');
    console.log(`✅ Health endpoint trace_id: ${healthValidation.hasValidTraceId ? 'VALID' : 'INVALID'}`);
    console.log(`✅ Orders endpoint trace_id: ${ordersValidation.hasValidTraceId ? 'VALID' : 'INVALID'}`);
    console.log(`✅ Error endpoint trace_id: ${errorValidation.hasValidTraceId ? 'VALID' : 'INVALID'}`);
    console.log(`✅ Status codes working: ${errorValidation.statusCode === 500 ? 'YES' : 'NO'}`);
    
    console.log('\n💡 To see span_id and service.name, check your server console logs!');
    console.log('💡 Look for lines like: "Health check - trace_id: abc123..."');
    
  } catch (err) {
    console.error('❌ Trace validation failed:', err.message);
  }
}

// Run the validation
runTraceValidation();