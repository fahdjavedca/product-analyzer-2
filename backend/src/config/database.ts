import { PrismaClient } from '@prisma/client';
import { logger } from './logger';

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

// Prevent multiple instances of Prisma Client in development
export const prisma = globalThis.__prisma || new PrismaClient({
  log: [
    {
      emit: 'event',
      level: 'query',
    },
    {
      emit: 'event',
      level: 'error',
    },
    {
      emit: 'event',
      level: 'info',
    },
    {
      emit: 'event',
      level: 'warn',
    },
  ],
});

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma;
}

// Note: Prisma event logging can be configured via environment variables
// For development, you can set DATABASE_URL with ?debug=true to see queries

export async function connectDatabase(): Promise<void> {
  try {
    await prisma.$connect();
    logger.info('✅ Database connected successfully');
  } catch (error) {
    logger.error('❌ Database connection failed:', error);
    throw error;
  }
}

export async function disconnectDatabase(): Promise<void> {
  try {
    await prisma.$disconnect();
    logger.info('✅ Database disconnected successfully');
  } catch (error) {
    logger.error('❌ Database disconnection failed:', error);
    throw error;
  }
}
