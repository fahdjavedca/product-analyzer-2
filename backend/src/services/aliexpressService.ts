import axios, { AxiosInstance } from 'axios';
import { logger } from '@/config/logger';
import { config } from '@/config';

export interface AliExpressProduct {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  images: string[];
  categoryPath: string[];
  vendorName: string;
  shippingInfo: {
    isShippable: boolean;
    shippingCost: number;
    etaMinDays: number;
    etaMaxDays: number;
    methodName: string;
  }[];
}

export interface AliExpressSearchParams {
  keyword?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  limit?: number;
  sortBy?: 'price' | 'sales' | 'rating' | 'newest';
}

export interface AliExpressShippingInfo {
  destinationCountry: string;
  isShippable: boolean;
  shippingCost: number;
  etaMinDays: number;
  etaMaxDays: number;
  methodName: string;
}

export class AliExpressService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: 'https://api-sg.aliexpress.com',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.aliExpress.apiKey}`,
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        logger.error('AliExpress API error:', {
          status: error.response?.status,
          message: error.response?.data?.message || error.message,
          url: error.config?.url,
        });
        return Promise.reject(error);
      }
    );
  }

  /**
   * Search for products
   */
  async searchProducts(params: AliExpressSearchParams): Promise<AliExpressProduct[]> {
    try {
      const response = await this.client.get('/product/search', {
        params: {
          q: params.keyword,
          categoryId: params.category,
          minPrice: params.minPrice,
          maxPrice: params.maxPrice,
          page: params.page || 1,
          pageSize: params.limit || 50,
          sort: params.sortBy || 'sales',
        },
      });

      const products = response.data.data?.products || [];
      
      return products.map((product: any) => ({
        id: product.productId,
        title: product.title,
        description: product.description || '',
        price: parseFloat(product.price),
        currency: product.currency || 'USD',
        images: product.images || [],
        categoryPath: [product.categoryName || ''],
        vendorName: product.storeName || 'AliExpress',
        shippingInfo: [], // Will be populated separately
      }));

    } catch (error) {
      logger.error('Failed to search products from AliExpress:', error);
      throw new Error('Failed to search products from AliExpress');
    }
  }

  /**
   * Get product details by ID
   */
  async getProductDetails(productId: string): Promise<AliExpressProduct | null> {
    try {
      const response = await this.client.get(`/product/detail/${productId}`);
      
      const product = response.data.data;
      if (!product) return null;

      return {
        id: product.productId,
        title: product.title,
        description: product.description || '',
        price: parseFloat(product.price),
        currency: product.currency || 'USD',
        images: product.images || [],
        categoryPath: [product.categoryName || ''],
        vendorName: product.storeName || 'AliExpress',
        shippingInfo: [], // Will be populated separately
      };

    } catch (error) {
      logger.error('Failed to get product details from AliExpress:', error);
      throw new Error('Failed to get product details from AliExpress');
    }
  }

  /**
   * Get shipping information for a product
   */
  async getShippingInfo(productId: string, destinationCountry: string): Promise<AliExpressShippingInfo[]> {
    try {
      const response = await this.client.get(`/product/shipping/${productId}`, {
        params: {
          country: destinationCountry,
        },
      });

      const shippingOptions = response.data.data?.shippingOptions || [];
      
      return shippingOptions.map((option: any) => ({
        destinationCountry,
        isShippable: option.isShippable || false,
        shippingCost: parseFloat(option.shippingCost || 0),
        etaMinDays: parseInt(option.etaMinDays || 0),
        etaMaxDays: parseInt(option.etaMaxDays || 0),
        methodName: option.methodName || 'Standard Shipping',
      }));

    } catch (error) {
      logger.error('Failed to get shipping info from AliExpress:', error);
      return [{
        destinationCountry,
        isShippable: false,
        shippingCost: 0,
        etaMinDays: 0,
        etaMaxDays: 0,
        methodName: 'Unknown',
      }];
    }
  }

  /**
   * Get product categories
   */
  async getCategories(): Promise<Array<{ id: string; name: string; parentId?: string }>> {
    try {
      const response = await this.client.get('/product/categories');
      
      const categories = response.data.data || [];
      return categories.map((category: any) => ({
        id: category.categoryId,
        name: category.categoryName,
        parentId: category.parentCategoryId,
      }));

    } catch (error) {
      logger.error('Failed to get categories from AliExpress:', error);
      return [];
    }
  }

  /**
   * Get trending products
   */
  async getTrendingProducts(limit: number = 20): Promise<AliExpressProduct[]> {
    try {
      const response = await this.client.get('/product/trending', {
        params: {
          limit,
        },
      });

      const products = response.data.data?.products || [];
      
      return products.map((product: any) => ({
        id: product.productId,
        title: product.title,
        description: product.description || '',
        price: parseFloat(product.price),
        currency: product.currency || 'USD',
        images: product.images || [],
        categoryPath: [product.categoryName || ''],
        vendorName: product.storeName || 'AliExpress',
        shippingInfo: [],
      }));

    } catch (error) {
      logger.error('Failed to get trending products from AliExpress:', error);
      return [];
    }
  }

  /**
   * Check if the service is healthy
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/product/categories');
      return response.status === 200;
    } catch (error) {
      logger.error('AliExpress API health check failed:', error);
      return false;
    }
  }
}

export const aliExpressService = new AliExpressService();
