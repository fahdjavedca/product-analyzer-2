const axios = require('axios');

// Test the updated CJ Dropshipping service
async function testCJService() {
  const baseUrl = 'https://api.cjdropshipping.com';
  const apiKey = 'eb3bf74014604a0788dddaf0179446fa';
  
  console.log('Testing CJ Dropshipping Service...');
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
    console.log('Data length:', Array.isArray(categoriesResponse.data) ? categoriesResponse.data.length : 'Not an array');
    
    if (Array.isArray(categoriesResponse.data) && categoriesResponse.data.length > 0) {
      console.log('Sample category:', JSON.stringify(categoriesResponse.data[0], null, 2));
    } else {
      console.log('Raw response (first 500 chars):', categoriesResponse.data.substring(0, 500));
    }
    
    // Test search endpoint
    console.log('\n--- Testing Search Endpoint ---');
    const searchResponse = await axios.get(`${baseUrl}/product/search`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      params: {
        keyword: 'fitness tracker',
        limit: 5,
      },
      timeout: 10000,
    });
    
    console.log('✅ Search endpoint successful!');
    console.log('Status:', searchResponse.status);
    console.log('Data type:', typeof searchResponse.data);
    console.log('Data keys:', Object.keys(searchResponse.data));
    
    if (searchResponse.data && typeof searchResponse.data === 'object') {
      console.log('Sample search result:', JSON.stringify(searchResponse.data, null, 2).substring(0, 500) + '...');
    }
    
  } catch (error) {
    console.log('❌ Service test failed');
    console.log('Error:', error.message);
    console.log('Status:', error.response?.status);
    console.log('Data:', JSON.stringify(error.response?.data, null, 2));
  }
}

// Run the test
testCJService().catch(console.error);
