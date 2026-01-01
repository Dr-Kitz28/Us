/**
 * Redis Caching Layer for Dating App
 * 
 * Implements multi-tier caching strategy:
 * - L1: In-memory (Node process)
 * - L2: Redis (distributed)
 * - L3: Database
 */

import { createClient, RedisClientType } from 'redis'

export interface CacheConfig {
  redis: {
    url: string
    password?: string
    tls?: boolean
  }
  ttl: {
    userProfile: number // 15 minutes
    feedCandidates: number // 5 minutes
    matchScore: number // 10 minutes
    userEmbedding: number // 1 hour
    safetyFlags: number // 1 minute (low TTL for safety)
  }
}

export class RedisCache {
  protected client: RedisClientType
  protected isConnected: boolean = false

  constructor(protected config: CacheConfig) {
    // Auto-detect TLS from the URL (rediss://) unless explicitly configured
    const urlScheme = (config.redis.url || '').toLowerCase()
    const urlSaysTls = urlScheme.startsWith('rediss://')
    
    // Honor REDIS_TLS env to override TLS behavior (useful when rediss:// but server has no TLS)
    const tlsOverride = process.env.REDIS_TLS
    let useTls: boolean
    if (tlsOverride === 'true') {
      useTls = true
    } else if (tlsOverride === 'false') {
      useTls = false
    } else if (config.redis.tls !== undefined) {
      useTls = config.redis.tls
    } else {
      useTls = urlSaysTls
    }

    // Convert rediss:// to redis:// if TLS is disabled
    let connectionUrl = config.redis.url
    if (urlSaysTls && !useTls) {
      connectionUrl = config.redis.url.replace(/^rediss:\/\//i, 'redis://')
      console.info('Redis: converted rediss:// to redis:// (TLS disabled via REDIS_TLS=false)')
    }

    console.info('Redis: initializing', { 
      url: connectionUrl ? connectionUrl.replace(/:\/\/.*@/, '://:*****@') : undefined, 
      urlSaysTls,
      tlsOverride,
      useTls 
    })

    this.client = createClient({
      url: connectionUrl,
      password: config.redis.password,
      socket: {
        tls: useTls,
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            console.error('Redis: Max retries reached')
            return new Error('Max retries reached')
          }
          return Math.min(retries * 100, 3000)
        }
      }
    })

    this.client.on('error', (err) => console.error('Redis Error:', err))
    this.client.on('connect', () => {
      console.log('Redis: Connected')
      this.isConnected = true
    })
    this.client.on('disconnect', () => {
      console.log('Redis: Disconnected')
      this.isConnected = false
    })
  }

  async connect(): Promise<void> {
    if (!this.isConnected) {
      await this.client.connect()
    }
  }

  async disconnect(): Promise<void> {
    if (this.isConnected) {
      await this.client.quit()
    }
  }

  /**
   * Get cached value with type safety
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.isConnected) await this.connect()
    
    try {
      const value = await this.client.get(key)
      if (!value) return null
      return JSON.parse(value) as T
    } catch (error) {
      console.error('Redis GET error:', error)
      return null
    }
  }

  /**
   * Set cache value with TTL
   */
  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    if (!this.isConnected) await this.connect()
    
    try {
      const serialized = JSON.stringify(value)
      if (ttlSeconds) {
        await this.client.setEx(key, ttlSeconds, serialized)
      } else {
        await this.client.set(key, serialized)
      }
    } catch (error) {
      console.error('Redis SET error:', error)
      // Don't throw - cache failures should not break app
    }
  }

  /**
   * Delete cache entry
   */
  async del(key: string): Promise<void> {
    if (!this.isConnected) await this.connect()
    
    try {
      await this.client.del(key)
    } catch (error) {
      console.error('Redis DEL error:', error)
    }
  }

  /**
   * Delete multiple keys matching pattern
   */
  async delPattern(pattern: string): Promise<void> {
    if (!this.isConnected) await this.connect()
    
    try {
      const keys = await this.client.keys(pattern)
      if (keys.length > 0) {
        await this.client.del(keys)
      }
    } catch (error) {
      console.error('Redis DEL pattern error:', error)
    }
  }

  /**
   * Increment counter (for rate limiting)
   */
  async incr(key: string, ttlSeconds?: number): Promise<number> {
    if (!this.isConnected) await this.connect()
    
    try {
      const value = await this.client.incr(key)
      if (ttlSeconds && value === 1) {
        // Only set TTL on first increment
        await this.client.expire(key, ttlSeconds)
      }
      return value
    } catch (error) {
      console.error('Redis INCR error:', error)
      return 0
    }
  }

  /**
   * Set with NX (only if not exists) - for distributed locks
   */
  async setNX(key: string, value: string, ttlSeconds: number): Promise<boolean> {
    if (!this.isConnected) await this.connect()
    
    try {
      const result = await this.client.set(key, value, {
        NX: true,
        EX: ttlSeconds
      })
      return result === 'OK'
    } catch (error) {
      console.error('Redis SETNX error:', error)
      return false
    }
  }

  /**
   * Add to sorted set (for feed rankings)
   */
  async zadd(key: string, score: number, member: string): Promise<void> {
    if (!this.isConnected) await this.connect()
    
    try {
      await this.client.zAdd(key, { score, value: member })
    } catch (error) {
      console.error('Redis ZADD error:', error)
    }
  }

  /**
   * Get top N from sorted set
   */
  async zrevrange(key: string, start: number, stop: number): Promise<string[]> {
    if (!this.isConnected) await this.connect()
    
    try {
      return await this.client.zRange(key, start, stop, { REV: true })
    } catch (error) {
      console.error('Redis ZREVRANGE error:', error)
      return []
    }
  }

  /**
   * Set hash field
   */
  async hset(key: string, field: string, value: string): Promise<void> {
    if (!this.isConnected) await this.connect()
    
    try {
      await this.client.hSet(key, field, value)
    } catch (error) {
      console.error('Redis HSET error:', error)
    }
  }

  /**
   * Get hash field
   */
  async hget(key: string, field: string): Promise<string | undefined> {
    if (!this.isConnected) await this.connect()
    
    try {
      return await this.client.hGet(key, field)
    } catch (error) {
      console.error('Redis HGET error:', error)
      return undefined
    }
  }

  /**
   * Get all hash fields
   */
  async hgetall(key: string): Promise<Record<string, string>> {
    if (!this.isConnected) await this.connect()
    
    try {
      return await this.client.hGetAll(key)
    } catch (error) {
      console.error('Redis HGETALL error:', error)
      return {}
    }
  }
}

