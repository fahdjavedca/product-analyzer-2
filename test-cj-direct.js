const axios = require('axios');

// Test CJ Dropshipping API directly
async function testCJDirect() {
  const baseUrl = 'https://developers.cjdropshipping.com/en/api/api2';
  const apiKey = 'eb3bf74014604a0788dddaf0179446fa';
  
  console.log('Testing CJ Dropshipping API Direct...');
  console.log('Base URL:', baseUrl);
  console.log('API Key:', apiKey ? 'Present' : 'Missing');
  
  try {
    // Test categories endpoint
    console.log('\n--- Testing Categories Endpoint ---');
    const categoriesResponse = await axios.get(`${baseUrl}/product/categories`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      timeout: 10000,
    });
    
    console.log('✅ Categories endpoint successful!');
    console.log('Status:', categoriesResponse.status);
    console.log('Data type:', typeof categoriesResponse.data);
    console.log('Data keys:', Object.keys(categoriesResponse.data));
    
    if (categoriesResponse.data && typeof categoriesResponse.data === 'object') {
      console.log('Sample data:', JSON.stringify(categoriesResponse.data, null, 2).substring(0, 500) + '...');
    }
    
  } catch (error) {
    console.log('❌ API test failed');
    console.log('Error:', error.message);
    console.log('Status:', error.response?.status);
    console.log('Data:', error.response?.data);
  }
}

// Run the test
testCJDirect().catch(console.error);
