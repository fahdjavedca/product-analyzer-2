import axios, { AxiosInstance } from 'axios';
import { logger } from '@/config/logger';
import { config } from '@/config';

export interface CJProduct {
  id: string;
  sourceProductId: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  vendorName: string;
  images: string[];
  categoryPath: string[];
  variants?: any[];
  weight?: number;
  sku?: string;
  listedNum?: number;
  supplierId?: string;
  productType?: string;
  customizationVersion?: number;
}

export interface CJSearchParams {
  keyword: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  limit?: number;
}

export interface CJShippingInfo {
  destinationCountry: string;
  isShippable: boolean;
  shippingCost?: number;
  etaMinDays?: number;
  etaMaxDays?: number;
  methodName?: string;
}

export class CJDropshippingService {
  private client: AxiosInstance;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private tokenExpiry: number | null = null;
  private lastAuthAttempt: number = 0;
  private authCooldown: number = 5 * 60 * 1000; // 5 minutes in milliseconds

  constructor() {
    this.client = axios.create({
      baseURL: 'https://developers.cjdropshipping.com/api2.0/v1',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
    this.initializeAuth();
  }

  private async initializeAuth() {
    try {
      await this.authenticate();
    } catch (error) {
      logger.error('Failed to initialize CJ Dropshipping authentication:', error);
    }
  }

  private async authenticate(): Promise<void> {
    // Check if we're in cooldown period
    const now = Date.now();
    if (now - this.lastAuthAttempt < this.authCooldown) {
      const remainingTime = Math.ceil((this.authCooldown - (now - this.lastAuthAttempt)) / 1000 / 60);
      throw new Error(`Rate limited: Please try again in ${remainingTime} minutes`);
    }

    this.lastAuthAttempt = now;

    try {
      const response = await this.client.post('/authentication/getAccessToken', {
        email: config.cjDropshipping.email,
        apiKey: config.cjDropshipping.password, // Using password as apiKey
      });

      if (response.status === 200 && response.data && response.data.result === true) {
        this.accessToken = response.data.data.accessToken;
        this.refreshToken = response.data.data.refreshToken;
        this.tokenExpiry = new Date(response.data.data.accessTokenExpiryDate).getTime();
        
        this.updateAuthHeaders();
        logger.info('CJ Dropshipping authentication successful', {
          accessToken: this.accessToken?.substring(0, 10) + '...',
          expiryDate: response.data.data.accessTokenExpiryDate,
        });
      } else {
        throw new Error(`Authentication failed: ${response.data.message || 'Unknown error'}`);
      }
    } catch (error: any) {
      // Handle rate limiting
      if (error.response?.status === 429) {
        logger.warn('CJ Dropshipping authentication rate limited, will retry later', {
          message: error.response.data.message,
          retryAfter: '5 minutes',
        });
        throw new Error('Rate limited: Please try again in 5 minutes');
      }
      
      logger.error('CJ Dropshipping authentication failed:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      throw error;
    }
  }

  private updateAuthHeaders() {
    if (this.accessToken) {
      this.client.defaults.headers.common['CJ-Access-Token'] = this.accessToken;
    }
  }

  private async ensureValidToken(): Promise<void> {
    // If we have a valid token, don't re-authenticate
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return;
    }
    
    // If we don't have a token or it's expired, try to authenticate
    if (!this.accessToken || (this.tokenExpiry && Date.now() >= this.tokenExpiry)) {
      await this.authenticate();
    }
  }

  private setupInterceptors() {
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Token expired, try to refresh
          try {
            await this.refreshAccessToken();
            // Retry the original request
            return this.client.request(error.config);
          } catch (refreshError) {
            // If refresh fails, try full authentication
            try {
              await this.authenticate();
              return this.client.request(error.config);
            } catch (authError) {
              return Promise.reject(authError);
            }
          }
        }
        return Promise.reject(error);
      }
    );
  }

  private async refreshAccessToken(): Promise<void> {
    try {
      if (this.refreshToken) {
        const response = await this.client.post('/authentication/refreshAccessToken', {
          refreshToken: this.refreshToken,
        });

        if (response.status === 200 && response.data && response.data.result === true) {
          this.accessToken = response.data.data.accessToken;
          this.refreshToken = response.data.data.refreshToken;
          this.tokenExpiry = new Date(response.data.data.accessTokenExpiryDate).getTime();
          this.updateAuthHeaders();
          logger.info('CJ Dropshipping token refreshed successfully');
        } else {
          throw new Error('Invalid refresh response');
        }
      } else {
        // If no refresh token, re-authenticate
        await this.authenticate();
      }
    } catch (error: any) {
      logger.error('Failed to refresh CJ Dropshipping token:', error);
      // Fallback to full authentication
      await this.authenticate();
    }
  }

  /**
   * Search for products
   */
  async searchProducts(params: CJSearchParams): Promise<CJProduct[]> {
    try {
      await this.ensureValidToken();
      
      const response = await this.client.get('/product/list', {
        params: {
          productName: params.keyword,
          categoryId: params.category,
          minPrice: params.minPrice,
          maxPrice: params.maxPrice,
          pageNum: params.page || 1,
          pageSize: params.limit || 50,
        },
      });

      // Check if response is successful based on documentation
      if (response.status !== 200 || (response.data.code && response.data.code !== 200)) {
        throw new Error(`API request failed: ${response.data.message || 'Unknown error'}`);
      }

      // Transform the response to match our expected format
      const products = response.data.data?.list || [];
      return products.map((product: any) => ({
        id: product.pid,
        sourceProductId: product.pid,
        title: product.productNameEn || product.productName,
        description: product.productName,
        price: product.sellPrice,
        currency: 'USD', // Default currency
        vendorName: product.supplierName,
        images: product.productImage ? [product.productImage] : [],
        categoryPath: product.categoryName ? [product.categoryName] : [],
        variants: product.variants || [],
        weight: product.productWeight,
        sku: product.productSku,
        listedNum: product.listedNum,
        supplierId: product.supplierId,
        productType: product.productType,
        customizationVersion: product.customizationVersion,
      }));

    } catch (error: any) {
      logger.error('Failed to search products from CJ Dropshipping:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      throw new Error('Failed to search products from CJ Dropshipping');
    }
  }

  /**
   * Get product details by ID
   */
  async getProductDetails(productId: string): Promise<CJProduct | null> {
    try {
      await this.ensureValidToken();
      
      const response = await this.client.get('/product/info', {
        params: {
          pid: productId,
        },
      });
      
      // Check if response is successful based on documentation
      if (response.status !== 200 || (response.data.code && response.data.code !== 200)) {
        throw new Error(`API request failed: ${response.data.message || 'Unknown error'}`);
      }

      const product = response.data.data;
      if (!product) return null;

      return {
        id: product.pid,
        sourceProductId: product.pid,
        title: product.productNameEn || product.productName,
        description: product.productName,
        price: product.sellPrice,
        currency: 'USD',
        vendorName: product.supplierName,
        images: product.productImage ? [product.productImage] : [],
        categoryPath: product.categoryName ? [product.categoryName] : [],
        variants: product.variants || [],
        weight: product.productWeight,
        sku: product.productSku,
        listedNum: product.listedNum,
        supplierId: product.supplierId,
        productType: product.productType,
        customizationVersion: product.customizationVersion,
      };

    } catch (error: any) {
      logger.error('Failed to get product details from CJ Dropshipping:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      throw new Error('Failed to get product details from CJ Dropshipping');
    }
  }

  /**
   * Get shipping information for a product
   */
  async getShippingInfo(productId: string, destinationCountry: string): Promise<CJShippingInfo[]> {
    try {
      await this.ensureValidToken();
      
      const response = await this.client.get(`/product/shipping/${productId}`, {
        params: {
          country: destinationCountry,
        },
      });

      // Check if response is successful based on documentation
      if (response.status !== 200 || (response.data.code && response.data.code !== 200)) {
        throw new Error(`API request failed: ${response.data.message || 'Unknown error'}`);
      }

      const shippingData = response.data.data || [];
      return shippingData.map((shipping: any) => ({
        destinationCountry: shipping.country || destinationCountry,
        isShippable: shipping.shippable || false,
        shippingCost: shipping.cost,
        etaMinDays: shipping.etaMin,
        etaMaxDays: shipping.etaMax,
        methodName: shipping.method,
      }));

    } catch (error: any) {
      logger.error('Failed to get shipping info from CJ Dropshipping:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      throw new Error('Failed to get shipping info from CJ Dropshipping');
    }
  }

  /**
   * Get product categories
   */
  async getCategories(): Promise<any[]> {
    try {
      await this.ensureValidToken();
      
      const response = await this.client.get('/product/categories');
      
      // Check if response is successful based on documentation
      if (response.status !== 200 || (response.data.code && response.data.code !== 200)) {
        throw new Error(`API request failed: ${response.data.message || 'Unknown error'}`);
      }

      return response.data.data || [];

    } catch (error: any) {
      logger.error('Failed to get categories from CJ Dropshipping:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      throw new Error('Failed to get categories from CJ Dropshipping');
    }
  }

  /**
   * Health check for CJ Dropshipping service
   */
  async healthCheck(): Promise<{ status: string; message: string }> {
    try {
      await this.ensureValidToken();
      
      const response = await this.client.get('/product/categories');
      
      if (response.status === 200) {
        return { status: 'healthy', message: 'CJ Dropshipping API is accessible' };
      } else {
        return { status: 'unhealthy', message: 'CJ Dropshipping API returned non-200 status' };
      }
    } catch (error: any) {
      return { 
        status: 'unhealthy', 
        message: `CJ Dropshipping API error: ${error.message}` 
      };
    }
  }

  /**
   * Import products by IDs
   */
  async importProducts(productIds: string[], destinationCountry: string = 'US'): Promise<{
    imported: number;
    failed: number;
    errors: string[];
  }> {
    const results = {
      imported: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const productId of productIds) {
      try {
        // Get product details
        const productDetails = await this.getProductDetails(productId);
        if (!productDetails) {
          results.failed++;
          results.errors.push(`Product ${productId} not found`);
          continue;
        }

        // Get shipping info
        const shippingInfo = await this.getShippingInfo(productId, destinationCountry);

        // Here you would typically save to database
        // For now, we'll just count as imported
        results.imported++;
        
        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error: any) {
        results.failed++;
        results.errors.push(`Failed to import product ${productId}: ${error.message}`);
      }
    }

    return results;
  }

  /**
   * Search and import products by keyword
   */
  async searchAndImportProducts(keyword: string, limit: number = 50, destinationCountry: string = 'US'): Promise<{
    searched: number;
    imported: number;
    failed: number;
    errors: string[];
  }> {
    try {
      // Search for products
      const products = await this.searchProducts({ keyword, limit });
      
      if (products.length === 0) {
        return {
          searched: 0,
          imported: 0,
          failed: 0,
          errors: ['No products found for the given keyword'],
        };
      }

      // Import the found products
      const productIds = products.map(p => p.sourceProductId);
      const importResults = await this.importProducts(productIds, destinationCountry);

      return {
        searched: products.length,
        imported: importResults.imported,
        failed: importResults.failed,
        errors: importResults.errors,
      };

    } catch (error: any) {
      logger.error('Failed to search and import products from CJ Dropshipping:', error);
      return {
        searched: 0,
        imported: 0,
        failed: 0,
        errors: [error.message],
      };
    }
  }

  /**
   * Get trending products (using search with popular keywords)
   */
  async getTrendingProducts(limit: number = 20): Promise<CJProduct[]> {
    try {
      await this.ensureValidToken();
      
      // Use popular trending keywords to find trending products
      const trendingKeywords = [
        'wireless earbuds', 'phone case', 'fitness tracker', 'led strip lights',
        'car accessories', 'home decor', 'kitchen gadgets', 'beauty tools',
        'pet supplies', 'outdoor gear', 'tech accessories', 'fashion jewelry'
      ];
      
      const randomKeyword = trendingKeywords[Math.floor(Math.random() * trendingKeywords.length)];
      
      const response = await this.client.get('/product/list', {
        params: {
          productName: randomKeyword,
          pageNum: 1,
          pageSize: limit,
          sortType: 'sales', // Sort by sales to get trending items
        },
      });

      if (response.status !== 200 || (response.data.code && response.data.code !== 200)) {
        throw new Error(`API request failed: ${response.data.message || 'Unknown error'}`);
      }

      const products = response.data.data?.list || [];
      return products.map((product: any) => ({
        id: product.pid,
        sourceProductId: product.pid,
        title: product.productNameEn || product.productName,
        description: product.productName,
        price: product.sellPrice,
        currency: 'USD',
        vendorName: product.supplierName,
        images: product.productImage ? [product.productImage] : [],
        categoryPath: product.categoryName ? [product.categoryName] : [],
        variants: product.variants || [],
        weight: product.productWeight,
        sku: product.productSku,
        listedNum: product.listedNum,
        supplierId: product.supplierId,
        productType: product.productType,
        customizationVersion: product.customizationVersion,
      }));

    } catch (error: any) {
      logger.error('Failed to get trending products from CJ Dropshipping:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      return [];
    }
  }

  /**
   * Get best selling products
   */
  async getBestSellingProducts(limit: number = 20, category?: string): Promise<CJProduct[]> {
    try {
      await this.ensureValidToken();
      
      const response = await this.client.get('/product/list', {
        params: {
          categoryId: category,
          pageNum: 1,
          pageSize: limit,
          sortType: 'sales', // Sort by sales to get best sellers
        },
      });

      if (response.status !== 200 || (response.data.code && response.data.code !== 200)) {
        throw new Error(`API request failed: ${response.data.message || 'Unknown error'}`);
      }

      const products = response.data.data?.list || [];
      return products.map((product: any) => ({
        id: product.pid,
        sourceProductId: product.pid,
        title: product.productNameEn || product.productName,
        description: product.productName,
        price: product.sellPrice,
        currency: 'USD',
        vendorName: product.supplierName,
        images: product.productImage ? [product.productImage] : [],
        categoryPath: product.categoryName ? [product.categoryName] : [],
        variants: product.variants || [],
        weight: product.productWeight,
        sku: product.productSku,
        listedNum: product.listedNum,
        supplierId: product.supplierId,
        productType: product.productType,
        customizationVersion: product.customizationVersion,
      }));

    } catch (error: any) {
      logger.error('Failed to get best selling products from CJ Dropshipping:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      return [];
    }
  }

  /**
   * Get products by category with discovery features
   */
  async getProductsByCategory(categoryId: string, limit: number = 20, sortType: 'newest' | 'sales' | 'price' = 'sales'): Promise<CJProduct[]> {
    try {
      await this.ensureValidToken();
      
      const response = await this.client.get('/product/list', {
        params: {
          categoryId,
          pageNum: 1,
          pageSize: limit,
          sortType,
        },
      });

      if (response.status !== 200 || (response.data.code && response.data.code !== 200)) {
        throw new Error(`API request failed: ${response.data.message || 'Unknown error'}`);
      }

      const products = response.data.data?.list || [];
      return products.map((product: any) => ({
        id: product.pid,
        sourceProductId: product.pid,
        title: product.productNameEn || product.productName,
        description: product.productName,
        price: product.sellPrice,
        currency: 'USD',
        vendorName: product.supplierName,
        images: product.productImage ? [product.productImage] : [],
        categoryPath: product.categoryName ? [product.categoryName] : [],
        variants: product.variants || [],
        weight: product.productWeight,
        sku: product.productSku,
        listedNum: product.listedNum,
        supplierId: product.supplierId,
        productType: product.productType,
        customizationVersion: product.customizationVersion,
      }));

    } catch (error: any) {
      logger.error('Failed to get products by category from CJ Dropshipping:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      return [];
    }
  }

  /**
   * Get featured products (newest products with good ratings)
   */
  async getFeaturedProducts(limit: number = 20): Promise<CJProduct[]> {
    try {
      await this.ensureValidToken();
      
      const response = await this.client.get('/product/list', {
        params: {
          pageNum: 1,
          pageSize: limit,
          sortType: 'newest', // Get newest products
        },
      });

      if (response.status !== 200 || (response.data.code && response.data.code !== 200)) {
        throw new Error(`API request failed: ${response.data.message || 'Unknown error'}`);
      }

      const products = response.data.data?.list || [];
      return products.map((product: any) => ({
        id: product.pid,
        sourceProductId: product.pid,
        title: product.productNameEn || product.productName,
        description: product.productName,
        price: product.sellPrice,
        currency: 'USD',
        vendorName: product.supplierName,
        images: product.productImage ? [product.productImage] : [],
        categoryPath: product.categoryName ? [product.categoryName] : [],
        variants: product.variants || [],
        weight: product.productWeight,
        sku: product.productSku,
        listedNum: product.listedNum,
        supplierId: product.supplierId,
        productType: product.productType,
        customizationVersion: product.customizationVersion,
      }));

    } catch (error: any) {
      logger.error('Failed to get featured products from CJ Dropshipping:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      return [];
    }
  }

  /**
   * Debug authentication and API access
   */
  async debugAuth(): Promise<any> {
    const results: any = {
      timestamp: new Date().toISOString(),
      testResults: {} as Record<string, any>,
    };

    // Test authentication
    try {
      await this.ensureValidToken();
      results.testResults.authentication = {
        status: 'success',
        hasToken: !!this.accessToken,
        tokenExpiry: this.tokenExpiry ? new Date(this.tokenExpiry).toISOString() : null,
        message: 'Authentication successful',
      };
    } catch (error: any) {
      results.testResults.authentication = {
        status: 'error',
        message: error.message,
        error: error.message,
      };
    }

    // Test API endpoints
    const endpoints = [
      { name: 'categories', url: '/product/categories' },
      { name: 'search', url: '/product/list', params: { productName: 'test', pageSize: 1 } },
    ];

    for (const endpoint of endpoints) {
      try {
        await this.ensureValidToken();
        const response = await this.client.get(endpoint.url, { params: endpoint.params });

        results.testResults[endpoint.name] = {
          status: 'success',
          httpStatus: response.status,
          hasData: !!response.data,
          dataKeys: Object.keys(response.data || {}),
          message: 'Endpoint accessible',
        };
      } catch (error: any) {
        results.testResults[endpoint.name] = {
          status: 'error',
          message: error.message,
          httpStatus: error.response?.status,
          error: error.message,
        };
      }
    }

    return results;
  }
}

export const cjDropshippingService = new CJDropshippingService();
