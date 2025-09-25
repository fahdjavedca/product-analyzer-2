// Test script to verify Chrome extension fixes
console.log('🧪 Testing Chrome extension fixes...');

// Test 1: Check if redeclaration prevention works
console.log('Test 1: Checking redeclaration prevention...');
if (typeof window.cjAnalyzerLoaded !== 'undefined') {
  console.log('✅ Redeclaration prevention mechanism exists');
} else {
  console.log('❌ Redeclaration prevention not found');
}

// Test 2: Check if GoogleAdsService is available
console.log('Test 2: Checking GoogleAdsService availability...');
if (typeof window.GoogleAdsService !== 'undefined') {
  console.log('✅ GoogleAdsService class is available globally');
} else {
  console.log('❌ GoogleAdsService not found globally');
}

// Test 3: Check backend connectivity
console.log('Test 3: Testing backend connectivity...');
fetch('http://localhost:3000/api/health')
  .then(response => response.json())
  .then(data => {
    console.log('✅ Backend is reachable:', data);
    if (data.googleAdsConfigured) {
      console.log('✅ Google Ads API is configured');
    } else {
      console.log('❌ Google Ads API not configured');
    }
  })
  .catch(error => {
    console.log('❌ Backend not reachable:', error);
  });

console.log('🧪 Extension tests completed');
