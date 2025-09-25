const axios = require('axios');

// Test CJ Dropshipping authentication with correct API
async function testCJAuthCorrect() {
  const baseUrl = 'https://developers.cjdropshipping.com/api2.0/v1';
  const email = 'hello@repacked.co';
  const apiKey = 'eb3bf74014604a0788dddaf0179446fa';
  
  console.log('Testing CJ Dropshipping authentication with correct API...\n');
  
  try {
    // Test authentication endpoint
    console.log('--- Testing Authentication Endpoint ---');
    const authResponse = await axios.post(`${baseUrl}/authentication/getAccessToken`, {
      email: email,
      apiKey: apiKey,
    }, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });
    
    console.log('✅ Authentication successful!');
    console.log('Status:', authResponse.status);
    console.log('Data:', JSON.stringify(authResponse.data, null, 2));
    
    if (authResponse.data && authResponse.data.result === true) {
      const accessToken = authResponse.data.data.accessToken;
      console.log('\n--- Testing Product Categories with Access Token ---');
      
      // Test product categories with access token
      const categoriesResponse = await axios.get(`${baseUrl}/product/categories`, {
        headers: {
          'Content-Type': 'application/json',
          'CJ-Access-Token': accessToken,
        },
        timeout: 10000,
      });
      
      console.log('✅ Categories endpoint successful!');
      console.log('Status:', categoriesResponse.status);
      console.log('Data type:', typeof categoriesResponse.data);
      console.log('Data keys:', Object.keys(categoriesResponse.data));
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
testCJAuthCorrect().catch(console.error);
