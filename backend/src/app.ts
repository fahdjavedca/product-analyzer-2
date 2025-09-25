import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';

import { config } from '@/config';
import { logger } from '@/config/logger';
import { corsMiddleware } from '@/middleware/cors';
import { generalLimiter } from '@/middleware/rateLimiter';
import { errorHandler, notFound } from '@/middleware/errorHandler';
import routes from '@/routes';

const app = express();

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
}));

// CORS middleware
app.use(corsMiddleware);

// Rate limiting
app.use(generalLimiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parser
app.use(cookieParser());

// Compression middleware
app.use(compression());

// Logging middleware
if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(
    morgan('combined', {
      stream: {
        write: (message: string) => {
          logger.info(message.trim());
        },
      },
    })
  );
}

// API routes
app.use(config.api.basePath, routes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Global Product Analyzer API',
    version: '1.0.0',
    documentation: `${req.protocol}://${req.get('host')}${config.api.basePath}/health`,
    environment: config.nodeEnv,
  });
});

// 404 handler
app.use(notFound);

// Error handling middleware (must be last)
app.use(errorHandler);

export default app;
