require('dotenv').config({ path: '.env.local' });

async function diagnoseGoogleAdsSetup() {
  console.log('=== Google Ads API Diagnostic Tool ===\n');
  
  const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
  const clientId = process.env.GOOGLE_ADS_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_ADS_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_ADS_REFRESH_TOKEN;
  const customerId = process.env.GOOGLE_ADS_CUSTOMER_ID;
  
  console.log('1. Environment Variables Check:');
  console.log('✅ Developer Token:', !!developerToken);
  console.log('✅ Client ID:', !!clientId);
  console.log('✅ Client Secret:', !!clientSecret);
  console.log('✅ Refresh Token:', !!refreshToken);
  console.log('✅ Customer ID:', customerId);
  
  if (!developerToken || !clientId || !clientSecret || !refreshToken || !customerId) {
    console.log('\n❌ Missing required environment variables');
    return;
  }
  
  try {
    console.log('\n2. OAuth2 Token Test:');
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token'
      })
    });
    
    const tokenData = await tokenResponse.json();
    if (tokenResponse.ok && tokenData.access_token) {
      console.log('✅ OAuth2 token obtained successfully');
    } else {
      console.log('❌ OAuth2 token failed:', tokenData);
      return;
    }
    
    console.log('\n3. Google Ads API Account Access Test:');
    const cleanCustomerId = customerId.replace(/-/g, '');
    
    // Try to get customer information first (simpler API call)
    const customerUrl = `https://googleads.googleapis.com/v14/customers/${cleanCustomerId}`;
    const customerResponse = await fetch(customerUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'developer-token': developerToken,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Customer API Response Status:', customerResponse.status);
    const customerText = await customerResponse.text();
    
    if (customerResponse.status === 200) {
      console.log('✅ Customer account accessible');
      const customerData = JSON.parse(customerText);
      console.log('Customer Info:', {
        id: customerData.id,
        descriptiveName: customerData.descriptiveName,
        currencyCode: customerData.currencyCode
      });
    } else if (customerResponse.status === 401) {
      console.log('❌ Authentication failed - check developer token and OAuth credentials');
    } else if (customerResponse.status === 403) {
      console.log('❌ Access denied - possible causes:');
      console.log('   • Developer token not approved for production');
      console.log('   • Account lacks necessary permissions');
      console.log('   • Customer ID incorrect or inaccessible');
    } else if (customerResponse.status === 404) {
      console.log('❌ Customer not found - check customer ID');
    } else {
      console.log('❌ Unexpected error:', customerResponse.status);
      console.log('Response:', customerText);
    }
    
    console.log('\n4. Developer Token Status Check:');
    // Try a simple search to see if developer token works
    const searchUrl = `https://googleads.googleapis.com/v14/customers/${cleanCustomerId}/googleAds:search`;
    const searchResponse = await fetch(searchUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'developer-token': developerToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: 'SELECT customer.id FROM customer LIMIT 1'
      })
    });
    
    console.log('Search API Response Status:', searchResponse.status);
    const searchText = await searchResponse.text();
    
    if (searchResponse.status === 200) {
      console.log('✅ Developer token is working');
    } else if (searchResponse.status === 400) {
      console.log('⚠️ Developer token may be in test mode');
      console.log('   Test mode tokens have limited access to API endpoints');
      console.log('   Apply for production approval in Google Ads API Center');
    } else {
      console.log('❌ Developer token issue:', searchResponse.status);
      console.log('Response:', searchText.substring(0, 500));
    }
    
  } catch (error) {
    console.log('❌ Diagnostic error:', error.message);
  }
  
  console.log('\n=== Diagnosis Complete ===');
  console.log('\nNext Steps:');
  console.log('1. If developer token is in test mode, apply for production approval');
  console.log('2. Ensure customer ID has proper Google Ads account setup');
  console.log('3. Verify account permissions and API access');
  console.log('4. Check Google Ads API Center for any restrictions');
}

diagnoseGoogleAdsSetup();

