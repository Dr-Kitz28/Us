/**
 * Redis Cache Layer for 100k MAU
 * 
 * Caching strategy for <75ms response times:
 * - Feed candidates: 5 min TTL
 * - User profiles: 1 min TTL (hot data)
 * - Match counts: 30 sec TTL
 * - Rate limiting: sliding window
 */

import { Redis } from 'ioredis'

// Environment
const isProduction = process.env.NODE_ENV === 'production'
const redisUrl = process.env.REDIS_URL || process.env.UPSTASH_REDIS_REST_URL

// Cache TTLs (in seconds)
export const CACHE_TTL = {
  FEED_CANDIDATES: 300,      // 5 minutes
  USER_PROFILE: 60,          // 1 minute
  MATCH_COUNT: 30,           // 30 seconds
  LIKE_COUNT: 30,            // 30 seconds
  RATE_LIMIT_WINDOW: 86400,  // 24 hours
  SESSION: 604800,           // 7 days
} as const

// Singleton Redis instance
let _redis: Redis | null = null

function getRedis(): Redis | null {
  if (!redisUrl) {
    if (isProduction) {
      console.warn('⚠️ Redis not configured. Caching disabled.')
    }
    return null
  }

  if (_redis) return _redis

  _redis = new Redis(redisUrl, {
    maxRetriesPerRequest: 3,
    retryDelayOnFailover: 100,
    enableReadyCheck: true,
    lazyConnect: true,
  })

  _redis.on('error', (err) => {
    console.error('Redis error:', err.message)
  })

  return _redis
}

// ============================================================================
// Cache Operations
// ============================================================================

/**
 * Get cached value
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  const redis = getRedis()
  if (!redis) return null

  try {
    const value = await redis.get(key)
    return value ? JSON.parse(value) : null
  } catch (err) {
    console.error('Cache get error:', err)
    return null
  }
}

/**
 * Set cached value with TTL
 */
export async function cacheSet<T>(
  key: string,
  value: T,
  ttlSeconds: number = CACHE_TTL.USER_PROFILE
): Promise<void> {
  const redis = getRedis()
  if (!redis) return

  try {
    await redis.setex(key, ttlSeconds, JSON.stringify(value))
  } catch (err) {
    console.error('Cache set error:', err)
  }
}

/**
 * Delete cached value
 */
export async function cacheDelete(key: string): Promise<void> {
  const redis = getRedis()
  if (!redis) return

  try {
    await redis.del(key)
  } catch (err) {
    console.error('Cache delete error:', err)
  }
}

/**
 * Delete multiple cached values by pattern
 */
export async function cacheDeletePattern(pattern: string): Promise<void> {
  const redis = getRedis()
  if (!redis) return

  try {
    const keys = await redis.keys(pattern)
    if (keys.length > 0) {
      await redis.del(...keys)
    }
  } catch (err) {
    console.error('Cache delete pattern error:', err)
  }
}

// ============================================================================
// Dating App Cache Helpers
// ============================================================================

/**
 * Cache feed candidates for a user
 */
export async function cacheFeedCandidates(
  userId: string,
  candidates: any[]
): Promise<void> {
  await cacheSet(`feed:${userId}`, candidates, CACHE_TTL.FEED_CANDIDATES)
}

/**
 * Get cached feed candidates
 */
export async function getCachedFeedCandidates(userId: string): Promise<any[] | null> {
  return cacheGet<any[]>(`feed:${userId}`)
}

/**
 * Invalidate feed cache when user swipes
 */
export async function invalidateFeedCache(userId: string): Promise<void> {
  await cacheDelete(`feed:${userId}`)
}

/**
 * Cache user profile
 */
export async function cacheUserProfile(
  userId: string,
  profile: any
): Promise<void> {
  await cacheSet(`profile:${userId}`, profile, CACHE_TTL.USER_PROFILE)
}

/**
 * Get cached user profile
 */
export async function getCachedUserProfile(userId: string): Promise<any | null> {
  return cacheGet<any>(`profile:${userId}`)
}

/**
 * Invalidate user profile cache
 */
export async function invalidateUserProfile(userId: string): Promise<void> {
  await cacheDelete(`profile:${userId}`)
}

// ============================================================================
// Rate Limiting
// ============================================================================

/**
 * Rate limit key formats
 */
export const RATE_LIMIT_KEYS = {
  LIKES: (userId: string) => `ratelimit:likes:${userId}`,
  API: (ip: string) => `ratelimit:api:${ip}`,
  AUTH: (ip: string) => `ratelimit:auth:${ip}`,
} as const

