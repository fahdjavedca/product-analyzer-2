import cors from 'cors';
import { config } from '@/config';

const corsOptions = {
  origin: (origin: string | undefined, callback: Function) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      config.corsOrigin,
      config.frontendUrl,
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:5175',
      'http://localhost:5176',
    ];
    
    // In production, only allow specific origins
    if (config.nodeEnv === 'production') {
      const allowedProdOrigins = [
        'https://repacked.co',
        'https://www.repacked.co',
      ];
      
      if (allowedProdOrigins.includes(origin)) {
        return callback(null, true);
      }
      
      return callback(new Error('Not allowed by CORS'));
    }
    
    // In development, allow localhost origins
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control',
    'Pragma',
  ],
  exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
  maxAge: 86400, // 24 hours
};

export const corsMiddleware = cors(corsOptions);
