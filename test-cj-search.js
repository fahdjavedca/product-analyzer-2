const axios = require('axios');

// Test CJ Dropshipping search API directly
async function testCJSearch() {
  const baseUrl = 'https://developers.cjdropshipping.com/api';
  const apiKey = 'eb3bf74014604a0788dddaf0179446fa';
  
  console.log('Testing CJ Dropshipping Search API...');
  
  try {
    // Test search endpoint
    console.log('\n--- Testing Search Endpoint ---');
    const searchResponse = await axios.get(`${baseUrl}/product/search`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      params: {
        keyword: 'fitness',
        limit: 5
      },
      timeout: 10000,
    });
    
    console.log('✅ Search endpoint successful!');
    console.log('Status:', searchResponse.status);
    console.log('Data type:', typeof searchResponse.data);
    console.log('Data keys:', Object.keys(searchResponse.data));
    console.log('Full response:', JSON.stringify(searchResponse.data, null, 2));
    
  } catch (error) {
    console.log('❌ Search test failed');
    console.log('Error:', error.message);
    console.log('Status:', error.response?.status);
    console.log('Data:', error.response?.data);
  }
}

// Run the test
testCJSearch().catch(console.error);
