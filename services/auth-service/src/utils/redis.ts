import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://:secure_redis_pass_2026@localhost:6379';

export const redisClient = new Redis(redisUrl, {
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
});

redisClient.on('connect', () => {
  console.log('[Redis] Auth Service Connected to Redis successfully.');
});

redisClient.on('error', (err) => {
  console.error('[Redis Error] Auth Service Redis connection error:', err);
});

/**
 * Store refresh token with TTL
 */
export async function storeRefreshToken(userId: string, token: string, ttlSeconds: number = 604800): Promise<void> {
  const key = `auth:refresh:${userId}:${token}`;
  await redisClient.set(key, 'ACTIVE', 'EX', ttlSeconds);
}

/**
 * Check if refresh token exists and is valid
 */
export async function validateRefreshToken(userId: string, token: string): Promise<boolean> {
  const key = `auth:refresh:${userId}:${token}`;
  const status = await redisClient.get(key);
  return status === 'ACTIVE';
}

/**
 * Revoke and blacklist refresh token
 */
export async function invalidateRefreshToken(userId: string, token: string): Promise<void> {
  const key = `auth:refresh:${userId}:${token}`;
  await redisClient.del(key);
  
  // Also blacklist in case of access token premature revocation
  const blacklistKey = `auth:blacklist:${token}`;
  await redisClient.set(blacklistKey, 'REVOKED', 'EX', 604800);
}

/**
 * Check if a token is blacklisted
 */
export async function isTokenBlacklisted(token: string): Promise<boolean> {
  const blacklistKey = `auth:blacklist:${token}`;
  const result = await redisClient.get(blacklistKey);
  return result === 'REVOKED';
}
