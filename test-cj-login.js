const axios = require('axios');

// Test CJ Dropshipping login/authentication endpoints
async function testCJLogin() {
  const baseUrl = 'https://developers.cjdropshipping.com/api';
  const apiKey = 'eb3bf74014604a0788dddaf0179446fa';
  
  console.log('Testing CJ Dropshipping login/authentication endpoints...\n');
  
  const loginEndpoints = [
    '/auth/login',
    '/api2/auth/login',
    '/login',
    '/auth',
    '/api2/login',
    '/user/login',
    '/api/login',
  ];
  
  const loginMethods = [
    { name: 'POST with API Key', method: 'POST', data: { apiKey: apiKey } },
    { name: 'POST with Key', method: 'POST', data: { key: apiKey } },
    { name: 'POST with Token', method: 'POST', data: { token: apiKey } },
    { name: 'POST with Password', method: 'POST', data: { password: apiKey } },
    { name: 'GET with API Key', method: 'GET', params: { apiKey: apiKey } },
    { name: 'GET with Key', method: 'GET', params: { key: apiKey } },
  ];
  
  for (const endpoint of loginEndpoints) {
    console.log(`\n=== Testing Endpoint: ${endpoint} ===`);
    
    for (const method of loginMethods) {
      try {
        console.log(`  Testing: ${method.name}`);
        
        const config = {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 5000,
        };
        
        if (method.data) {
          config.data = method.data;
        }
        
        if (method.params) {
          config.params = method.params;
        }
        
        let response;
        if (method.method === 'POST') {
          response = await axios.post(`${baseUrl}${endpoint}`, method.data, config);
        } else {
          response = await axios.get(`${baseUrl}${endpoint}`, config);
        }
        
        console.log(`    ✅ Status: ${response.status}`);
        console.log(`    Data: ${JSON.stringify(response.data).substring(0, 200)}...`);
        
        if (response.data && response.data.result !== false && response.data.result !== undefined) {
          console.log(`    🎉 SUCCESS! Found working login method: ${method.name} at ${endpoint}`);
        }
        
      } catch (error) {
        console.log(`    ❌ Error: ${error.message}`);
        if (error.response?.data) {
          console.log(`    Response: ${JSON.stringify(error.response.data).substring(0, 100)}...`);
        }
      }
    }
  }
}

// Run the test
testCJLogin().catch(console.error);
