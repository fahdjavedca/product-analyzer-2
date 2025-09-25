const https = require('https');

class GoogleAdsAPI {
  constructor() {
    this.developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
    this.clientId = process.env.GOOGLE_ADS_CLIENT_ID;
    this.clientSecret = process.env.GOOGLE_ADS_CLIENT_SECRET;
    this.refreshToken = process.env.GOOGLE_ADS_REFRESH_TOKEN;
    this.customerId = process.env.GOOGLE_ADS_CUSTOMER_ID;
    this.accessToken = null;
  }

  // Get OAuth2 access token
  async getAccessToken() {
    if (this.accessToken) {
      return this.accessToken;
    }

    const postData = JSON.stringify({
      client_id: this.clientId,
      client_secret: this.clientSecret,
      refresh_token: this.refreshToken,
      grant_type: 'refresh_token'
    });

    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'oauth2.googleapis.com',
        port: 443,
        path: '/token',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            if (response.access_token) {
              this.accessToken = response.access_token;
              resolve(this.accessToken);
            } else {
              reject(new Error('Failed to get access token: ' + data));
            }
          } catch (error) {
            reject(new Error('Failed to parse OAuth response: ' + data));
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.write(postData);
      req.end();
    });
  }

  // Get keyword ideas from Google Ads API
  async getKeywordIdeas(keyword) {
    try {
      const accessToken = await this.getAccessToken();
      
      const requestBody = {
        language: "languageConstants/1000", // English
        geoTargetConstants: ["geoTargetConstants/2124"], // Canada
        includeAdultKeywords: false,
        keywordPlanNetwork: "GOOGLE_SEARCH",
        keywordSeed: {
          keywords: [keyword]
        }
      };

      const postData = JSON.stringify(requestBody);

      return new Promise((resolve, reject) => {
        const options = {
          hostname: 'googleads.googleapis.com',
          port: 443,
          path: `/v21/customers/${this.customerId.replace(/-/g, '')}:generateKeywordIdeas`,
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'developer-token': this.developerToken,
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
          }
        };

        const req = https.request(options, (res) => {
          let data = '';
          res.on('data', (chunk) => {
            data += chunk;
          });
          res.on('end', () => {
            console.log('Google Ads API Response Status:', res.statusCode);
            console.log('Google Ads API Response:', data);
            
            if (res.statusCode !== 200) {
              reject(new Error(`Google Ads API HTTP ${res.statusCode}: ${data}`));
              return;
            }
            
            try {
              const response = JSON.parse(data);
              resolve(this.parseKeywordIdeasResponse(response));
            } catch (error) {
              reject(new Error('Failed to parse Google Ads response: ' + data));
            }
          });
        });

        req.on('error', (error) => {
          reject(error);
        });

        req.write(postData);
        req.end();
      });
    } catch (error) {
      throw new Error(`Google Ads API error: ${error.message}`);
    }
  }

  // Parse Google Ads API response
  parseKeywordIdeasResponse(response) {
    try {
      if (!response.results || response.results.length === 0) {
        throw new Error('No keyword ideas returned from Google Ads API');
      }

      const result = response.results[0];
      const metrics = result.keywordIdeaMetrics;
      
      return {
        avgMonthlySearches: metrics?.avgMonthlySearches || 0,
        competition: this.mapCompetitionLevel(metrics?.competition),
        cpcLow: metrics?.lowTopOfPageBidMicros ? 
          (metrics.lowTopOfPageBidMicros / 1000000).toFixed(2) : '0.00',
        cpcHigh: metrics?.highTopOfPageBidMicros ? 
          (metrics.highTopOfPageBidMicros / 1000000).toFixed(2) : '0.00',
        isRealData: true
      };
    } catch (error) {
      throw new Error(`Failed to parse Google Ads response: ${error.message}`);
    }
  }

  // Map competition level from Google Ads API
  mapCompetitionLevel(competition) {
    if (competition === 'LOW') return 'LOW';
    if (competition === 'MEDIUM') return 'MEDIUM';
    if (competition === 'HIGH') return 'HIGH';
    return 'UNKNOWN';
  }

  // Check if API is properly configured
  isConfigured() {
    return !!(this.developerToken && this.clientId && this.clientSecret && 
              this.refreshToken && this.customerId);
  }
}

module.exports = GoogleAdsAPI;
