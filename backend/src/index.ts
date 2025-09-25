import app from './app';
import { config, validateConfig } from '@/config';
import { connectDatabase } from '@/config/database';
import { logger } from '@/config/logger';

async function startServer(): Promise<void> {
  try {
    // Validate configuration
    validateConfig();
    logger.info('✅ Configuration validated');

    // Connect to database
    await connectDatabase();

    // Start server
    const server = app.listen(config.port, () => {
      logger.info(`🚀 Server running on port ${config.port}`);
      logger.info(`📊 Environment: ${config.nodeEnv}`);
      logger.info(`🔗 API Base URL: http://localhost:${config.port}${config.api.basePath}`);
      logger.info(`❤️  Health Check: http://localhost:${config.port}${config.api.basePath}/health`);
    });

    // Graceful shutdown
    const gracefulShutdown = (signal: string) => {
      logger.info(`📴 Received ${signal}. Starting graceful shutdown...`);
      
      server.close(async () => {
        logger.info('🔌 HTTP server closed');
        
        try {
          const { disconnectDatabase } = await import('@/config/database');
          await disconnectDatabase();
          logger.info('✅ Database disconnected');
        } catch (error) {
          logger.error('❌ Error during database disconnection:', error);
        }
        
        logger.info('👋 Graceful shutdown completed');
        process.exit(0);
      });
      
      // Force close after 10 seconds
      setTimeout(() => {
        logger.error('⏰ Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    // Handle shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('💥 Uncaught Exception:', error);
      process.exit(1);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
      process.exit(1);
    });

  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();
