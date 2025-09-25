const axios = require('axios');

// Test CJ Dropshipping public endpoints (no authentication)
async function testCJPublic() {
  const baseUrl = 'https://developers.cjdropshipping.com/api';
  
  console.log('Testing CJ Dropshipping public endpoints (no authentication)...\n');
  
  const publicEndpoints = [
    '/',
    '/health',
    '/status',
    '/info',
    '/version',
    '/docs',
    '/api',
    '/product/categories',
    '/categories',
    '/products',
    '/product/list',
    '/product/search',
  ];
  
  for (const endpoint of publicEndpoints) {
    try {
      console.log(`Testing: ${endpoint}`);
      
      const response = await axios.get(`${baseUrl}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 5000,
      });
      
      console.log(`  ✅ Status: ${response.status}`);
      console.log(`  Data: ${JSON.stringify(response.data).substring(0, 200)}...`);
      
      if (response.data && response.data.result !== false) {
        console.log(`  🎉 SUCCESS! Found working public endpoint: ${endpoint}`);
      }
      
    } catch (error) {
      console.log(`  ❌ Error: ${error.message}`);
      if (error.response?.data) {
        console.log(`  Response: ${JSON.stringify(error.response.data).substring(0, 100)}...`);
      }
    }
  }
}

// Run the test
testCJPublic().catch(console.error);
