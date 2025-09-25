require('dotenv').config({ path: '.env.local' });
const GoogleAdsAPI = require('./google-ads-api');

async function testUpdatedGoogleAdsAPI() {
  console.log('=== Testing Updated Google Ads API Implementation ===\n');
  
  try {
    const googleAdsAPI = new GoogleAdsAPI();
    
    console.log('1. Configuration Check:');
    console.log('✅ API Configured:', googleAdsAPI.isConfigured());
    
    if (!googleAdsAPI.isConfigured()) {
      console.log('❌ Missing configuration. Please check .env.local file.');
      return;
    }
    
    console.log('\n2. OAuth2 Token Test:');
    const accessToken = await googleAdsAPI.getAccessToken();
    console.log('✅ Access token obtained:', !!accessToken);
    
    console.log('\n3. Keyword Ideas Test:');
    console.log('Testing keyword: "wireless headphones"');
    
    const keywordData = await googleAdsAPI.getKeywordIdeas('wireless headphones');
    console.log('✅ Keyword data received:');
    console.log('- Search Volume:', keywordData.avgMonthlySearches);
    console.log('- Competition:', keywordData.competition);
    console.log('- CPC Low:', keywordData.cpcLow);
    console.log('- CPC High:', keywordData.cpcHigh);
    console.log('- Real Data:', keywordData.isRealData);
    
    console.log('\n🎉 All tests passed! Google Ads API is working correctly.');
    
  } catch (error) {
    console.log('\n❌ Test failed:', error.message);
    
    if (error.message.includes('404')) {
      console.log('\n💡 Troubleshooting 404 Error:');
      console.log('1. Check if your Customer ID is correct');
      console.log('2. Verify your developer token is approved');
      console.log('3. Ensure your Google Ads account has API access');
      console.log('4. Try using a Manager Account ID instead');
    } else if (error.message.includes('403')) {
      console.log('\n💡 Troubleshooting 403 Error:');
      console.log('1. Developer token may not be approved for production');
      console.log('2. Account may lack necessary permissions');
      console.log('3. Check Google Ads API Center for restrictions');
    } else if (error.message.includes('401')) {
      console.log('\n💡 Troubleshooting 401 Error:');
      console.log('1. Check OAuth2 credentials');
      console.log('2. Regenerate refresh token');
      console.log('3. Verify developer token');
    }
  }
}

testUpdatedGoogleAdsAPI();
