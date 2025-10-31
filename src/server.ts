import 'dotenv/config';
import app from './app';
import logger from './utils/logger';
import prisma from './config/database';
import redisClient from './config/redis';
import cron from 'node-cron';
import { SubscriptionsService } from './modules/subscriptions/subscriptions.service';
import { LiveClassService } from './modules/live-classes/live-classes.service';

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // Test database connection
    await prisma.$connect();
    logger.info('✅ Database connected');

    // Test Redis connection
    await redisClient.ping();
    logger.info('✅ Redis connected');

    // Start server
    app.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.info(`📝 Environment: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle shutdown
process.on('SIGINT', async () => {
  logger.info('Shutting down gracefully...');
  await prisma.$disconnect();
  await redisClient.quit();
  process.exit(0);
});

const service = new SubscriptionsService();
const liveClassService = new LiveClassService();

// Daily at midnight
cron.schedule('0 0 * * *', async () => {
  await service.handleTrialExpirations();
  await service.handleTrialNotifications();
});

// Live class status update - Every 5 minutes
cron.schedule('*/5 * * * *', async () => {
  logger.info('Updating live class statuses...');
  await liveClassService.updateLiveClassStatuses();
});

// Live class reminders - Every 15 minutes
cron.schedule('*/15 * * * *', async () => {
  logger.info('Sending live class reminders...');
  await liveClassService.sendReminders();
});

startServer();