// Task 3: Metrics Validation - Verify runtime and HTTP metrics
const http = require('http');

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({ 
          status: res.statusCode, 
          data: data 
        });
      });
    });
    req.on('error', reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

function parseMetrics(metricsText) {
  const lines = metricsText.split('\n');
  const metrics = {};
  
  for (const line of lines) {
    if (line.startsWith('#') || !line.trim()) continue;
    
    const spaceIndex = line.indexOf(' ');
    if (spaceIndex > 0) {
      const metricName = line.substring(0, spaceIndex);
      const value = line.substring(spaceIndex + 1);
      metrics[metricName] = parseFloat(value) || value;
    }
  }
  
  return metrics;
}

function validateMetrics(metrics) {
  console.log('\n📊 === METRICS VALIDATION ===\n');
  
  // Check for Node.js runtime metrics
  console.log('🔍 Node.js Runtime Metrics:');
  
  // Event loop lag
  const eventLoopMetrics = Object.keys(metrics).filter(key => 
    key.includes('eventloop') || key.includes('lag') || key.includes('nodejs_eventloop')
  );
  console.log(`   📈 Event Loop Lag: ${eventLoopMetrics.length > 0 ? '✅ FOUND' : '❌ MISSING'}`);
  eventLoopMetrics.forEach(metric => {
    console.log(`      ${metric}: ${metrics[metric]}`);
  });
  
  // Memory metrics
  const memoryMetrics = Object.keys(metrics).filter(key => 
    key.includes('memory') || key.includes('heap') || key.includes('nodejs_heap')
  );
  console.log(`   🧠 Memory Metrics: ${memoryMetrics.length > 0 ? '✅ FOUND' : '❌ MISSING'}`);
  memoryMetrics.slice(0, 3).forEach(metric => {
    console.log(`      ${metric}: ${metrics[metric]}`);
  });
  
  // Process metrics
  const processMetrics = Object.keys(metrics).filter(key => 
    key.includes('process') || key.includes('cpu') || key.includes('nodejs_version')
  );
  console.log(`   ⚙️  Process Metrics: ${processMetrics.length > 0 ? '✅ FOUND' : '❌ MISSING'}`);
  processMetrics.slice(0, 2).forEach(metric => {
    console.log(`      ${metric}: ${metrics[metric]}`);
  });
  
  console.log('\n🌐 HTTP Metrics:');
  
  // HTTP request metrics
  const httpMetrics = Object.keys(metrics).filter(key => 
    key.includes('http') && (key.includes('request') || key.includes('duration') || key.includes('total'))
  );
  console.log(`   📡 HTTP Request Metrics: ${httpMetrics.length > 0 ? '✅ FOUND' : '❌ MISSING'}`);
  httpMetrics.slice(0, 3).forEach(metric => {
    console.log(`      ${metric}: ${metrics[metric]}`);
  });
  
  return {
    hasEventLoop: eventLoopMetrics.length > 0,
    hasMemory: memoryMetrics.length > 0,
    hasProcess: processMetrics.length > 0,
    hasHttp: httpMetrics.length > 0,
    totalMetrics: Object.keys(metrics).length
  };
}

async function runMetricsValidation() {
  console.log('🧪 === TASK 3: METRICS VALIDATION ===\n');
  
  try {
    // Step 1: Generate some HTTP traffic to create metrics
    console.log('1️⃣ Generating HTTP traffic to create metrics...');
    
    await makeRequest('http://localhost:3001/health');
    await makeRequest('http://localhost:3001/orders');
    await makeRequest('http://localhost:3001/orders?fail=true');
    
    console.log('   ✅ Generated requests to /health, /orders, /orders?fail=true');
    
    // Step 2: Wait a moment for metrics to be collected
    console.log('\n2️⃣ Waiting for metrics collection...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Step 3: Fetch metrics from Prometheus endpoint
    console.log('\n3️⃣ Fetching metrics from http://localhost:9090/metrics...');
    const metricsResponse = await makeRequest('http://localhost:9090/metrics');
    
    if (metricsResponse.status !== 200) {
      throw new Error(`Metrics endpoint returned status ${metricsResponse.status}`);
    }
    
    console.log('   ✅ Metrics endpoint responding');
    console.log(`   📊 Raw metrics size: ${metricsResponse.data.length} characters`);
    
    // Step 4: Parse and validate metrics
    const metrics = parseMetrics(metricsResponse.data);
    const validation = validateMetrics(metrics);
    
    // Step 5: Summary
    console.log('\n📋 === VALIDATION SUMMARY ===');
    console.log(`✅ Event Loop Metrics: ${validation.hasEventLoop ? 'PRESENT' : 'MISSING'}`);
    console.log(`✅ Memory Metrics: ${validation.hasMemory ? 'PRESENT' : 'MISSING'}`);
    console.log(`✅ Process Metrics: ${validation.hasProcess ? 'PRESENT' : 'MISSING'}`);
    console.log(`✅ HTTP Metrics: ${validation.hasHttp ? 'PRESENT' : 'MISSING'}`);
    console.log(`📊 Total Metrics Found: ${validation.totalMetrics}`);
    
    console.log('\n🎉 Task 3 Metrics Validation Complete!');
    console.log('💡 You can view all metrics at: http://localhost:9090/metrics');
    
  } catch (err) {
    console.error('❌ Metrics validation failed:', err.message);
    console.log('💡 Make sure the server is running and metrics port 9090 is available');
  }
}

// Run the validation
runMetricsValidation();