/**
 * Check and increment rate limit
 * Returns { allowed: boolean, remaining: number, resetAt: Date }
 */
export async function checkRateLimit(
  key: string,
  maxRequests: number,
  windowSeconds: number = CACHE_TTL.RATE_LIMIT_WINDOW
): Promise<{
  allowed: boolean
  current: number
  limit: number
  remaining: number
  resetAt: Date
}> {
  const redis = getRedis()
  
  // If no Redis, allow (but log warning in production)
  if (!redis) {
    return {
      allowed: true,
      current: 0,
      limit: maxRequests,
      remaining: maxRequests,
      resetAt: new Date(Date.now() + windowSeconds * 1000),
    }
  }

  try {
    const multi = redis.multi()
    multi.incr(key)
    multi.ttl(key)
    const results = await multi.exec()

    const current = (results?.[0]?.[1] as number) || 0
    const ttl = (results?.[1]?.[1] as number) || -1

    // Set TTL on first request
    if (ttl === -1) {
      await redis.expire(key, windowSeconds)
    }

    const resetAt = new Date(Date.now() + (ttl > 0 ? ttl : windowSeconds) * 1000)
    const allowed = current <= maxRequests
    const remaining = Math.max(0, maxRequests - current)

    return { allowed, current, limit: maxRequests, remaining, resetAt }
  } catch (err) {
    console.error('Rate limit check error:', err)
    // Fail open on error
    return {
      allowed: true,
      current: 0,
      limit: maxRequests,
      remaining: maxRequests,
      resetAt: new Date(Date.now() + windowSeconds * 1000),
    }
  }
}

/**
 * Check like rate limit (100 likes per day)
 */
export async function checkLikeRateLimit(userId: string): Promise<{
  allowed: boolean
  remaining: number
}> {
  const result = await checkRateLimit(
    RATE_LIMIT_KEYS.LIKES(userId),
    100, // 100 likes per day
    86400 // 24 hours
  )
  return { allowed: result.allowed, remaining: result.remaining }
}

/**
 * Check API rate limit (20 requests per second)
 */
export async function checkApiRateLimit(ip: string): Promise<{
  allowed: boolean
  remaining: number
}> {
  const result = await checkRateLimit(
    RATE_LIMIT_KEYS.API(ip),
    20, // 20 requests per second
    1 // 1 second window
  )
  return { allowed: result.allowed, remaining: result.remaining }
}

// ============================================================================
// Distributed Locks (for match creation)
// ============================================================================

/**
 * Acquire a distributed lock
 */
export async function acquireLock(
  lockKey: string,
  ttlMs: number = 5000
): Promise<boolean> {
  const redis = getRedis()
  if (!redis) return true // Proceed without lock if no Redis

  try {
    const result = await redis.set(
      `lock:${lockKey}`,
      '1',
      'PX',
      ttlMs,
      'NX'
    )
    return result === 'OK'
  } catch (err) {
    console.error('Acquire lock error:', err)
    return true // Fail open
  }
}

/**
 * Release a distributed lock
 */
export async function releaseLock(lockKey: string): Promise<void> {
  const redis = getRedis()
  if (!redis) return

  try {
    await redis.del(`lock:${lockKey}`)
  } catch (err) {
    console.error('Release lock error:', err)
  }
}

/**
 * Execute with lock (prevent race conditions)
 */
export async function withLock<T>(
  lockKey: string,
  fn: () => Promise<T>,
  options: { ttlMs?: number; retries?: number; retryDelayMs?: number } = {}
): Promise<T | null> {
  const { ttlMs = 5000, retries = 3, retryDelayMs = 100 } = options

  for (let i = 0; i < retries; i++) {
    const acquired = await acquireLock(lockKey, ttlMs)
    if (acquired) {
      try {
        return await fn()
      } finally {
        await releaseLock(lockKey)
      }
    }
    // Wait before retry
    await new Promise(resolve => setTimeout(resolve, retryDelayMs))
  }

  console.warn(`Failed to acquire lock: ${lockKey} after ${retries} retries`)
  return null
}

// ============================================================================
// Match Lock Helper
// ============================================================================

/**
 * Create match with distributed lock to prevent duplicates
 */
export async function createMatchWithLock(
  user1Id: string,
  user2Id: string,
  createFn: () => Promise<any>
): Promise<any | null> {
  // Consistent lock key regardless of order
  const [first, second] = user1Id < user2Id ? [user1Id, user2Id] : [user2Id, user1Id]
  const lockKey = `match:${first}:${second}`

  return withLock(lockKey, createFn)
}

// Export Redis instance for advanced use
export { getRedis }
