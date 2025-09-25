import axios, { AxiosInstance } from 'axios';

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000/api/v1';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Add auth token if available
        const token = localStorage.getItem('authToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Handle unauthorized access
          localStorage.removeItem('authToken');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Health check
  async healthCheck() {
    const response = await this.client.get('/health');
    return response.data;
  }

  // Products
  async getProducts(params?: {
    page?: number;
    limit?: number;
    search?: string;
    sourcePlatform?: string;
    country?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: string;
  }) {
    const response = await this.client.get('/products', { params });
    return response.data;
  }

  async getProductById(id: string) {
    const response = await this.client.get(`/products/${id}`);
    return response.data;
  }

  async importProducts(data: {
    sourcePlatform: 'cj_dropshipping' | 'aliexpress';
    productIds: string[];
    destinationCountry: string;
    analyzeKeywords?: boolean;
  }) {
    const response = await this.client.post('/products/import', data);
    return response.data;
  }

  async analyzeKeywords(id: string, country: string = 'US') {
    const response = await this.client.post(`/products/${id}/analyze-keywords`, { country });
    return response.data;
  }

  async deleteProduct(id: string) {
    const response = await this.client.delete(`/products/${id}`);
    return response.data;
  }

  async getProductStats() {
    const response = await this.client.get('/products/stats');
    return response.data;
  }
}

export const apiService = new ApiService();
