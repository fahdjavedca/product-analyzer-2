import { create } from 'zustand';
import { apiService } from '@/services/api';

export interface Product {
  id: string;
  sourcePlatform: string;
  sourceProductId: string;
  title: string;
  handle?: string;
  descriptionRaw?: string;
  price: number;
  currency: string;
  vendorName?: string;
  categoryPath: string[];
  images: string[];
  createdAt: string;
  updatedAt: string;
  productScores?: {
    oppScore: number;
    reason?: string;
    keywordSet?: {
      keywords: Array<{
        term: string;
        avgMonthlySearches?: number;
        competition?: number;
        cpcLow?: number;
        cpcHigh?: number;
        score?: number;
      }>;
    };
  }[];
  shippingOptions?: Array<{
    destinationCountry: string;
    isShippable: boolean;
    shippingCost?: number;
    etaMinDays?: number;
    etaMaxDays?: number;
    methodName?: string;
  }>;
  _count?: {
    keywordSets: number;
    campaigns: number;
  };
}

export interface ProductStats {
  totalProducts: number;
  analyzedProducts: number;
  highOpportunityProducts: number;
  activeCampaigns: number;
}

export interface ProductFilters {
  search?: string;
  sourcePlatform?: string;
  country?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: string;
  page?: number;
  limit?: number;
}

interface ProductStore {
  // State
  products: Product[];
  currentProduct: Product | null;
  stats: ProductStats | null;
  filters: ProductFilters;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  loading: boolean;
  error: string | null;

  // Actions
  fetchProducts: (filters?: ProductFilters) => Promise<void>;
  fetchProductById: (id: string) => Promise<void>;
  fetchStats: () => Promise<void>;
  importProducts: (data: {
    sourcePlatform: 'cj_dropshipping' | 'aliexpress';
    productIds: string[];
    destinationCountry: string;
    analyzeKeywords?: boolean;
  }) => Promise<{ success: boolean; data: any }>;
  analyzeKeywords: (id: string, country?: string) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  setFilters: (filters: Partial<ProductFilters>) => void;
  clearError: () => void;
}

export const useProductStore = create<ProductStore>((set, get) => ({
  // Initial state
  products: [],
  currentProduct: null,
  stats: null,
  filters: {
    page: 1,
    limit: 20,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  },
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  },
  loading: false,
  error: null,

  // Actions
  fetchProducts: async (filters = {}) => {
    set({ loading: true, error: null });
    
    try {
      const currentFilters = { ...get().filters, ...filters };
      const response = await apiService.getProducts(currentFilters);
      
      set({
        products: response.data.products,
        pagination: response.data.pagination,
        filters: currentFilters,
        loading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.error || 'Failed to fetch products',
        loading: false,
      });
    }
  },

  fetchProductById: async (id: string) => {
    set({ loading: true, error: null });
    
    try {
      const response = await apiService.getProductById(id);
      set({
        currentProduct: response.data,
        loading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.error || 'Failed to fetch product',
        loading: false,
      });
    }
  },

  fetchStats: async () => {
    try {
      const response = await apiService.getProductStats();
      set({ stats: response.data });
    } catch (error: any) {
      console.error('Failed to fetch stats:', error);
      // Set default stats on error to prevent UI issues
      set({ 
        stats: {
          totalProducts: 0,
          analyzedProducts: 0,
          highOpportunityProducts: 0,
          activeCampaigns: 0
        }
      });
    }
  },

  importProducts: async (data) => {
    set({ loading: true, error: null });
    
    try {
      const response = await apiService.importProducts(data);
      set({ loading: false });
      return response;
    } catch (error: any) {
      set({
        error: error.response?.data?.error || 'Failed to import products',
        loading: false,
      });
      return { success: false, data: null };
    }
  },

  analyzeKeywords: async (id: string, country = 'US') => {
    set({ loading: true, error: null });
    
    try {
      await apiService.analyzeKeywords(id, country);
      // Refresh the current product to get updated keyword data
      await get().fetchProductById(id);
      set({ loading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.error || 'Failed to analyze keywords',
        loading: false,
      });
    }
  },

  deleteProduct: async (id: string) => {
    set({ loading: true, error: null });
    
    try {
      await apiService.deleteProduct(id);
      // Remove product from local state
      set({
        products: get().products.filter(p => p.id !== id),
        loading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.error || 'Failed to delete product',
        loading: false,
      });
    }
  },

  setFilters: (filters) => {
    set({ filters: { ...get().filters, ...filters } });
  },

  clearError: () => {
    set({ error: null });
  },
}));
