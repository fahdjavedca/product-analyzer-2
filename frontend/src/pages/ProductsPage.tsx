import { Helmet } from 'react-helmet-async';
import { useEffect, useState } from 'react';
import { useProductStore } from '@/store/productStore';
import { toast } from 'react-hot-toast';

interface DiscoveryProduct {
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

interface Category {
  id: string;
  name: string;
  parentId?: string;
  children?: Category[];
}

export default function ProductsPage() {
  const {
    products,
    stats,
    filters,
    pagination,
    loading,
    fetchProducts,
    fetchStats,
    importProducts,
    setFilters,
  } = useProductStore();

  // Discovery state
  const [activeTab, setActiveTab] = useState<'trending' | 'bestsellers' | 'featured' | 'categories' | 'search'>('trending');
  const [discoveryProducts, setDiscoveryProducts] = useState<DiscoveryProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [discoveryLoading, setDiscoveryLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [importLoading, setImportLoading] = useState(false);
  const [lastApiCall, setLastApiCall] = useState<number>(0);

  useEffect(() => {
    // Load data with delays to prevent rate limiting
    const loadData = async () => {
      try {
        await fetchProducts();
        await new Promise(resolve => setTimeout(resolve, 500)); // 500ms delay
        await fetchStats();
        await new Promise(resolve => setTimeout(resolve, 500)); // 500ms delay
        await loadCategories();
        await new Promise(resolve => setTimeout(resolve, 1000)); // 1s delay
        await loadDiscoveryProducts('trending');
      } catch (error) {
        console.error('Error loading initial data:', error);
      }
    };
    
    loadData();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/v1/products/cj/categories', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.status === 429) {
        console.warn('Rate limited when loading categories');
        // Set some demo categories
        setCategories([
          { id: 'electronics', name: 'Electronics' },
          { id: 'home-garden', name: 'Home & Garden' },
          { id: 'sports', name: 'Sports & Fitness' },
          { id: 'beauty', name: 'Beauty & Health' },
          { id: 'automotive', name: 'Automotive' },
          { id: 'fashion', name: 'Fashion & Accessories' },
        ]);
        return;
      }
      
      const data = await response.json();
      if (data.success) {
        setCategories(data.data || []);
      } else {
        // Set demo categories on API failure
        setCategories([
          { id: 'electronics', name: 'Electronics' },
          { id: 'home-garden', name: 'Home & Garden' },
          { id: 'sports', name: 'Sports & Fitness' },
          { id: 'beauty', name: 'Beauty & Health' },
          { id: 'automotive', name: 'Automotive' },
          { id: 'fashion', name: 'Fashion & Accessories' },
        ]);
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
      // Set demo categories on error
      setCategories([
        { id: 'electronics', name: 'Electronics' },
        { id: 'home-garden', name: 'Home & Garden' },
        { id: 'sports', name: 'Sports & Fitness' },
        { id: 'beauty', name: 'Beauty & Health' },
        { id: 'automotive', name: 'Automotive' },
        { id: 'fashion', name: 'Fashion & Accessories' },
      ]);
    }
  };

  const loadDiscoveryProducts = async (type: string, categoryId?: string) => {
    // Debounce API calls to prevent rate limiting
    const now = Date.now();
    if (now - lastApiCall < 2000) { // 2 second debounce
      console.log('Debouncing API call to prevent rate limiting');
      return;
    }
    setLastApiCall(now);
    
    setDiscoveryLoading(true);
    try {
      let endpoint = '';
      switch (type) {
        case 'trending':
          endpoint = 'http://localhost:3000/api/v1/products/cj/trending?limit=20';
          break;
        case 'bestsellers':
          endpoint = `http://localhost:3000/api/v1/products/cj/best-selling?limit=20${categoryId ? `&category=${categoryId}` : ''}`;
          break;
        case 'featured':
          endpoint = 'http://localhost:3000/api/v1/products/cj/featured?limit=20';
          break;
        case 'categories':
          if (categoryId) {
            endpoint = `http://localhost:3000/api/v1/products/cj/category/${categoryId}?limit=20`;
          }
          break;
        case 'search':
          if (searchQuery.trim()) {
            endpoint = `http://localhost:3000/api/v1/products/cj/search?keyword=${encodeURIComponent(searchQuery)}&limit=20`;
          }
          break;
      }

      if (endpoint) {
        const response = await fetch(endpoint, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (response.status === 429) {
          toast.error('Rate limited. Please wait a moment before trying again.');
          // Show demo data instead of empty state
          if (type === 'trending') {
            setDiscoveryProducts([
              {
                id: 'demo-1',
                sourceProductId: 'demo-1',
                title: 'Wireless Bluetooth Earbuds - High Quality Sound',
                description: 'Premium wireless earbuds with noise cancellation',
                price: 29.99,
                currency: 'USD',
                vendorName: 'TechSupplier',
                images: ['https://via.placeholder.com/300x300?text=Wireless+Earbuds'],
                categoryPath: ['Electronics', 'Audio'],
              },
              {
                id: 'demo-2',
                sourceProductId: 'demo-2',
                title: 'LED Strip Lights - Smart Home Lighting',
                description: 'RGB LED strip lights with remote control',
                price: 19.99,
                currency: 'USD',
                vendorName: 'HomeDecor Co',
                images: ['https://via.placeholder.com/300x300?text=LED+Strip'],
                categoryPath: ['Home & Garden', 'Lighting'],
              },
            ]);
          } else {
            setDiscoveryProducts([]);
          }
          return;
        }
        
        const data = await response.json();
        
        if (data.success) {
          setDiscoveryProducts(data.data.products || []);
          setSelectedProducts([]);
        } else {
          // If API fails, show some mock data for demonstration
          if (type === 'trending') {
            setDiscoveryProducts([
              {
                id: 'demo-1',
                sourceProductId: 'demo-1',
                title: 'Wireless Bluetooth Earbuds - High Quality Sound',
                description: 'Premium wireless earbuds with noise cancellation',
                price: 29.99,
                currency: 'USD',
                vendorName: 'TechSupplier',
                images: ['https://via.placeholder.com/300x300?text=Wireless+Earbuds'],
                categoryPath: ['Electronics', 'Audio'],
              },
              {
                id: 'demo-2',
                sourceProductId: 'demo-2',
                title: 'LED Strip Lights - Smart Home Lighting',
                description: 'RGB LED strip lights with remote control',
                price: 19.99,
                currency: 'USD',
                vendorName: 'HomeDecor Co',
                images: ['https://via.placeholder.com/300x300?text=LED+Strip'],
                categoryPath: ['Home & Garden', 'Lighting'],
              },
              {
                id: 'demo-3',
                sourceProductId: 'demo-3',
                title: 'Fitness Tracker Watch - Health Monitor',
                description: 'Smart fitness tracker with heart rate monitor',
                price: 49.99,
                currency: 'USD',
                vendorName: 'FitnessGear',
                images: ['https://via.placeholder.com/300x300?text=Fitness+Tracker'],
                categoryPath: ['Sports', 'Fitness'],
              },
            ]);
          } else {
            setDiscoveryProducts([]);
          }
          toast.error('API temporarily unavailable. Showing demo data.');
        }
      }
    } catch (error) {
      console.error('Discovery API error:', error);
      // Show demo data on error
      if (type === 'trending') {
        setDiscoveryProducts([
          {
            id: 'demo-1',
            sourceProductId: 'demo-1',
            title: 'Wireless Bluetooth Earbuds - High Quality Sound',
            description: 'Premium wireless earbuds with noise cancellation',
            price: 29.99,
            currency: 'USD',
            vendorName: 'TechSupplier',
            images: ['https://via.placeholder.com/300x300?text=Wireless+Earbuds'],
            categoryPath: ['Electronics', 'Audio'],
          },
          {
            id: 'demo-2',
            sourceProductId: 'demo-2',
            title: 'LED Strip Lights - Smart Home Lighting',
            description: 'RGB LED strip lights with remote control',
            price: 19.99,
            currency: 'USD',
            vendorName: 'HomeDecor Co',
            images: ['https://via.placeholder.com/300x300?text=LED+Strip'],
            categoryPath: ['Home & Garden', 'Lighting'],
          },
        ]);
      } else {
        setDiscoveryProducts([]);
      }
      toast.error('Failed to load products. Showing demo data.');
    } finally {
      setDiscoveryLoading(false);
    }
  };

  const handleTabChange = (tab: 'trending' | 'bestsellers' | 'featured' | 'categories' | 'search') => {
    setActiveTab(tab);
    setSelectedCategory('');
    if (tab !== 'search') {
      loadDiscoveryProducts(tab);
    }
  };

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    loadDiscoveryProducts('categories', categoryId);
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      setActiveTab('search');
      loadDiscoveryProducts('search');
    }
  };

  const handleImport = async () => {
    if (selectedProducts.length === 0) {
      toast.error('Please select at least one product to import');
      return;
    }
    
    setImportLoading(true);
    try {
      const result = await importProducts({
        sourcePlatform: 'cj_dropshipping',
        productIds: selectedProducts,
        destinationCountry: 'US',
        analyzeKeywords: true,
      });

      if (result.success) {
        toast.success(`Successfully imported ${result.data.imported} products`);
        setSelectedProducts([]);
        fetchProducts();
        fetchStats();
      } else {
        toast.error(`Import failed: ${result.data.errors.join(', ')}`);
      }
    } catch (error) {
      toast.error('Import failed: ' + (error as Error).message);
    } finally {
      setImportLoading(false);
    }
  };

  const toggleProductSelection = (productId: string) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  return (
    <>
      <Helmet>
        <title>Product Discovery - Global Product Analyzer</title>
      </Helmet>
      
      <div className="space-y-6">
        {/* Page header */}
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-gray-900">Product Discovery</h1>
            <p className="mt-1 text-sm text-gray-500">
              Discover trending products, best sellers, and new opportunities
            </p>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">
            {selectedProducts.length > 0 && (
              <button
                type="button"
                onClick={handleImport}
                disabled={importLoading}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {importLoading ? 'Importing...' : `Import ${selectedProducts.length} Product${selectedProducts.length !== 1 ? 's' : ''}`}
              </button>
            )}
            <button
              type="button"
              onClick={() => window.location.href = '/products/manage'}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Manage Products
            </button>
          </div>
        </div>

        {/* Discovery Tabs */}
        <div className="bg-white shadow rounded-lg">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
              {[
                { id: 'trending', name: 'Trending', icon: '🔥' },
                { id: 'bestsellers', name: 'Best Sellers', icon: '⭐' },
                { id: 'featured', name: 'Featured', icon: '✨' },
                { id: 'categories', name: 'Categories', icon: '📂' },
                { id: 'search', name: 'Search', icon: '🔍' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id as any)}
                  className={`${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.name}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Search Bar */}
          {activeTab === 'search' && (
            <div className="p-6 border-b border-gray-200">
              <div className="flex space-x-4">
                <div className="flex-1">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    placeholder="Search for products..."
                  />
                </div>
                <button
                  onClick={handleSearch}
                  disabled={!searchQuery.trim()}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Search
                </button>
              </div>
            </div>
          )}

          {/* Category Selection */}
          {activeTab === 'categories' && (
            <div className="p-6 border-b border-gray-200">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleCategorySelect('')}
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    selectedCategory === ''
                      ? 'bg-primary-100 text-primary-800'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All Categories
                </button>
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => handleCategorySelect(category.id)}
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      selectedCategory === category.id
                        ? 'bg-primary-100 text-primary-800'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Product Grid */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              {activeTab === 'trending' && '🔥 Trending Products'}
              {activeTab === 'bestsellers' && '⭐ Best Sellers'}
              {activeTab === 'featured' && '✨ Featured Products'}
              {activeTab === 'categories' && '📂 Products by Category'}
              {activeTab === 'search' && '🔍 Search Results'}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {discoveryProducts.length} products found
              {selectedProducts.length > 0 && ` • ${selectedProducts.length} selected`}
            </p>
          </div>
          
          {discoveryLoading ? (
            <div className="px-6 py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-500">Loading products...</p>
              </div>
            </div>
          ) : discoveryProducts.length === 0 ? (
            <div className="px-6 py-12">
              <div className="text-center">
                <p className="text-gray-500">No products found</p>
                <p className="mt-1 text-sm text-gray-400">
                  Try a different search or category
                </p>
              </div>
            </div>
          ) : (
            <div className="p-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {discoveryProducts.map((product) => (
                  <div
                    key={product.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                      selectedProducts.includes(product.id)
                        ? 'border-primary-500 bg-primary-50 shadow-md'
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                    }`}
                    onClick={() => toggleProductSelection(product.id)}
                  >
                    <div className="flex flex-col h-full">
                      {/* Product Image */}
                      <div className="aspect-w-16 aspect-h-12 mb-4">
                        {product.images && product.images.length > 0 ? (
                          <img
                            className="w-full h-32 object-cover rounded-lg"
                            src={product.images[0]}
                            alt={product.title}
                          />
                        ) : (
                          <div className="w-full h-32 bg-gray-200 rounded-lg flex items-center justify-center">
                            <span className="text-gray-400 text-sm">No Image</span>
                          </div>
                        )}
                      </div>

                      {/* Product Info */}
                      <div className="flex-1 flex flex-col">
                        <h4 className="text-sm font-medium text-gray-900 line-clamp-2 mb-2">
                          {product.title}
                        </h4>
                        
                        <div className="text-sm text-gray-500 mb-2">
                          {product.vendorName}
                        </div>
                        
                        <div className="text-lg font-semibold text-gray-900 mb-2">
                          ${product.price} {product.currency}
                        </div>
                        
                        {product.categoryPath && product.categoryPath.length > 0 && (
                          <div className="text-xs text-gray-400 mb-3">
                            {product.categoryPath.join(' > ')}
                          </div>
                        )}

                        {/* Selection Checkbox */}
                        <div className="mt-auto flex items-center justify-between">
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              checked={selectedProducts.includes(product.id)}
                              onChange={() => toggleProductSelection(product.id)}
                              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                            />
                            <label className="ml-2 text-sm text-gray-700">
                              Select
                            </label>
                          </div>
                          
                          {product.listedNum && (
                            <div className="text-xs text-gray-500">
                              Listed: {product.listedNum}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}