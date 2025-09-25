const axios = require('axios');

// Test CJ Dropshipping API with different authentication methods
async function testCJAPI() {
  const apiKey = process.env.CJ_API_KEY || 'your-cj-api-key';
  
  console.log('Testing CJ Dropshipping API...');
  console.log('API Key present:', !!apiKey);
  console.log('API Key length:', apiKey.length);
  
  const authMethods = [
    { name: 'Bearer Token', header: `Bearer ${apiKey}` },
    { name: 'X-API-Key', header: apiKey },
    { name: 'apiKey', header: apiKey },
    { name: 'access_token', header: apiKey },
  ];

  for (const method of authMethods) {
    console.log(`\n--- Testing ${method.name} ---`);
    
    try {
      const response = await axios.get('https://api.cjdropshipping.com/product/categories', {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': method.header,
        },
        timeout: 10000,
      });
      
      console.log('✅ Success!');
      console.log('Status:', response.status);
      console.log('Data keys:', Object.keys(response.data));
      console.log('Sample data:', JSON.stringify(response.data, null, 2).substring(0, 200) + '...');
      
    } catch (error) {
      console.log('❌ Failed');
      console.log('Status:', error.response?.status);
      console.log('Message:', error.response?.data?.message || error.message);
      console.log('Data:', JSON.stringify(error.response?.data, null, 2));
    }
  }
}

// Test with different base URLs
async function testDifferentURLs() {
  const apiKey = process.env.CJ_API_KEY || 'your-cj-api-key';
  
  console.log('\n\n--- Testing Different Base URLs ---');
  
  const urls = [
    'https://api.cjdropshipping.com',
    'https://api.cjdropshipping.com/v1',
    'https://api.cjdropshipping.com/v2',
    'https://api.cjdropshipping.com/api',
  ];

  for (const baseURL of urls) {
    console.log(`\n--- Testing ${baseURL} ---`);
    
    try {
      const response = await axios.get(`${baseURL}/product/categories`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        timeout: 10000,
      });
      
      console.log('✅ Success!');
      console.log('Status:', response.status);
      
    } catch (error) {
      console.log('❌ Failed');
      console.log('Status:', error.response?.status);
      console.log('Message:', error.response?.data?.message || error.message);
    }
  }
}

// Run tests
async function main() {
  try {
    await testCJAPI();
    await testDifferentURLs();
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

main();
