const express = require('express');
const cors = require('cors');
require('dotenv').config({ path: '.env.local' });

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  const googleAdsConfigured = !!(process.env.GOOGLE_ADS_DEVELOPER_TOKEN && 
                                process.env.GOOGLE_ADS_CLIENT_ID && 
                                process.env.GOOGLE_ADS_CLIENT_SECRET && 
                                process.env.GOOGLE_ADS_REFRESH_TOKEN);
  
  res.json({ 
    status: 'OK', 
    message: 'Backend is running',
    googleAdsConfigured,
    isConfigured: googleAdsConfigured
  });
});

// Generate intelligent keywords using OpenAI
app.post('/api/products/generate-keywords', async (req, res) => {
  const { productTitle, productPrice, category } = req.body;

  if (!productTitle) {
    return res.status(400).json({
      success: false,
      error: 'Product title is required'
    });
  }

  const openaiApiKey = process.env.OPENAI_API_KEY;
  if (!openaiApiKey) {
    return res.status(500).json({
      success: false,
      error: 'OpenAI API key not configured'
    });
  }

  const prompt = `Analyze this product and generate the 3 most effective keywords for Google Ads targeting. Focus on buyer intent and commercial keywords that people would actually search for when looking to buy this product.

Product Title: "${productTitle}"
Price: "${productPrice || 'Not specified'}"
Category: "${category || 'Not specified'}"

Requirements:
1. Generate 3 keywords maximum
2. Focus on commercial intent (buying keywords)
3. Include relevant product attributes (color, style, material, etc.)
4. Consider seasonal trends if applicable
5. Use terms customers would actually search for
6. Prioritize keywords that would convert well for dropshipping

Format as a simple comma-separated list, no explanations needed.

Example format: "wireless bluetooth headphones, noise cancelling earbuds, premium audio headset"`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are an expert in e-commerce keyword research and Google Ads optimization. Generate high-converting commercial keywords for product listings.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 150,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const keywords = data.choices[0].message.content
      .split(',')
      .map((k) => k.trim())
      .filter((k) => k.length > 0)
      .slice(0, 3);

    res.json({
      success: true,
      data: { 
        keywords,
        isRealData: true // Mark as real data from OpenAI
      }
    });

  } catch (error) {
    console.error('Error generating intelligent keywords:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate keywords',
      details: error.message
    });
  }
});

// Real Google Ads API integration
async function getRealGoogleAdsData(keyword) {
  try {
    // Get access token
    const accessToken = await getGoogleAdsAccessToken();
    
    // Make request to Google Ads API
    const customerId = process.env.GOOGLE_ADS_CUSTOMER_ID.replace(/-/g, '');
    const response = await fetch(`https://googleads.googleapis.com/v21/customers/${customerId}:generateKeywordIdeas`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'developer-token': process.env.GOOGLE_ADS_DEVELOPER_TOKEN
      },
      body: JSON.stringify({
        language: 'en',
        geoTargetConstants: ['geoTargetConstants/2840'], // US
        keywordSeed: {
          keywords: [keyword]
        },
        includeAdultKeywords: false,
        pageSize: 1
      })
    });

    if (!response.ok) {
      throw new Error(`Google Ads API error: ${response.status}`);
    }

    const data = await response.json();
    const result = data.results?.[0];
    
    if (!result) {
      throw new Error('No keyword data found');
    }

    return {
      keyword: keyword,
      avgMonthlySearches: result.keywordIdeaMetrics?.avgMonthlySearches || 0,
      competition: mapCompetitionLevel(result.keywordIdeaMetrics?.competition),
      cpcLow: convertMicrosToCurrency(result.keywordIdeaMetrics?.lowTopOfPageBidMicros),
      cpcHigh: convertMicrosToCurrency(result.keywordIdeaMetrics?.highTopOfPageBidMicros),
      isRealData: true
    };

  } catch (error) {
    console.error('Google Ads API error:', error);
    // Fallback to realistic mock data if API fails
    const keywordLower = keyword.toLowerCase();
    let baseVolume = 100;
    let competition = 0.3;
    let cpcLow = 0.5;
    let cpcHigh = 2.0;
    
    // Adjust based on keyword characteristics
    if (keywordLower.includes('buy') || keywordLower.includes('purchase')) {
      baseVolume = Math.floor(Math.random() * 5000) + 1000; // Higher volume for buying keywords
      competition = 0.7 + Math.random() * 0.3; // Higher competition
      cpcLow = 1.0 + Math.random() * 3;
      cpcHigh = 3.0 + Math.random() * 5;
    } else if (keywordLower.includes('cheap') || keywordLower.includes('affordable')) {
      baseVolume = Math.floor(Math.random() * 3000) + 500;
      competition = 0.5 + Math.random() * 0.4;
      cpcLow = 0.5 + Math.random() * 2;
      cpcHigh = 1.5 + Math.random() * 3;
    } else if (keywordLower.includes('best') || keywordLower.includes('top')) {
      baseVolume = Math.floor(Math.random() * 8000) + 2000;
      competition = 0.6 + Math.random() * 0.3;
      cpcLow = 1.5 + Math.random() * 4;
      cpcHigh = 3.0 + Math.random() * 7;
    } else {
      // Generic keywords
      baseVolume = Math.floor(Math.random() * 2000) + 100;
      competition = 0.2 + Math.random() * 0.6;
      cpcLow = 0.3 + Math.random() * 2;
      cpcHigh = 1.0 + Math.random() * 4;
    }
    
    return {
      keyword: keyword,
      avgMonthlySearches: baseVolume,
      competition: competition,
      cpcLow: cpcLow,
      cpcHigh: cpcHigh,
      isRealData: false
    };
  }
}

async function getGoogleAdsAccessToken() {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_ADS_CLIENT_ID,
      client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET,
      refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN,
      grant_type: 'refresh_token'
    })
  });

  if (!response.ok) {
    throw new Error('Failed to get access token');
  }

  const data = await response.json();
  return data.access_token;
}

function mapCompetitionLevel(competition) {
  const mapping = {
    'UNKNOWN': 0,
    'LOW': 0.25,
    'MEDIUM': 0.5,
    'HIGH': 0.75
  };
  return mapping[competition] || 0.5;
}

function convertMicrosToCurrency(micros) {
  if (!micros) return 0;
  return micros / 1000000;
}

// Google Ads API endpoint
app.post('/api/google-ads/keyword-data', async (req, res) => {
  const { keyword } = req.body;

  if (!keyword) {
    return res.status(400).json({
      success: false,
      error: 'Keyword is required'
    });
  }

  // Check if Google Ads is configured
  const googleAdsConfigured = !!(process.env.GOOGLE_ADS_DEVELOPER_TOKEN && 
                                process.env.GOOGLE_ADS_CLIENT_ID && 
                                process.env.GOOGLE_ADS_CLIENT_SECRET && 
                                process.env.GOOGLE_ADS_REFRESH_TOKEN);

  if (!googleAdsConfigured) {
    return res.status(500).json({
      success: false,
      error: 'Google Ads API not configured'
    });
  }

  try {
    // Use real Google Ads API data
    const googleAdsData = await getRealGoogleAdsData(keyword);
    
    res.json({
      success: true,
      data: googleAdsData
    });

  } catch (error) {
    console.error('Error getting Google Ads data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get Google Ads data',
      details: error.message
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Simple backend server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});
