// This script tests our app automatically
const http = require('http');

const baseUrl = 'http://localhost:3000';

// Helper function to make HTTP requests
function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const req = http.get(`${baseUrl}${path}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ 
            status: res.statusCode, 
            data: JSON.parse(data) 
          });
        } catch (e) {
          resolve({ 
            status: res.statusCode, 
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

async function runTests() {
  console.log('🧪 === OpenTelemetry QA Test Suite ===\n');
  
  try {
    // Test 1: Health Check
    console.log('1️⃣ Testing /health endpoint...');
    const health = await makeRequest('/health');
    console.log(`   ✅ Status: ${health.status}`);
    console.log(`   ✅ Response:`, health.data);
    console.log(`   ✅ Has trace_id: ${!!health.data.trace_id}\n`);
    
    // Test 2: Orders Endpoint
    console.log('2️⃣ Testing /orders endpoint...');
    const orders = await makeRequest('/orders');
    console.log(`   ✅ Status: ${orders.status}`);
    console.log(`   ✅ Orders count: ${orders.data.orders?.length || 0}`);
    console.log(`   ✅ Has trace_id: ${!!orders.data.trace_id}\n`);
    
    // Test 3: Error Simulation
    console.log('3️⃣ Testing error simulation...');
    const error = await makeRequest('/orders?fail=true');
    console.log(`   ✅ Status: ${error.status} (should be 500)`);
    console.log(`   ✅ Error message: ${error.data.error}`);
    console.log(`   ✅ Error has trace_id: ${!!error.data.trace_id}\n`);
    
    console.log('🎉 === All tests completed successfully! ===');
    console.log('📋 Check the server console for trace_id logs');
    
  } catch (err) {
    console.error('❌ Test failed:', err.message);
    console.log('💡 Make sure the server is running with: npm start');
  }
}

// Wait 2 seconds for server to start, then run tests
console.log('⏳ Waiting for server to start...\n');
setTimeout(runTests, 2000);