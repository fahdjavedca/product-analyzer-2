require('dotenv').config({ path: '.env.local' });

async function testGoogleAdsAPI() {
  console.log('Testing Google Ads API with correct implementation...');
  
  // Check environment variables
  const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
  const clientId = process.env.GOOGLE_ADS_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_ADS_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_ADS_REFRESH_TOKEN;
  const customerId = process.env.GOOGLE_ADS_CUSTOMER_ID;
  
  console.log('Environment check:');
  console.log('- Developer Token:', !!developerToken, developerToken?.substring(0, 10) + '...');
  console.log('- Client ID:', !!clientId);
  console.log('- Client Secret:', !!clientSecret);
  console.log('- Refresh Token:', !!refreshToken);
  console.log('- Customer ID:', customerId);
  
  if (!developerToken || !clientId || !clientSecret || !refreshToken || !customerId) {
    console.log('❌ Missing required environment variables');
    return;
  }
  
  try {
    // Step 1: Get access token
    console.log('\n1. Getting OAuth2 access token...');
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token'
      })
    });
    
    const tokenData = await tokenResponse.json();
    console.log('Token response status:', tokenResponse.status);
    
    if (!tokenResponse.ok || !tokenData.access_token) {
      console.log('❌ Failed to get access token:', tokenData);
      return;
    }
    
    console.log('✅ Access token obtained');
    
    // Step 2: Make Google Ads API call
    console.log('\n2. Making Google Ads API call...');
    
    const requestBody = {
      keywordSeed: {
        keywords: ['wireless headphones']
      },
      languageCode: 'en',
      geoTargetConstants: ['geoTargetConstants/2124'], // Canada
      keywordPlanNetwork: 'GOOGLE_SEARCH'
    };
    
    const cleanCustomerId = customerId.replace(/-/g, '');
    console.log('Clean Customer ID:', cleanCustomerId);
    
    // Try both with and without login-customer-id header
    const apiUrl = `https://googleads.googleapis.com/v14/customers/${cleanCustomerId}/keywordPlanIdeas:generate`;
    
    console.log('API URL:', apiUrl);
    console.log('Request body:', JSON.stringify(requestBody, null, 2));
    
    const apiResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'developer-token': developerToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });
    
    const responseText = await apiResponse.text();
    console.log('API response status:', apiResponse.status);
    console.log('API response headers:', Object.fromEntries(apiResponse.headers.entries()));
    console.log('API response body:', responseText);
    
    let apiData;
    try {
      apiData = JSON.parse(responseText);
    } catch (e) {
      console.log('Failed to parse JSON response');
      return;
    }
    
    if (apiResponse.ok && apiData.results && apiData.results.length > 0) {
      const result = apiData.results[0];
      const metrics = result.keywordIdeaMetrics;
      
      console.log('\n✅ Success! Keyword data:');
      console.log('- Keyword:', result.text);
      console.log('- Avg Monthly Searches:', metrics?.avgMonthlySearches || 'N/A');
      console.log('- Competition:', metrics?.competition || 'N/A');
      console.log('- Low CPC (micros):', metrics?.lowTopOfPageBidMicros || 'N/A');
      console.log('- High CPC (micros):', metrics?.highTopOfPageBidMicros || 'N/A');
    } else {
      console.log('❌ API call failed or no results');
    }
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

testGoogleAdsAPI();
