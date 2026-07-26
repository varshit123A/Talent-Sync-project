import Redis from 'ioredis';

const REDIS_HOST = process.env.REDIS_HOST || 'redis';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379', 10);

export const redis = new Redis({
  host: REDIS_HOST,
  port: REDIS_PORT,
  maxRetriesPerRequest: 3,
});

redis.on('connect', () => {
  console.log('[job-service] Connected to Redis successfully');
});

redis.on('error', (err) => {
  console.error('[job-service] Redis Connection Error:', err.message);
});