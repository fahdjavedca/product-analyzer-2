import rateLimit from 'express-rate-limit';
import { config } from '@/config';

// General rate limiter
export const generalLimiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMaxRequests,
  message: {
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many requests, please try again later.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: {
        code: 'TOO_MANY_REQUESTS',
        message: 'Too many requests, please try again later.',
      },
    });
  },
});

// Strict rate limiter for import endpoints
export const importLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 requests per hour
  message: {
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Import rate limit exceeded. Please try again later.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for analysis endpoints
export const analysisLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // 50 requests per hour
  message: {
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Analysis rate limit exceeded. Please try again later.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for campaign endpoints
export const campaignLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 requests per hour
  message: {
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Campaign rate limit exceeded. Please try again later.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Auth rate limiter
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per 15 minutes
  message: {
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many authentication attempts, please try again later.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});
