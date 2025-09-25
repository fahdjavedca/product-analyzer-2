import { Router } from 'express';
import { config } from '@/config';
import { cjDropshippingService } from '@/services/cjDropshippingService';
import { googleAdsService } from '@/services/googleAdsService';
import { keywordService } from '@/services/keywordService';

const router = Router();

// Test endpoint to check API keys (remove in production)
router.get('/api-keys', (req, res) => {
  res.json({
    googleAds: {
      hasDeveloperToken: !!config.googleAds.developerToken,
      hasClientId: !!config.googleAds.clientId,
      hasClientSecret: !!config.googleAds.clientSecret,
      hasRefreshToken: !!config.googleAds.refreshToken,
      hasCustomerId: !!config.googleAds.customerId,
    },
    cjDropshipping: {
      hasApiKey: !!config.cjDropshipping.apiKey,
    },
    aliExpress: {
      hasApiKey: !!config.aliExpress.apiKey,
    },
    shopify: {
      hasStoreUrl: !!config.shopifyStoreUrl,
      hasAccessToken: !!config.shopifyAccessToken,
    },
  });
});

// Test external API connections
router.get('/test-apis', async (req, res) => {
  try {
    const results = {
      cjDropshipping: await cjDropshippingService.healthCheck(),
      googleAds: await googleAdsService.healthCheck(),
    };
    
    res.json({
      success: true,
      results,
    });
  } catch (error: any) {
    res.json({
      success: false,
      error: error.message,
    });
  }
});

// Test Google Ads API directly
router.get('/test-google-ads', async (req, res) => {
  try {
    const keywords = await googleAdsService.getKeywordMetrics({
      keywords: ['fitness tracker'],
      country: 'US',
      language: 'en',
    });
    
    res.json({
      success: true,
      keywords,
    });
  } catch (error: any) {
    res.json({
      success: false,
      error: error.message,
      stack: error.stack,
    });
  }
});

// Test keyword analysis
router.get('/test-keywords', async (req, res) => {
  try {
    const analysis = await keywordService.analyzeKeywords('Smart Fitness Tracker Watch', 'US');
    res.json({
      success: true,
      analysis,
    });
  } catch (error: any) {
    res.json({
      success: false,
      error: error.message,
      stack: error.stack,
    });
  }
});

// Test CJ Dropshipping API directly
router.get('/test-cj-dropshipping', async (req, res) => {
  try {
    // Test basic connection
    const healthCheck = await cjDropshippingService.healthCheck();
    
    // Test search products
    const searchResults = await cjDropshippingService.searchProducts({
      keyword: 'fitness tracker',
      limit: 5
    });
    
    // Test categories
    const categories = await cjDropshippingService.getCategories();
    
    res.json({
      success: true,
      healthCheck,
      searchResults: searchResults.slice(0, 2), // Limit response size
      categoriesCount: categories.length,
      apiKey: config.cjDropshipping.apiKey ? 'Present' : 'Missing',
    });
  } catch (error: any) {
    res.json({
      success: false,
      error: error.message,
      status: error.response?.status,
      data: error.response?.data,
      stack: error.stack,
    });
  }
});

// Debug CJ Dropshipping authentication
router.get('/debug-cj-auth', async (req, res) => {
  try {
    const debugResults = await cjDropshippingService.debugAuth();
    res.json({
      success: true,
      debug: debugResults,
    });
  } catch (error: any) {
    res.json({
      success: false,
      error: error.message,
      stack: error.stack,
    });
  }
});

export default router;