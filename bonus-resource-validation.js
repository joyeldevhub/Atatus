// Bonus: Resource Attributes Validation
const http = require('http');

const baseUrl = 'http://localhost:3001';
const metricsUrl = 'http://localhost:9090/metrics';

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ 
            status: res.statusCode, 
            data: url.includes('/metrics') ? data : JSON.parse(data)
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

function validateResourceAttributes(metricsText) {
  console.log('\n🏷️ === RESOURCE ATTRIBUTES VALIDATION ===\n');
  
  const lines = metricsText.split('\n');
  const resourceMetrics = lines.filter(line => 
    line.includes('service_name') || 
    line.includes('service_version') || 
    line.includes('deployment_environment') ||
    line.includes('service_namespace') ||
    line.includes('service_instance_id')
  );
  
  // Expected resource attributes
  const expectedAttributes = {
    'service_name': 'orders-api',
    'service_version': '1.2.3', 
    'deployment_environment': 'development',
    'service_namespace': 'ecommerce',
    'service_instance_id': 'orders-api-001'
  };
  
  console.log('🔍 Checking for resource attributes in metrics...');
  
  const foundAttributes = {};
  
  for (const [key, expectedValue] of Object.entries(expectedAttributes)) {
    const found = resourceMetrics.some(line => 
      line.includes(key) && line.includes(expectedValue)
    );
    
    foundAttributes[key] = found;
    console.log(`   ${key}: ${found ? '✅ FOUND' : '❌ MISSING'} (expected: ${expectedValue})`);
  }
  
  // Check for custom attributes
  console.log('\n🎯 Checking for custom attributes...');
  const customAttributes = ['deployment_region', 'team_name', 'git_commit'];
  
  customAttributes.forEach(attr => {
    const found = lines.some(line => line.includes(attr));
    console.log(`   ${attr}: ${found ? '✅ FOUND' : '❌ MISSING'}`);
  });
  
  const totalExpected = Object.keys(expectedAttributes).length;
  const totalFound = Object.values(foundAttributes).filter(Boolean).length;
  
  console.log(`\n📊 Resource Attributes Summary:`);
  console.log(`   Found: ${totalFound}/${totalExpected} (${(totalFound/totalExpected*100).toFixed(1)}%)`);
  
  return {
    expectedAttributes,
    foundAttributes,
    score: totalFound / totalExpected
  };
}

async function runResourceValidation() {
  console.log('🎁 === BONUS: RESOURCE ATTRIBUTES VALIDATION ===\n');
  
  try {
    // First, make a request to generate telemetry
    console.log('1️⃣ Generating telemetry data...');
    await makeRequest(`${baseUrl}/health`);
    await makeRequest(`${baseUrl}/orders`);
    
    // Wait for metrics to be collected
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Fetch metrics
    console.log('\n2️⃣ Fetching metrics with resource attributes...');
    const metricsResponse = await makeRequest(metricsUrl);
    
    if (metricsResponse.status !== 200) {
      throw new Error(`Metrics endpoint returned ${metricsResponse.status}`);
    }
    
    // Validate resource attributes
    const validation = validateResourceAttributes(metricsResponse.data);
    
    // Test endpoint response for resource info
    console.log('\n3️⃣ Validating resource info in responses...');
    const healthResponse = await makeRequest(`${baseUrl}/health`);
    
    if (healthResponse.status === 200) {
      const serviceName = healthResponse.data.service_name;
      console.log(`   Service Name in Response: ${serviceName} ${serviceName === 'orders-api' ? '✅' : '❌'}`);
    }
    
    // Final assessment
    console.log('\n🎯 === RESOURCE VALIDATION RESULTS ===');
    console.log(`✅ Resource Attributes: ${validation.score >= 0.8 ? 'PASS' : 'FAIL'} (${(validation.score*100).toFixed(1)}%)`);
    console.log(`✅ Service Identification: ${validation.foundAttributes.service_name ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Version Tracking: ${validation.foundAttributes.service_version ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Environment Labeling: ${validation.foundAttributes.deployment_environment ? 'PASS' : 'FAIL'}`);
    
    console.log('\n💡 Benefits of Resource Attributes:');
    console.log('   • Service discovery and identification');
    console.log('   • Environment-based filtering and alerting');
    console.log('   • Version tracking for deployments');
    console.log('   • Multi-tenant service organization');
    
  } catch (error) {
    console.error('❌ Resource validation failed:', error.message);
    console.log('💡 Make sure to use tracing-with-resources.js for enhanced attributes');
  }
}

// Run validation
runResourceValidation();