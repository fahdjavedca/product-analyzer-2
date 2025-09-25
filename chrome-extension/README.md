# CJ Dropshipping Product Analyzer Chrome Extension

A Chrome extension that overlays Google Ads keyword data and opportunity scores directly on CJ Dropshipping product pages, helping you identify high-potential products for your dropshipping business.

## Features

- **Real-time Analysis**: Automatically analyzes products as you browse CJ Dropshipping
- **Opportunity Scoring**: 0-100 score based on search volume, competition, and CPC data
- **Visual Overlays**: Clean, non-intrusive overlays on product cards
- **AI-Powered Keywords**: Uses OpenAI to generate intelligent, intent-based keywords
- **Smart Fallback**: Falls back to basic extraction if OpenAI is unavailable
- **Google Ads Integration**: Uses real Google Ads API data for accurate metrics
- **Smart Recommendations**: Provides actionable insights for each product

## Installation

### Development Installation

1. **Download the Extension**
   ```bash
   git clone <repository-url>
   cd chrome-extension
   ```

2. **Load in Chrome**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" in the top right
   - Click "Load unpacked" and select the `chrome-extension` folder
   - The extension should now appear in your extensions list

3. **Configure Backend APIs** (Optional)
   - The extension requires real Google Ads API data
   - For intelligent keywords, add your OpenAI API key to the backend `.env` file
   - For real Google Ads data, configure your API credentials in the backend `.env` file

### Production Installation

1. Package the extension as a `.zip` file
2. Submit to Chrome Web Store for review
3. Install from Chrome Web Store once approved

## Usage

1. **Navigate to CJ Dropshipping**
   - Go to any CJ Dropshipping product listing page
   - The extension will automatically activate

2. **View Product Analysis**
   - Products will show opportunity scores as colored badges
   - Hover over badges to see detailed metrics
   - Green = High opportunity (70+)
   - Orange = Medium opportunity (40-69)
   - Red = Low opportunity (<40)

3. **Configure Settings**
   - Click the extension icon to open the popup
   - Toggle auto-analysis on/off
   - Enable/disable score overlays
   - View analysis statistics

## How It Works

### Product Analysis Process

1. **AI Keyword Generation**: Uses OpenAI to generate intelligent, intent-based keywords from product titles
2. **Google Ads Lookup**: Queries Google Ads API for search volume, competition, and CPC data
3. **Opportunity Scoring**: Calculates a 0-100 score based on:
   - Search volume (0-40 points)
   - Competition level (0-30 points) 
   - Cost per click (0-30 points)
4. **Visual Overlay**: Displays results as colored badges on product cards

### Scoring Algorithm

```
Opportunity Score = Search Volume Score + Competition Score + CPC Score

Search Volume Score:
- 5000+ searches: 40 points
- 2000-4999: 30 points  
- 1000-1999: 20 points
- 500-999: 10 points
- <500: 0 points

Competition Score:
- Low: 30 points
- Medium: 20 points
- High: 5 points

CPC Score:
- $3+: 30 points
- $2-2.99: 20 points
- $1-1.99: 10 points
- <$1: 0 points
```

## Configuration

### Settings

- **Auto-analyze products**: Automatically analyze products when page loads
- **Show opportunity scores**: Display score badges on products
- **Highlight high-opportunity**: Emphasize products with scores 70+

### API Setup

**OpenAI API (for intelligent keywords):**
1. Get an OpenAI API key from https://platform.openai.com/api-keys
2. Add `OPENAI_API_KEY="your-key-here"` to your backend `.env` file
3. Restart the backend server
4. The extension will automatically use intelligent keyword generation

**Google Ads API (for real data):**
1. Get Google Ads API credentials
2. Update `background.js` with your API key
3. Configure OAuth flow for authentication

## File Structure

```
chrome-extension/
├── manifest.json          # Extension configuration
├── popup.html            # Extension popup UI
├── popup.js              # Popup functionality
├── background.js         # Background service worker
├── content.js            # Content script for CJ pages
├── content.css           # Styling for overlays
└── README.md            # This file
```

## Development

### Making Changes

1. Edit the relevant files
2. Go to `chrome://extensions/`
3. Click the refresh icon on the extension
4. Test on CJ Dropshipping pages

### Testing

1. Load the extension in developer mode
2. Navigate to CJ Dropshipping product pages
3. Verify overlays appear and function correctly
4. Test different product types and page layouts

## Troubleshooting

### Common Issues

**Overlays not appearing:**
- Check if you're on a CJ Dropshipping page
- Verify the extension is enabled
- Check browser console for errors

**Scores seem inaccurate:**
- Verify Google Ads API configuration
- Check if product titles are being extracted correctly
- Review the scoring algorithm in `content.js`

**Performance issues:**
- Disable auto-analysis for large product grids
- Check if too many API calls are being made
- Monitor browser memory usage

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- Create an issue on GitHub
- Check the troubleshooting section
- Review Chrome extension documentation
