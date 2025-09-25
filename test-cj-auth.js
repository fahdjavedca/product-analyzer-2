const axios = require('axios');

// Test different CJ Dropshipping authentication methods
async function testCJAuth() {
  const baseUrl = 'https://developers.cjdropshipping.com/api';
  const apiKey = 'eb3bf74014604a0788dddaf0179446fa';
  
  console.log('Testing different CJ Dropshipping authentication methods...\n');
  
  const authMethods = [
    { name: 'Bearer Token', headers: { 'Authorization': `Bearer ${apiKey}` } },
    { name: 'API Key Header', headers: { 'X-API-Key': apiKey } },
    { name: 'API Key Header 2', headers: { 'apiKey': apiKey } },
    { name: 'API Key Header 3', headers: { 'apikey': apiKey } },
    { name: 'API Key Header 4', headers: { 'API-KEY': apiKey } },
    { name: 'API Key Header 5', headers: { 'x-api-key': apiKey } },
    { name: 'API Key in Body', body: { apiKey: apiKey } },
    { name: 'API Key in Query', params: { apiKey: apiKey } },
    { name: 'API Key in Query 2', params: { key: apiKey } },
    { name: 'API Key in Query 3', params: { token: apiKey } },
  ];
  
  for (const method of authMethods) {
    try {
      console.log(`Testing: ${method.name}`);
      
      const config = {
        headers: {
          'Content-Type': 'application/json',
          ...method.headers,
        },
        timeout: 5000,
      };
      
      if (method.body) {
        config.data = method.body;
      }
      
      if (method.params) {
        config.params = method.params;
      }
      
      const response = await axios.get(`${baseUrl}/product/categories`, config);
      
      console.log(`✅ ${method.name} - Status: ${response.status}`);
      console.log(`   Data: ${JSON.stringify(response.data).substring(0, 100)}...`);
      
      if (response.data && response.data.result !== false) {
        console.log(`   🎉 SUCCESS! Found working auth method: ${method.name}`);
        break;
      }
      
    } catch (error) {
      console.log(`❌ ${method.name} - Error: ${error.message}`);
      if (error.response?.data) {
        console.log(`   Response: ${JSON.stringify(error.response.data).substring(0, 100)}...`);
      }
    }
  }
}

// Run the test
testCJAuth().catch(console.error);
