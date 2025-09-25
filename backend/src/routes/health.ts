import { Router } from 'express';
import { Request, Response } from 'express';
import { prisma } from '@/config/database';
import { logger } from '@/config/logger';
import { asyncHandler } from '@/middleware/errorHandler';

const router = Router();

// Health check endpoint
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const startTime = Date.now();
    
    try {
      // Check database connectivity
      await prisma.$queryRaw`SELECT 1`;
      
      const responseTime = Date.now() - startTime;
      
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        responseTime: `${responseTime}ms`,
        services: {
          database: 'healthy',
          redis: 'healthy', // TODO: Add Redis health check
          google_ads_api: 'healthy', // TODO: Add Google Ads API health check
          shopify_api: 'healthy', // TODO: Add Shopify API health check
        },
      });
    } catch (error) {
      logger.error('Health check failed:', error);
      
      res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        error: 'Service unavailable',
        services: {
          database: 'unhealthy',
          redis: 'unknown',
          google_ads_api: 'unknown',
          shopify_api: 'unknown',
        },
      });
    }
  })
);

// Readiness probe
router.get(
  '/ready',
  asyncHandler(async (req: Request, res: Response) => {
    try {
      // Check if database is ready
      await prisma.$queryRaw`SELECT 1`;
      
      res.json({
        status: 'ready',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Readiness check failed:', error);
      res.status(503).json({
        status: 'not ready',
        timestamp: new Date().toISOString(),
        error: 'Service not ready',
      });
    }
  })
);

// Liveness probe
router.get(
  '/live',
  (req: Request, res: Response) => {
    res.json({
      status: 'alive',
      timestamp: new Date().toISOString(),
    });
  }
);

export default router;
