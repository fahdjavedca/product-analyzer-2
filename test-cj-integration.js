const axios = require('axios');

// Test CJ Dropshipping API with proper authentication
async function testCJIntegration() {
  const email = 'hello@repacked.co';
  const password = 'eb3bf74014604a0788dddaf0179446fa';
  const baseUrl = 'https://developers.cjdropshipping.com/en/api/api2';
  
  console.log('Testing CJ Dropshipping API Integration...');
  console.log('Email:', email);
  console.log('Base URL:', baseUrl);
  
  try {
    // Step 1: Test base URL accessibility
    console.log('\n--- Step 1: Testing Base URL ---');
    try {
      const baseResponse = await axios.get(baseUrl, {
        timeout: 10000,
      });
      console.log('✅ Base URL accessible');
      console.log('Status:', baseResponse.status);
      console.log('Response type:', typeof baseResponse.data);
    } catch (error) {
      console.log('❌ Base URL not accessible');
      console.log('Status:', error.response?.status);
      console.log('Message:', error.message);
    }

    // Step 2: Try different authentication methods
    console.log('\n--- Step 2: Testing Different Authentication Methods ---');
    
    // Try API key authentication
    console.log('\nTesting API key authentication...');
    try {
      const apiKeyResponse = await axios.get(`${baseUrl}/product/categories`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${password}`, // Using password as API key
        },
        timeout: 5000,
      });
      
      console.log('✅ API key authentication successful!');
      console.log('Status:', apiKeyResponse.status);
      console.log('Response keys:', Object.keys(apiKeyResponse.data));
      
    } catch (error) {
      console.log('❌ API key authentication failed');
      console.log('Status:', error.response?.status);
      console.log('Message:', error.response?.data?.message || error.message);
    }

    // Try different header formats
    const headerFormats = [
      { name: 'Bearer Token', header: `Bearer ${password}` },
      { name: 'X-API-Key', header: password },
      { name: 'apiKey', header: password },
      { name: 'Authorization', header: password },
    ];

    for (const format of headerFormats) {
      try {
        console.log(`\nTesting ${format.name}...`);
        const response = await axios.get(`${baseUrl}/product/categories`, {
          headers: {
            'Content-Type': 'application/json',
            [format.name === 'X-API-Key' ? 'X-API-Key' : 
             format.name === 'apiKey' ? 'apiKey' : 
             'Authorization']: format.header,
          },
          timeout: 5000,
        });
        
        console.log(`✅ ${format.name} successful!`);
        console.log('Status:', response.status);
        console.log('Response keys:', Object.keys(response.data));
        break;
        
      } catch (error) {
        console.log(`❌ ${format.name} failed`);
        console.log('Status:', error.response?.status);
        console.log('Message:', error.response?.data?.message || error.message);
      }
    }
    
  } catch (error) {
    console.log('❌ Integration test failed');
    console.log('Error:', error.message);
    console.log('Status:', error.response?.status);
    console.log('Data:', JSON.stringify(error.response?.data, null, 2));
  }
}

// Run the test
testCJIntegration().catch(console.error);
