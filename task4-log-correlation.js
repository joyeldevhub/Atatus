// Task 4: Log Correlation - Trigger errors and verify trace_id/span_id correlation
const http = require('http');

const baseUrl = 'http://localhost:3001';

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const req = http.get(`${baseUrl}${path}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ 
            status: res.statusCode, 
            data: JSON.parse(data),
            timestamp: new Date().toISOString()
          });
        } catch (e) {
          resolve({ 
            status: res.statusCode, 
            data: data,
            timestamp: new Date().toISOString()
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

function validateLogCorrelation(response, testName) {
  console.log(`\n🔍 === ${testName} - LOG CORRELATION ===`);
  
  const data = response.data;
  const timestamp = response.timestamp;
  
  console.log(`⏰ Request Time: ${timestamp}`);
  console.log(`📊 HTTP Status: ${response.status}`);
  console.log(`🆔 trace_id: ${data.trace_id || 'MISSING'}`);
  console.log(`🔗 span_id: ${data.span_id || 'MISSING'}`);
  console.log(`⚡ status_code: ${data.status_code || 'MISSING'}`);
  
  if (response.status >= 400) {
    console.log(`❌ Error Message: ${data.error || 'No error message'}`);
    console.log(`🚨 This is an ERROR - Check server logs for matching trace_id/span_id`);
  } else {
    console.log(`✅ Success Response - Check server logs for matching trace_id/span_id`);
  }
  
  return {
    traceId: data.trace_id,
    spanId: data.span_id,
    statusCode: data.status_code,
    httpStatus: response.status,
    timestamp: timestamp,
    isError: response.status >= 400
  };
}

async function runLogCorrelationTest() {
  console.log('🧪 === TASK 4: LOG CORRELATION VALIDATION ===\n');
  
  console.log('📋 This test will:');
  console.log('   1. Make requests to trigger logs');
  console.log('   2. Capture trace_id/span_id from responses');
  console.log('   3. You verify the SAME IDs appear in server console logs');
  console.log('   4. Prove error correlation works\n');
  
  try {
    const correlationData = [];
    
    // Test 1: Successful request
    console.log('1️⃣ Testing successful request correlation...');
    const healthResponse = await makeRequest('/health');
    const healthCorrelation = validateLogCorrelation(healthResponse, 'HEALTH CHECK SUCCESS');
    correlationData.push(healthCorrelation);
    
    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test 2: Another successful request
    console.log('\n2️⃣ Testing orders request correlation...');
    const ordersResponse = await makeRequest('/orders');
    const ordersCorrelation = validateLogCorrelation(ordersResponse, 'ORDERS SUCCESS');
    correlationData.push(ordersCorrelation);
    
    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test 3: Error request (main focus for Task 4)
    console.log('\n3️⃣ Testing ERROR request correlation...');
    const errorResponse = await makeRequest('/orders?fail=true');
    const errorCorrelation = validateLogCorrelation(errorResponse, 'ORDERS ERROR');
    correlationData.push(errorCorrelation);
    
    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test 4: Another error to confirm pattern
    console.log('\n4️⃣ Testing second ERROR for pattern confirmation...');
    const error2Response = await makeRequest('/orders?fail=true');
    const error2Correlation = validateLogCorrelation(error2Response, 'ORDERS ERROR #2');
    correlationData.push(error2Correlation);
    
    // Summary and validation instructions
    console.log('\n📊 === CORRELATION SUMMARY ===');
    console.log('\n🔍 Trace IDs Generated:');
    correlationData.forEach((item, index) => {
      const status = item.isError ? '❌ ERROR' : '✅ SUCCESS';
      console.log(`   ${index + 1}. ${status} - trace_id: ${item.traceId?.substring(0, 8)}...`);
      console.log(`      span_id: ${item.spanId?.substring(0, 8)}... | time: ${item.timestamp.substring(11, 19)}`);
    });
    
    console.log('\n🎯 === MANUAL VERIFICATION REQUIRED ===');
    console.log('👀 CHECK YOUR SERVER CONSOLE LOGS NOW!');
    console.log('\n✅ For Task 4 SUCCESS, verify:');
    console.log('   1. Each trace_id above appears in server console logs');
    console.log('   2. Each span_id above appears in server console logs');
    console.log('   3. ERROR logs show "status.code: 2" in server console');
    console.log('   4. SUCCESS logs show normal operation in server console');
    console.log('   5. Timestamps roughly match between response and server logs');
    
    console.log('\n📝 Look for server log patterns like:');
    console.log('   "🏥 Health check - trace_id: abc123..., span_id: def456..."');
    console.log('   "❌ ERROR simulated - trace_id: abc123..., span_id: def456..., status.code: 2"');
    
    console.log('\n🎉 Log Correlation Test Complete!');
    console.log('💡 The correlation proves you can track requests across the entire system');
    
  } catch (err) {
    console.error('❌ Log correlation test failed:', err.message);
    console.log('💡 Make sure the server is running on port 3001');
  }
}

// Run the test
runLogCorrelationTest();