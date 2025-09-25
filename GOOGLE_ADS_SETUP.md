# Google Ads API Setup Guide

The Chrome extension requires real Google Ads API data to function. Here's how to set it up:

## 1. Google Ads API Setup

### Prerequisites
- Google Ads account
- Google Cloud Project
- Google Ads API access

### Steps

1. **Create Google Cloud Project**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one
   - Enable the Google Ads API

2. **Create Service Account**
   - Go to IAM & Admin > Service Accounts
   - Create a new service account
   - Download the JSON key file

3. **Get Google Ads API Credentials**
   - Go to [Google Ads API Center](https://ads.google.com/home/tools/api-center/)
   - Create a new application
   - Get your Developer Token, Client ID, and Client Secret

4. **Configure Backend**
   - Add to your `.env.local` file:
   ```
   GOOGLE_ADS_DEVELOPER_TOKEN=your_developer_token
   GOOGLE_ADS_CLIENT_ID=your_client_id
   GOOGLE_ADS_CLIENT_SECRET=your_client_secret
   GOOGLE_ADS_REFRESH_TOKEN=your_refresh_token
   GOOGLE_ADS_CUSTOMER_ID=your_customer_id
   ```

5. **Test the Configuration**
   - Run the test script:
   ```bash
   node test-google-ads-direct.js
   ```
   - This will verify your credentials and test the API call

## 2. Backend Implementation

The backend needs to implement the Google Ads API integration in the `parseKeywordData` function in `google-ads-service.js`.

## 3. Extension Configuration

The extension will automatically detect when Google Ads API is configured and only then will it show overlays with real data.

## Current Status

- ✅ Extension structure ready
- ✅ Backend API for keywords working
- ❌ Google Ads API not configured
- ❌ No overlays shown until Google Ads API is set up

## Next Steps

1. Set up Google Ads API credentials
2. Implement `parseKeywordData` function in backend
3. Test with real Google Ads data
4. Extension will then show real keyword analysis overlays
