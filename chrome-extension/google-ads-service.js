// Google Ads API service for Chrome Extension
// This would integrate with the real Google Ads API

class GoogleAdsService {
  constructor() {
    this.apiKey = null;
    this.customerId = null;
    this.baseUrl = 'https://googleads.googleapis.com/v21/customers';
  }

  // Initialize with API credentials
  async initialize(apiKey, customerId) {
    this.apiKey = apiKey;
    this.customerId = customerId;
  }

  // Get keyword data from Google Ads API via backend
  async getKeywordData(keyword) {
    try {
      const response = await fetch('http://localhost:3000/api/google-ads/keyword-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ keyword })
      });

      if (!response.ok) {
        throw new Error(`Backend API error: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success && data.data) {
        return data.data;
      } else {
        throw new Error(data.error || 'Invalid response from backend');
      }
    } catch (error) {
      console.error('Google Ads API error:', error);
      throw error; // Don't fallback to mock data
    }
  }

  // Parse Google Ads API response
  parseKeywordData(apiResponse) {
    // This should parse the actual Google Ads API response
    // For now, throw error until Google Ads API is properly implemented
    throw new Error('Google Ads API parsing not implemented - configure Google Ads API credentials');
  }

  // Generate intelligent keywords using backend API
  async generateIntelligentKeywords(productTitle, productPrice, category = '') {
    try {
      console.log('Attempting to generate intelligent keywords via backend API...');
      
      const response = await fetch('http://localhost:3000/api/products/generate-keywords', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productTitle,
          productPrice,
          category
        })
      });

      if (!response.ok) {
        throw new Error(`Backend API error: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success && data.data.keywords) {
        console.log(`✅ Generated intelligent keywords for "${productTitle}":`, data.data.keywords);
        return {
          keywords: data.data.keywords,
          isRealData: data.data.isRealData || false
        };
      } else {
        throw new Error('Invalid response from backend');
      }

    } catch (error) {
      console.warn('⚠️ Backend keyword generation failed, using fallback:', error.message);
      console.log('Falling back to basic keyword extraction...');
      // Fallback to basic keyword extraction
      return this.extractBasicKeywords(productTitle);
    }
  }

  // Fallback basic keyword extraction - improved version
  extractBasicKeywords(title) {
    console.log('Using improved fallback keyword extraction...');
    
    // More comprehensive stop words
    const stopWords = [
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 
      'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 
      'will', 'would', 'could', 'should', 'women', 'men', 'unisex', 'new', 'hot', 'best', 'top', 
      'quality', 'premium', 'fashion', 'style', 'design', 'trendy', 'cute', 'beautiful', 'amazing',
      'perfect', 'great', 'excellent', 'wonderful', 'awesome', 'fantastic', 'lovely', 'gorgeous'
    ];
    
    // Extract meaningful phrases and words
    let keywords = title
      .toLowerCase()
      .replace(/[^\w\s-]/g, ' ') // Keep hyphens for compound words
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.includes(word));
    
    // Try to create meaningful phrases
    const phrases = [];
    for (let i = 0; i < keywords.length - 1; i++) {
      const phrase = `${keywords[i]} ${keywords[i + 1]}`;
      if (phrase.length > 5 && phrase.length < 25) {
        phrases.push(phrase);
      }
    }
    
    // Combine single words and phrases, prioritizing phrases
    const result = [...phrases, ...keywords].slice(0, 3);
    
    console.log(`Generated fallback keywords for "${title}":`, result);
    return {
      keywords: result,
      isRealData: false // Mark as fallback data
    };
  }

  // NO MOCK DATA - Only real Google Ads API data allowed

  // Get multiple keywords at once
  async getBulkKeywordData(keywords) {
    const results = {};
    
    for (const keyword of keywords) {
      try {
        results[keyword] = await this.getKeywordData(keyword);
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Error getting data for keyword "${keyword}":`, error);
        // NO MOCK DATA - skip this keyword
        results[keyword] = null;
      }
    }
    
    return results;
  }

  // Check if service is properly configured by testing backend connection
  async isConfigured() {
    try {
      const response = await fetch('http://localhost:3000/api/health', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        console.error(`Backend health check failed: ${response.status} ${response.statusText}`);
        return false;
      }
      
      const data = await response.json();
      const isConfigured = data.googleAdsConfigured === true;
      
      console.log('Backend health check result:', {
        status: response.status,
        googleAdsConfigured: data.googleAdsConfigured,
        isConfigured
      });
      
      return isConfigured;
    } catch (error) {
      console.error('Backend health check failed:', error);
      return false;
    }
  }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GoogleAdsService;
}

// Always make GoogleAdsService available globally for content scripts
if (typeof window !== 'undefined') {
  window.GoogleAdsService = GoogleAdsService;
  console.log('GoogleAdsService class loaded and available globally');
}
