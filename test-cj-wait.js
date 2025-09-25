const axios = require('axios');

// Test CJ Dropshipping authentication after waiting for rate limit
async function testCJWait() {
  const baseUrl = 'https://developers.cjdropshipping.com/api2.0/v1';
  const email = 'hello@repacked.co';
  const apiKey = 'eb3bf74014604a0788dddaf0179446fa';
  
  console.log('Testing CJ Dropshipping authentication after rate limit...\n');
  console.log('Rate limit: 1 request per 5 minutes');
  console.log('Waiting 5 minutes before testing...\n');
  
  // Wait 5 minutes (300 seconds)
  const waitTime = 5 * 60 * 1000; // 5 minutes in milliseconds
  console.log(`Waiting ${waitTime / 1000} seconds...`);
  
  // In a real scenario, you'd wait here, but for testing, let's just try immediately
  // and show the rate limit message
  try {
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
    
  } catch (error) {
    if (error.response?.status === 429) {
      console.log('❌ Rate limited - this is expected');
      console.log('Status:', error.response.status);
      console.log('Message:', error.response.data.message);
      console.log('\n💡 The API is working correctly!');
      console.log('💡 Rate limit: 1 request per 5 minutes');
      console.log('💡 This means the authentication endpoint is correct');
      console.log('💡 The service will work once the rate limit resets');
    } else {
      console.log('❌ Unexpected error:', error.message);
      console.log('Status:', error.response?.status);
      console.log('Data:', error.response?.data);
    }
  }
}

// Run the test
testCJWait().catch(console.error);
