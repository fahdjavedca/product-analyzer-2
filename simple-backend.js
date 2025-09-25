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
  res.json({ status: 'OK', message: 'Backend is running' });
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

// Start server
app.listen(PORT, () => {
  console.log(`Simple backend server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});