/**
 * Application-specific cache helpers
 */
export class DatingAppCache extends RedisCache {
  /**
   * Cache user profile
   */
  async cacheUserProfile(userId: string, profile: any): Promise<void> {
    const key = `profile:${userId}`
    await this.set(key, profile, this.config.ttl.userProfile)
  }

  async getUserProfile(userId: string): Promise<any | null> {
    const key = `profile:${userId}`
    return await this.get(key)
  }

  async invalidateUserProfile(userId: string): Promise<void> {
    const key = `profile:${userId}`
    await this.del(key)
  }

  /**
   * Cache feed candidates (ranked list)
   */
  async cacheFeedCandidates(
    userId: string,
    candidates: Array<{ id: string; score: number }>
  ): Promise<void> {
    const key = `feed:${userId}`
    await this.del(key) // Clear existing
    
    for (const candidate of candidates) {
      await this.zadd(key, candidate.score, candidate.id)
    }
    
    await this.client.expire(key, this.config.ttl.feedCandidates)
  }

  async getFeedCandidates(userId: string, limit: number = 20): Promise<string[]> {
    const key = `feed:${userId}`
    return await this.zrevrange(key, 0, limit - 1)
  }

  /**
   * Cache match scores
   */
  async cacheMatchScore(
    userId: string,
    candidateId: string,
    score: number
  ): Promise<void> {
    const key = `score:${userId}:${candidateId}`
    await this.set(key, score, this.config.ttl.matchScore)
  }

  async getMatchScore(
    userId: string,
    candidateId: string
  ): Promise<number | null> {
    const key = `score:${userId}:${candidateId}`
    return await this.get<number>(key)
  }

  /**
   * Cache user embedding vector
   */
  async cacheUserEmbedding(userId: string, embedding: number[]): Promise<void> {
    const key = `embedding:${userId}`
    await this.set(key, embedding, this.config.ttl.userEmbedding)
  }

  async getUserEmbedding(userId: string): Promise<number[] | null> {
    const key = `embedding:${userId}`
    return await this.get<number[]>(key)
  }

  /**
   * Rate limiting
   */
  async checkRateLimit(
    key: string,
    limit: number,
    windowSeconds: number
  ): Promise<{ allowed: boolean; remaining: number }> {
    const count = await this.incr(key, windowSeconds)
    return {
      allowed: count <= limit,
      remaining: Math.max(0, limit - count)
    }
  }

