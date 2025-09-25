require('dotenv').config({ path: '.env.local' });
const GoogleAdsAPI = require('./google-ads-api');

async function testGoogleAdsAPI() {
  console.log('Testing Google Ads API setup...');
  
  const googleAdsAPI = new GoogleAdsAPI();
  
  console.log('Configuration check:');
  console.log('- Developer Token:', !!process.env.GOOGLE_ADS_DEVELOPER_TOKEN);
  console.log('- Client ID:', !!process.env.GOOGLE_ADS_CLIENT_ID);
  console.log('- Client Secret:', !!process.env.GOOGLE_ADS_CLIENT_SECRET);
  console.log('- Refresh Token:', !!process.env.GOOGLE_ADS_REFRESH_TOKEN);
  console.log('- Customer ID:', !!process.env.GOOGLE_ADS_CUSTOMER_ID);
  console.log('- Is Configured:', googleAdsAPI.isConfigured());
  
  if (!googleAdsAPI.isConfigured()) {
    console.log('❌ Google Ads API is not properly configured');
    return;
  }
  
  console.log('✅ Google Ads API is configured');
  
  try {
    console.log('Testing keyword ideas for "wireless headphones"...');
    const result = await googleAdsAPI.getKeywordIdeas('wireless headphones');
    console.log('✅ Google Ads API result:', result);
  } catch (error) {
    console.log('❌ Google Ads API error:', error.message);
  }
}

testGoogleAdsAPI();
