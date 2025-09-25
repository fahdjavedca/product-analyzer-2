import { Request, Response, NextFunction } from 'express';
import { logger } from '@/config/logger';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export class CustomError extends Error implements AppError {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

export function createError(message: string, statusCode: number = 500): CustomError {
  return new CustomError(message, statusCode);
}

export function errorHandler(
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  let error = { ...err };
  error.message = err.message;

  // Log error
  logger.error('Error occurred:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = createError(message, 404);
  }

  // Mongoose duplicate key
  if (err.name === 'MongoError' && (err as any).code === 11000) {
    const message = 'Duplicate field value entered';
    error = createError(message, 400);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values((err as any).errors).map((val: any) => val.message).join(', ');
    error = createError(message, 400);
  }

  // Prisma errors
  if (err.name === 'PrismaClientKnownRequestError') {
    const prismaError = err as any;
    if (prismaError.code === 'P2002') {
      const message = 'Duplicate field value entered';
      error = createError(message, 409);
    } else if (prismaError.code === 'P2025') {
      const message = 'Record not found';
      error = createError(message, 404);
    } else {
      const message = 'Database operation failed';
      error = createError(message, 500);
    }
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = createError(message, 401);
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    error = createError(message, 401);
  }

  // Rate limit errors
  if (err.message && err.message.includes('Too many requests')) {
    const message = 'Too many requests, please try again later';
    error = createError(message, 429);
  }

  res.status(error.statusCode || 500).json({
    error: {
      code: getErrorCode(error.statusCode || 500),
      message: error.message || 'Internal Server Error',
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
    },
  });
}

function getErrorCode(statusCode: number): string {
  const errorCodes: Record<number, string> = {
    400: 'BAD_REQUEST',
    401: 'UNAUTHORIZED',
    403: 'FORBIDDEN',
    404: 'NOT_FOUND',
    409: 'CONFLICT',
    422: 'UNPROCESSABLE_ENTITY',
    429: 'TOO_MANY_REQUESTS',
    500: 'INTERNAL_SERVER_ERROR',
    502: 'BAD_GATEWAY',
    503: 'SERVICE_UNAVAILABLE',
  };
  
  return errorCodes[statusCode] || 'UNKNOWN_ERROR';
}

export function notFound(req: Request, res: Response, next: NextFunction): void {
  const error = createError(`Not found - ${req.originalUrl}`, 404);
  next(error);
}

export function asyncHandler(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