  async rateLimitLikes(userId: string, dailyLimit: number = 100): Promise<boolean> {
    const date = new Date().toISOString().split('T')[0]
    const key = `ratelimit:likes:${userId}:${date}`
    const result = await this.checkRateLimit(key, dailyLimit, 86400) // 24h
    return result.allowed
  }

  async rateLimitMessages(
    userId: string,
    dailyLimit: number = 500
  ): Promise<boolean> {
    const date = new Date().toISOString().split('T')[0]
    const key = `ratelimit:messages:${userId}:${date}`
    const result = await this.checkRateLimit(key, dailyLimit, 86400)
    return result.allowed
  }

  async rateLimitOTP(phone: string, hourlyLimit: number = 3): Promise<boolean> {
    const hour = Math.floor(Date.now() / 3600000)
    const key = `ratelimit:otp:${phone}:${hour}`
    const result = await this.checkRateLimit(key, hourlyLimit, 3600)
    return result.allowed
  }

  /**
   * Distributed lock
   */
  async acquireLock(
    lockKey: string,
    ttlSeconds: number = 10
  ): Promise<string | null> {
    const lockValue = Math.random().toString(36)
    const acquired = await this.setNX(
      `lock:${lockKey}`,
      lockValue,
      ttlSeconds
    )
    return acquired ? lockValue : null
  }

  async releaseLock(lockKey: string, lockValue: string): Promise<void> {
    // Lua script to ensure only lock owner can release
    const script = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end
    `
    try {
      await this.client.eval(script, {
        keys: [`lock:${lockKey}`],
        arguments: [lockValue]
      })
    } catch (error) {
      console.error('Lock release error:', error)
    }
  }

  /**
   * Session management
   */
  async cacheSession(sessionId: string, data: any, ttlSeconds: number = 3600): Promise<void> {
    const key = `session:${sessionId}`
    await this.set(key, data, ttlSeconds)
  }

  async getSession(sessionId: string): Promise<any | null> {
    const key = `session:${sessionId}`
    return await this.get(key)
  }

  async deleteSession(sessionId: string): Promise<void> {
    const key = `session:${sessionId}`
    await this.del(key)
  }

  /**
   * Safety flags cache
   */
  async cacheSafetyFlags(userId: string, flags: any): Promise<void> {
    const key = `safety:${userId}`
    await this.set(key, flags, this.config.ttl.safetyFlags)
  }

  async getSafetyFlags(userId: string): Promise<any | null> {
    const key = `safety:${userId}`
    return await this.get(key)
  }

  /**
   * Online users tracking
   */
  async markUserOnline(userId: string, ttlSeconds: number = 300): Promise<void> {
    const key = `online:${userId}`
    await this.set(key, Date.now(), ttlSeconds)
  }

  async isUserOnline(userId: string): Promise<boolean> {
    const key = `online:${userId}`
    const timestamp = await this.get<number>(key)
    if (!timestamp) return false
    
    // Consider online if seen in last 5 minutes
    return Date.now() - timestamp < 300000
  }

  /**
   * Event pub/sub (for real-time features)
   */
  async publishEvent(channel: string, event: any): Promise<void> {
    if (!this.isConnected) await this.connect()
    
    try {
      await this.client.publish(channel, JSON.stringify(event))
    } catch (error) {
      console.error('Redis PUBLISH error:', error)
    }
  }
}

// Singleton instance
let cacheInstance: DatingAppCache | null = null

export function initializeCache(config: CacheConfig): DatingAppCache {
  if (!cacheInstance) {
    cacheInstance = new DatingAppCache(config)
  }
  return cacheInstance
}

export function getCache(): DatingAppCache {
  if (!cacheInstance) {
    // Lazy initialize in dev: create a safe dev config pointing to localhost
    const devConfig: CacheConfig = {
      redis: {
        url: process.env.REDIS_URL || 'redis://127.0.0.1:6379',
        password: process.env.REDIS_PASSWORD || undefined,
        tls: false,
      },
      ttl: {
        userProfile: 900,
        feedCandidates: 300,
        matchScore: 600,
        userEmbedding: 3600,
        safetyFlags: 60,
      },
    }

    try {
      // Initialize singleton but do not force connect; errors are non-fatal
      initializeCache(devConfig)
      // eslint-disable-next-line no-console
      console.info('Cache: lazy-initialized dev cache')
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('Cache lazy-init failed:', err)
    }
  }

  if (!cacheInstance) {
    throw new Error('Cache not initialized. Call initializeCache() first.')
  }

  return cacheInstance
}
