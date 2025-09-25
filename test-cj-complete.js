const axios = require('axios');

// Test the complete CJ Dropshipping integration
async function testCJCompleteIntegration() {
  const baseUrl = 'http://localhost:3000/api/v1';
  
  console.log('Testing Complete CJ Dropshipping Integration...');
  console.log('Backend URL:', baseUrl);
  
  try {
    // Test 1: Check if backend is running
    console.log('\n--- Test 1: Backend Health Check ---');
    try {
      const healthResponse = await axios.get(`${baseUrl}/health`);
      console.log('✅ Backend is running');
      console.log('Status:', healthResponse.status);
    } catch (error) {
      console.log('❌ Backend is not running');
      console.log('Error:', error.message);
      return;
    }

    // Test 2: Test CJ Dropshipping authentication
    console.log('\n--- Test 2: CJ Dropshipping Authentication ---');
    try {
      const authResponse = await axios.get(`${baseUrl}/test/debug-cj-auth`);
      console.log('✅ CJ Dropshipping authentication test completed');
      console.log('Response:', JSON.stringify(authResponse.data, null, 2));
    } catch (error) {
      console.log('❌ CJ Dropshipping authentication test failed');
      console.log('Error:', error.message);
      console.log('Status:', error.response?.status);
      console.log('Data:', error.response?.data);
    }

    // Test 3: Search CJ Dropshipping products
    console.log('\n--- Test 3: Search CJ Dropshipping Products ---');
    try {
      const searchResponse = await axios.get(`${baseUrl}/products/cj/search`, {
        params: {
          keyword: 'fitness tracker',
          limit: 5,
        },
      });
      
      console.log('✅ CJ Dropshipping search successful');
      console.log('Status:', searchResponse.status);
      console.log('Products found:', searchResponse.data.data?.products?.length || 0);
      
      if (searchResponse.data.data?.products?.length > 0) {
        console.log('Sample product:', JSON.stringify(searchResponse.data.data.products[0], null, 2));
      }
    } catch (error) {
      console.log('❌ CJ Dropshipping search failed');
      console.log('Error:', error.message);
      console.log('Status:', error.response?.status);
      console.log('Data:', error.response?.data);
    }

    // Test 4: Get CJ Dropshipping categories
    console.log('\n--- Test 4: Get CJ Dropshipping Categories ---');
    try {
      const categoriesResponse = await axios.get(`${baseUrl}/products/cj/categories`);
      
      console.log('✅ CJ Dropshipping categories successful');
      console.log('Status:', categoriesResponse.status);
      console.log('Categories found:', categoriesResponse.data.data?.length || 0);
      
      if (categoriesResponse.data.data?.length > 0) {
        console.log('Sample category:', JSON.stringify(categoriesResponse.data.data[0], null, 2));
      }
    } catch (error) {
      console.log('❌ CJ Dropshipping categories failed');
      console.log('Error:', error.message);
      console.log('Status:', error.response?.status);
      console.log('Data:', error.response?.data);
    }

    // Test 5: Import CJ Dropshipping products by keyword
    console.log('\n--- Test 5: Import CJ Dropshipping Products by Keyword ---');
    try {
      const importResponse = await axios.post(`${baseUrl}/products/cj/import-by-keyword`, {
        keyword: 'fitness tracker',
        limit: 3,
        destinationCountry: 'US',
        analyzeKeywords: true,
      });
      
      console.log('✅ CJ Dropshipping import successful');
      console.log('Status:', importResponse.status);
      console.log('Import result:', JSON.stringify(importResponse.data, null, 2));
    } catch (error) {
      console.log('❌ CJ Dropshipping import failed');
      console.log('Error:', error.message);
      console.log('Status:', error.response?.status);
      console.log('Data:', error.response?.data);
    }

    // Test 6: Check imported products
    console.log('\n--- Test 6: Check Imported Products ---');
    try {
      const productsResponse = await axios.get(`${baseUrl}/products`, {
        params: {
          sourcePlatform: 'cj_dropshipping',
          limit: 10,
        },
      });
      
      console.log('✅ Imported products retrieved');
      console.log('Status:', productsResponse.status);
      console.log('Products in database:', productsResponse.data.data?.products?.length || 0);
      
      if (productsResponse.data.data?.products?.length > 0) {
        console.log('Sample imported product:', JSON.stringify(productsResponse.data.data.products[0], null, 2));
      }
    } catch (error) {
      console.log('❌ Failed to retrieve imported products');
      console.log('Error:', error.message);
      console.log('Status:', error.response?.status);
      console.log('Data:', error.response?.data);
    }

  } catch (error) {
    console.log('❌ Integration test failed');
    console.log('Error:', error.message);
  }
}

// Run the test
testCJCompleteIntegration().catch(console.error);
