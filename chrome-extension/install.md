# Installation Guide

## Quick Start

1. **Open Chrome Extensions Page**
   - Go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)

2. **Load the Extension**
   - Click "Load unpacked"
   - Select the `chrome-extension` folder
   - The extension should appear in your extensions list

3. **Configure Backend APIs (Optional but Recommended)**
   - Add your OpenAI API key to the backend `.env` file
   - Get API key from: https://platform.openai.com/api-keys
   - Restart the backend server

4. **Test the Extension**
   - Go to [CJ Dropshipping](https://www.cjdropshipping.com)
   - Navigate to any product listing page
   - Click "Analyze Products" button
   - You should see opportunity score badges on products

## Features to Test

- **Manual analysis**: Click "Analyze Products" button to trigger analysis
- **Score badges**: Look for colored badges (green/orange/red) on product cards
- **Hover details**: Hover over badges to see detailed metrics
- **Extension popup**: Click the extension icon to see settings and stats

## Troubleshooting

**Extension not working:**
1. Make sure you're on a CJ Dropshipping page (https://www.cjdropshipping.com)
2. Check browser console for errors (F12 → Console tab)
3. Verify extension is enabled in chrome://extensions/
4. Look for "CJ Analyzer: Ready" indicator in top-left corner

**No overlays appearing:**
1. Click the "Analyze Products" button that appears in top-left corner
2. Check console for "Found X product elements" message
3. If it says "Found 0 product elements", CJ Dropshipping may have changed their HTML structure

**Debug the issue:**
1. Open browser console (F12 → Console tab)
2. Copy and paste the contents of `debug.js` into the console
3. Run it to see what elements are detected
4. Share the output to help identify the correct selectors

**No data available:**
- The extension requires real Google Ads API data
- For intelligent keywords, add your OpenAI API key to the backend `.env` file
- For real Google Ads data, configure Google Ads API credentials in the backend
- See README.md for API setup instructions

**Still not working:**
1. Try refreshing the CJ Dropshipping page
2. Disable and re-enable the extension
3. Check if there are any JavaScript errors in the console
4. Make sure you're on a product listing page, not a single product page

## Development

To modify the extension:

1. Edit the relevant files
2. Go to `chrome://extensions/`
3. Click the refresh icon on the extension
4. Reload the CJ Dropshipping page
5. Test your changes

## Next Steps

1. **Customize selectors**: Update product selectors in `content.js` to match CJ's current HTML
2. **Add Google Ads API**: Configure real API credentials for accurate data
3. **Improve scoring**: Adjust the opportunity scoring algorithm
4. **Add features**: Export data, save favorites, etc.
