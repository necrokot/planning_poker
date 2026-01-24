import Redis from 'ioredis';
import { config } from './index';

export const redis = new Redis(config.redisUrl, {
  maxRetriesPerRequest: 3,
  lazyConnect: true,
});

redis.on('connect', () => {
  console.log('Connected to Redis');
});

redis.on('error', (err) => {
  console.error('Redis connection error:', err);
});

export async function connectRedis(): Promise<void> {
  await redis.connect();
}
