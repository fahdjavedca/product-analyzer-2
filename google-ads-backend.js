const http = require('http');
const https = require('https');
const url = require('url');
const GoogleAdsAPI = require('./google-ads-api');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

// Initialize Google Ads API
const googleAdsAPI = new GoogleAdsAPI();

const server = http.createServer((req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.url === '/api/health' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      status: 'OK', 
      message: 'Backend is running',
      googleAdsConfigured: googleAdsAPI.isConfigured()
    }));
    return;
  }

  if (req.url === '/api/products/generate-keywords' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', async () => {
      try {
        const data = JSON.parse(body);
        const { productTitle, productPrice, category } = data;
        
        // Try OpenAI first if available
        if (process.env.OPENAI_API_KEY) {
          try {
            const openaiResponse = await generateOpenAIKeywords(productTitle, productPrice, category);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(openaiResponse));
            return;
          } catch (error) {
            console.log('OpenAI failed, falling back to basic extraction:', error.message);
          }
        }
        
        // Fallback to basic keyword extraction
        const keywords = productTitle
          .toLowerCase()
          .replace(/[^\w\s-]/g, ' ')
          .split(/\s+/)
          .filter(word => word.length > 2)
          .slice(0, 3);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          data: {
            keywords,
            isRealData: false
          }
        }));
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error: 'Failed to parse request'
        }));
      }
    });
    return;
  }

  if (req.url === '/api/google-ads/keyword-data' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', async () => {
      try {
        const data = JSON.parse(body);
        const { keyword } = data;
        
        // Check if Google Ads API is configured
        if (!googleAdsAPI.isConfigured()) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            error: 'Google Ads API not configured'
          }));
          return;
        }
        
        // Get Google Ads data
        const adsData = await googleAdsAPI.getKeywordIdeas(keyword);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          data: adsData
        }));
      } catch (error) {
        console.error('Google Ads API error:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error: error.message
        }));
      }
    });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

// Generate keywords using OpenAI
async function generateOpenAIKeywords(productTitle, productPrice, category) {
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

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
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

  return {
    success: true,
    data: { 
      keywords,
      isRealData: true
    }
  };
}

// Google Ads API is now implemented in the GoogleAdsAPI class

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Google Ads backend server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
  console.log(`Google Ads configured: ${googleAdsAPI.isConfigured()}`);
});
