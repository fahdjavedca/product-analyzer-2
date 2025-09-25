const axios = require('axios');

// Test CJ Dropshipping API v2.0 endpoints
async function testCJEndpointsV2() {
  const baseUrl = 'https://developers.cjdropshipping.com/api2.0/v1';
  const email = 'hello@repacked.co';
  const apiKey = 'eb3bf74014604a0788dddaf0179446fa';
  
  console.log('Testing CJ Dropshipping API v2.0 endpoints...\n');
  
  // First, get access token
  let accessToken;
  try {
    console.log('--- Getting Access Token ---');
    const authResponse = await axios.post(`${baseUrl}/authentication/getAccessToken`, {
      email: email,
      apiKey: apiKey,
    });
    
    if (authResponse.data.result === true) {
      accessToken = authResponse.data.data.accessToken;
      console.log('✅ Authentication successful');
      console.log('Access Token:', accessToken.substring(0, 20) + '...');
    } else {
      console.log('❌ Authentication failed:', authResponse.data.message);
      return;
    }
  } catch (error) {
    if (error.response?.status === 429) {
      console.log('❌ Rate limited - please wait 5 minutes');
      return;
    }
    console.log('❌ Authentication error:', error.message);
    return;
  }
  
  // Test different product endpoints
  const endpoints = [
    '/product/list',
    '/product/search',
    '/product/categories',
    '/product/category/list',
    '/product/info',
    '/product/detail',
    '/products',
    '/products/list',
    '/products/search',
  ];
  
  console.log('\n--- Testing Product Endpoints ---');
  for (const endpoint of endpoints) {
    try {
      console.log(`Testing: ${endpoint}`);
      
      const response = await axios.get(`${baseUrl}${endpoint}`, {
        headers: {
          'CJ-Access-Token': accessToken,
          'Content-Type': 'application/json',
        },
        params: {
          keyword: 'fitness',
          limit: 5,
        },
        timeout: 10000,
      });
      
      console.log(`  ✅ Status: ${response.status}`);
      console.log(`  Data keys: ${Object.keys(response.data).join(', ')}`);
      if (response.data.result !== undefined) {
        console.log(`  Result: ${response.data.result}`);
      }
      if (response.data.message) {
        console.log(`  Message: ${response.data.message}`);
      }
      
    } catch (error) {
      if (error.response?.status === 404) {
        console.log(`  ❌ 404 Not Found`);
      } else if (error.response?.status === 401) {
        console.log(`  🔒 401 Unauthorized`);
      } else if (error.response?.status === 403) {
        console.log(`  🚫 403 Forbidden`);
      } else {
        console.log(`  ❌ Error: ${error.message}`);
        if (error.response?.data?.message) {
          console.log(`  Message: ${error.response.data.message}`);
        }
      }
    }
  }
}

// Run the test
testCJEndpointsV2().catch(console.error);
