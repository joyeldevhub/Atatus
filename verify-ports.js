// Port Verification Script - This checks if our app is working correctly
const http = require('http');

// Test function to check if a port responds
function checkPort(port, path = '/') {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${port}${path}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          port: port,
          status: res.statusCode,
          working: res.statusCode === 200,
          response: data
        });
      });
    });
    
    req.on('error', () => {
      resolve({
        port: port,
        status: 'ERROR',
        working: false,
        response: 'Port not responding'
      });
    });
    
    req.setTimeout(3000, () => {
      req.destroy();
      resolve({
        port: port,
        status: 'TIMEOUT',
        working: false,
        response: 'Request timeout'
      });
    });
  });
}

async function verifyAllPorts() {
  console.log('🔍 === PORT VERIFICATION TEST ===\n');
  
  // Test our main app port
  console.log('Testing Port 3001 (Main App)...');
  const healthCheck = await checkPort(3001, '/health');
  console.log(`   Port 3001: ${healthCheck.working ? '✅ WORKING' : '❌ FAILED'}`);
  console.log(`   Status: ${healthCheck.status}`);
  if (healthCheck.working) {
    const response = JSON.parse(healthCheck.response);
    console.log(`   Response: ${response.status}`);
    console.log(`   Trace ID: ${response.trace_id ? 'Present' : 'Missing'}`);
  }
  console.log('');
  
  // Test orders endpoint
  console.log('Testing Orders Endpoint...');
  const ordersCheck = await checkPort(3001, '/orders');
  console.log(`   Orders: ${ordersCheck.working ? '✅ WORKING' : '❌ FAILED'}`);
  console.log(`   Status: ${ordersCheck.status}`);
  console.log('');
  
  // Test error simulation
  console.log('Testing Error Simulation...');
  const errorCheck = await checkPort(3001, '/orders?fail=true');
  console.log(`   Error Test: ${errorCheck.status === 500 ? '✅ WORKING' : '❌ FAILED'}`);
  console.log(`   Status: ${errorCheck.status} (should be 500)`);
  console.log('');
  
  console.log('📊 === VERIFICATION COMPLETE ===');
}

// Run the verification
verifyAllPorts();