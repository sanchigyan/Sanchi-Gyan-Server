import Redis from 'ioredis';
import logger from '../utils/logger';

let redisClient: Redis;

// Check if REDIS_URL exists (for cloud Redis)
if (process.env.REDIS_URL) {
  // Use the full URL for cloud Redis
  redisClient = new Redis(process.env.REDIS_URL, {
    retryStrategy: (times) => {
      if (times > 3) {
        logger.warn('⚠️  Redis connection failed after 3 retries');
        return null;
      }
      return Math.min(times * 50, 2000);
    },
    maxRetriesPerRequest: 3,
  });
} else {
  // Use host/port for local Redis
  redisClient = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    retryStrategy: (times) => {
      if (times > 3) {
        logger.warn('⚠️  Redis connection failed after 3 retries');
        return null;
      }
      return Math.min(times * 50, 2000);
    },
    maxRetriesPerRequest: 3,
  });
}

redisClient.on('connect', () => {
  logger.info('✅ Redis connected');
});

redisClient.on('error', (err) => {
  if (err.message !== 'ECONNREFUSED') {
    logger.error('❌ Redis error:', err.message);
  }
});

export default redisClient;