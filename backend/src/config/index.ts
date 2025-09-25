import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local in the project root
const envPath = path.resolve(__dirname, '../../../.env.local');
dotenv.config({ path: envPath });

export const config = {
  // Server configuration
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Database
  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/product_analyzer_dev',
  
  // Redis
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  
  // JWT
  jwtSecret: process.env.JWT_SECRET || 'your-jwt-secret-key-change-this-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  
  // Google OAuth
  googleClientId: process.env.GOOGLE_CLIENT_ID || '',
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  
  // Google Ads API
  googleAds: {
    developerToken: process.env.GOOGLE_ADS_DEVELOPER_TOKEN || '',
    clientId: process.env.GOOGLE_ADS_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_ADS_CLIENT_SECRET || '',
    refreshToken: process.env.GOOGLE_ADS_REFRESH_TOKEN || '',
    customerId: process.env.GOOGLE_ADS_CUSTOMER_ID || '',
  },
  
  // Shopify
  shopifyStoreUrl: process.env.SHOPIFY_STORE_URL || 'https://repacked.co',
  shopifyAccessToken: process.env.SHOPIFY_ACCESS_TOKEN || '',
  
  // External APIs
  cjDropshipping: {
    apiKey: process.env.CJ_API_KEY || '',
    email: process.env.CJDROPSHIPPING_EMAIL || '',
    password: process.env.CJDROPSHIPPING_PASSWORD || '',
    baseUrl: process.env.CJDROPSHIPPING_BASE_URL || 'https://developers.cjdropshipping.com',
    rateLimit: parseInt(process.env.CJDROPSHIPPING_RATE_LIMIT || '100', 10),
  },
  aliExpress: {
    apiKey: process.env.ALIEXPRESS_API_KEY || '',
  },
  
  // File storage
  uploadDir: process.env.UPLOAD_DIR || './cache/images',
  gcsBucketName: process.env.GCS_BUCKET_NAME || '',
  
  // CORS
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  
  // Rate limiting
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
  rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '1000', 10),
  
  // API endpoints
  api: {
    version: 'v1',
    basePath: '/api/v1',
  },
  
  // External service URLs
  externalServices: {
    googleAdsApi: 'https://googleads.googleapis.com/v14',
    shopifyApi: `${process.env.SHOPIFY_STORE_URL}/admin/api/2024-01`,
    cjApi: 'https://api.cjdropshipping.com',
    aliexpressApi: 'https://api.aliexpress.com',
  },
} as const;

// Validate required environment variables
export function validateConfig(): void {
  const requiredEnvVars = [
    'DATABASE_URL',
    'JWT_SECRET',
  ];
  
  const missingVars = requiredEnvVars.filter(
    (varName) => !process.env[varName]
  );
  
  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}`
    );
  }
  
  if (config.nodeEnv === 'production') {
    const productionRequiredVars = [
      'GOOGLE_CLIENT_ID',
      'GOOGLE_CLIENT_SECRET',
      'SHOPIFY_ACCESS_TOKEN',
    ];
    
    const missingProdVars = productionRequiredVars.filter(
      (varName) => !process.env[varName]
    );
    
    if (missingProdVars.length > 0) {
      throw new Error(
        `Missing required production environment variables: ${missingProdVars.join(', ')}`
      );
    }
  }
}
