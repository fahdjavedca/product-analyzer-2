import { logger } from '@/config/logger';
import { config } from '@/config';

export interface KeywordMetrics {
  keyword: string;
  avgMonthlySearches: number;
  competition: number;
  cpcLow: number;
  cpcHigh: number;
}

export interface KeywordPlanRequest {
  keywords: string[];
  country: string;
  language: string;
}

export class GoogleAdsService {
  private accessToken: string | null = null;

  constructor() {
    // No need for axios client - we'll use fetch directly like the working implementation
  }

  private async getGoogleAdsAccessToken(): Promise<string> {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        client_id: config.googleAds.clientId,
        client_secret: config.googleAds.clientSecret,
        refresh_token: config.googleAds.refreshToken,
        grant_type: 'refresh_token'
      })
    });

    if (!response.ok) {
      throw new Error('Failed to get access token');
    }

    const data = await response.json() as { access_token: string };
    return data.access_token;
  }

  /**
   * Get keyword metrics using Google Ads Keyword Planner
   */
  async getKeywordMetrics(request: KeywordPlanRequest): Promise<KeywordMetrics[]> {
    try {
      // Get access token
      const accessToken = await this.getGoogleAdsAccessToken();
      
      // Make request to Google Ads API using the working implementation pattern
      const customerId = config.googleAds.customerId.replace(/-/g, '');
      const response = await fetch(`https://googleads.googleapis.com/v21/customers/${customerId}:generateKeywordIdeas`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'developer-token': config.googleAds.developerToken
        },
        body: JSON.stringify({
          language: this.getLanguageConstant(request.language),
          geoTargetConstants: [`geoTargetConstants/${this.getCountryCode(request.country)}`],
          keywordSeed: {
            keywords: request.keywords,
          },
          includeAdultKeywords: false,
          pageSize: 1000,
          historicalMetricsOptions: {
            yearMonthRange: {
              start: this.getLastMonthDate(),
              end: this.getLastMonthDate()
            }
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('Google Ads API error details:', {
          status: response.status,
          statusText: response.statusText,
          errorBody: errorText
        });
        throw new Error(`Google Ads API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json() as { results?: any[] };
      const results = data.results || [];
      
      return results.map((result: any) => ({
        keyword: result.text,
        avgMonthlySearches: result.keywordIdeaMetrics?.avgMonthlySearches || 0,
        competition: this.mapCompetitionLevel(result.keywordIdeaMetrics?.competition),
        cpcLow: this.convertMicrosToCurrency(result.keywordIdeaMetrics?.lowTopOfPageBidMicros),
        cpcHigh: this.convertMicrosToCurrency(result.keywordIdeaMetrics?.highTopOfPageBidMicros),
      }));

    } catch (error: any) {
      logger.error('Failed to get keyword metrics from Google Ads:', {
        message: error.message,
        stack: error.stack,
      });
      throw new Error('Failed to fetch keyword data from Google Ads API');
    }
  }

  /**
   * Check if the service is healthy
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.getGoogleAdsAccessToken();
      return true;
    } catch (error: any) {
      logger.error('Google Ads API health check failed:', {
        message: error.message,
      });
      return false;
    }
  }

  private mapCompetitionLevel(competition: string): number {
    const mapping: { [key: string]: number } = {
      'UNKNOWN': 0,
      'LOW': 0.25,
      'MEDIUM': 0.5,
      'HIGH': 0.75,
    };
    
    return mapping[competition] || 0;
  }

  private convertMicrosToCurrency(micros: number | undefined): number {
    if (!micros) return 0;
    return micros / 1000000; // Convert micros to currency units
  }

  private getLastMonthDate(): { year: number; month: number } {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    
    return {
      year: lastMonth.getFullYear(),
      month: lastMonth.getMonth() + 1 // Google Ads API uses 1-based months
    };
  }

  private getLanguageConstant(language: string): string {
    const languageMapping: { [key: string]: string } = {
      'en': 'languageConstants/1000', // English
      'fr': 'languageConstants/1002', // French
      'es': 'languageConstants/1003', // Spanish
      'de': 'languageConstants/1001', // German
      'it': 'languageConstants/1004', // Italian
      'pt': 'languageConstants/1014', // Portuguese
      'ja': 'languageConstants/1005', // Japanese
      'zh': 'languageConstants/1017', // Chinese
    };
    
    return languageMapping[language.toLowerCase()] || 'languageConstants/1000'; // Default to English
  }

  private getCountryCode(country: string): string {
    const countryMapping: { [key: string]: string } = {
      'US': '2840', // United States
      'CA': '2124', // Canada
      'GB': '2826', // United Kingdom
      'AU': '2036', // Australia
      'DE': '276',  // Germany
      'FR': '250',  // France
      'IT': '380',  // Italy
      'ES': '724',  // Spain
      'NL': '528',  // Netherlands
      'SE': '752',  // Sweden
      'NO': '578',  // Norway
      'DK': '208',  // Denmark
      'FI': '246',  // Finland
      'JP': '392',  // Japan
      'CN': '156',  // China
      'IN': '356',  // India
      'BR': '76',   // Brazil
      'MX': '484',  // Mexico
    };
    
    return countryMapping[country.toUpperCase()] || '2840'; // Default to US
  }
}

export const googleAdsService = new GoogleAdsService();
