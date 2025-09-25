const axios = require('axios');

// Test different CJ Dropshipping API base URLs and endpoints
async function testCJEndpoints() {
  const apiKey = 'eb3bf74014604a0788dddaf0179446fa';
  
  const baseUrls = [
    'https://developers.cjdropshipping.com',
    'https://developers.cjdropshipping.com/en/api/api2',
    'https://api.cjdropshipping.com',
    'https://developers.cjdropshipping.com/api2',
    'https://developers.cjdropshipping.com/api',
  ];
  
  const endpoints = [
    '/product/categories',
    '/api2/product/categories',
    '/api/product/categories',
    '/categories',
    '/api2/categories',
    '/api/categories',
  ];
  
  console.log('Testing different CJ Dropshipping API configurations...\n');
  
  for (const baseUrl of baseUrls) {
    console.log(`\n=== Testing Base URL: ${baseUrl} ===`);
    
    for (const endpoint of endpoints) {
      try {
        const response = await axios.get(`${baseUrl}${endpoint}`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          timeout: 5000,
        });
        
        console.log(`✅ ${endpoint} - Status: ${response.status}`);
        if (response.data && typeof response.data === 'object') {
          console.log(`   Data type: ${typeof response.data}`);
          console.log(`   Data keys: ${Object.keys(response.data).slice(0, 5).join(', ')}...`);
        }
        
        // If we get a successful response, break out of the endpoint loop
        if (response.status === 200) {
          console.log(`   🎉 SUCCESS! Found working endpoint: ${baseUrl}${endpoint}`);
          break;
        }
        
      } catch (error) {
        if (error.response?.status === 404) {
          console.log(`❌ ${endpoint} - 404 Not Found`);
        } else if (error.response?.status === 401) {
          console.log(`🔒 ${endpoint} - 401 Unauthorized`);
        } else if (error.response?.status === 403) {
          console.log(`🚫 ${endpoint} - 403 Forbidden`);
        } else {
          console.log(`❌ ${endpoint} - Error: ${error.message}`);
        }
      }
    }
  }
}

// Run the test
testCJEndpoints().catch(console.error);
