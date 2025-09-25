import axios, { AxiosInstance } from 'axios';
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
  private client: AxiosInstance;
  private accessToken: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: 'https://googleads.googleapis.com/v16',
      headers: {
        'Content-Type': 'application/json',
        'developer-token': config.googleAds.developerToken,
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor to add access token
    this.client.interceptors.request.use(async (config) => {
      if (!this.accessToken) {
        await this.refreshAccessToken();
      }
      
      if (this.accessToken) {
        config.headers.Authorization = `Bearer ${this.accessToken}`;
      }
      
      return config;
    });

    // Response interceptor to handle token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401 && this.accessToken) {
          logger.info('Access token expired, refreshing...');
          await this.refreshAccessToken();
          
          // Retry the original request
          if (this.accessToken) {
            error.config.headers.Authorization = `Bearer ${this.accessToken}`;
            return this.client.request(error.config);
          }
        }
        
        return Promise.reject(error);
      }
    );
  }

  private async refreshAccessToken(): Promise<void> {
    try {
      const response = await axios.post('https://oauth2.googleapis.com/token', {
        client_id: config.googleAds.clientId,
        client_secret: config.googleAds.clientSecret,
        refresh_token: config.googleAds.refreshToken,
        grant_type: 'refresh_token',
      });

      this.accessToken = response.data.access_token;
      logger.info('Google Ads access token refreshed successfully');
    } catch (error) {
      logger.error('Failed to refresh Google Ads access token:', error);
      throw new Error('Failed to authenticate with Google Ads API');
    }
  }

  /**
   * Get keyword metrics using Google Ads Keyword Planner
   */
  async getKeywordMetrics(request: KeywordPlanRequest): Promise<KeywordMetrics[]> {
    try {
      const response = await this.client.post('/customers/me/keywordPlanIdeaService:generateKeywordIdeas', {
        customerId: config.googleAds.customerId,
        language: request.language,
        geoTargetConstants: [`geoTargetConstants/${request.country}`],
        keywordSeed: {
          keywords: request.keywords,
        },
        keywordAndUrlSeed: {
          keywords: request.keywords,
        },
        includeAdultKeywords: false,
        pageSize: 1000,
      });

      const keywords = response.data.results || [];
      
      return keywords.map((result: any) => ({
        keyword: result.text,
        avgMonthlySearches: result.keywordIdeaMetrics?.avgMonthlySearches || 0,
        competition: this.mapCompetitionLevel(result.keywordIdeaMetrics?.competition),
        cpcLow: this.convertMicrosToCurrency(result.keywordIdeaMetrics?.lowTopOfPageBidMicros),
        cpcHigh: this.convertMicrosToCurrency(result.keywordIdeaMetrics?.highTopOfPageBidMicros),
      }));

    } catch (error: any) {
      logger.error('Failed to get keyword metrics from Google Ads:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      throw new Error('Failed to fetch keyword data from Google Ads API');
    }
  }

  /**
   * Get keyword suggestions based on seed keywords
   */
  async getKeywordSuggestions(seedKeywords: string[], country: string = 'US'): Promise<string[]> {
    try {
      const response = await this.client.post('/customers/me/keywordPlanIdeaService:generateKeywordIdeas', {
        customerId: config.googleAds.customerId,
        language: 'en',
        geoTargetConstants: [`geoTargetConstants/${country}`],
        keywordSeed: {
          keywords: seedKeywords,
        },
        includeAdultKeywords: false,
        pageSize: 1000,
      });

      const keywords = response.data.results || [];
      return keywords.map((result: any) => result.text);

    } catch (error: any) {
      logger.error('Failed to get keyword suggestions from Google Ads:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      throw new Error('Failed to fetch keyword suggestions from Google Ads API');
    }
  }

  /**
   * Check if the service is healthy
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.refreshAccessToken();
      return !!this.accessToken;
    } catch (error: any) {
      logger.error('Google Ads API health check failed:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
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
}

export const googleAdsService = new GoogleAdsService();
