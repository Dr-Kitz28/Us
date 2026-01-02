import Redis from 'ioredis'

let client: Redis | null = null

function ensureEnv() {
  if (!process.env.REDIS_URL) {
    throw new Error('REDIS_URL is not set')
  }
}

export function getRedis(): Redis {
  if (client) return client
  ensureEnv()
  
  const rawUrl = process.env.REDIS_URL as string
  const masked = rawUrl.replace(/:\/\/.*@/, '://:*****@')
  
  // Redis Cloud URL may say rediss:// but server might not have TLS enabled
  // Check REDIS_TLS env to explicitly control TLS behavior
  // Default: if URL says rediss://, try TLS; but allow override via REDIS_TLS=false
  const urlSaysTls = rawUrl.toLowerCase().startsWith('rediss://')
  const tlsOverride = process.env.REDIS_TLS
  
  // Determine final TLS setting:
  // - REDIS_TLS=true -> force TLS
  // - REDIS_TLS=false -> force no TLS (useful when rediss:// URL but server has no TLS)
  // - REDIS_TLS not set -> follow URL scheme
  let useTls: boolean
  if (tlsOverride === 'true') {
    useTls = true
  } else if (tlsOverride === 'false') {
    useTls = false
  } else {
    useTls = urlSaysTls
  }
  
  console.info('ioredis: initializing', { url: masked, urlSaysTls, tlsOverride, useTls })
  
  // If URL says rediss:// but we don't want TLS, convert to redis://
  let connectionUrl = rawUrl
  if (urlSaysTls && !useTls) {
    connectionUrl = rawUrl.replace(/^rediss:\/\//i, 'redis://')
    console.info('ioredis: converted rediss:// to redis:// (TLS disabled)')
  }
  
  // Create client with explicit TLS config if needed
  const createClient = (url: string, tlsEnabled: boolean) => {
    if (tlsEnabled && !urlSaysTls) {
      return new Redis(url, { tls: {} })
    }
    if (tlsEnabled && urlSaysTls) {
      // url already contains rediss:// and TLS is desired
      return new Redis(url)
    }
    // No TLS
    return new Redis(url)
  }

  client = createClient(connectionUrl, useTls)

  // Automatic fallback: if initial connection fails with TLS packet errors,
  // retry once without TLS (useful when REDIS_URL is rediss:// but server speaks plain TCP).
  let attemptedFallback = false

  const handleError = async (err: Error & { code?: string }) => {
    console.error('Redis error', err)

    const msg = String(err?.message || '')
    const isTlsPacketError = (err && (err.code === 'ERR_SSL_PACKET_LENGTH_TOO_LONG' || msg.includes('packet length too long') || msg.includes('Client network socket disconnected before secure TLS connection')))

    if (!attemptedFallback && urlSaysTls && useTls && isTlsPacketError) {
      attemptedFallback = true
      console.warn('ioredis: TLS packet error detected, retrying without TLS (fallback)')
      try {
        // attempt graceful quit
        try {
          await client?.quit()
        } catch (_) {
          try { client?.disconnect() } catch (_) {}
        }
      } catch (e) {
        // ignore
      }

      // create fallback client without TLS
      const fallbackUrl = connectionUrl.replace(/^rediss:\/\//i, 'redis://')
      client = createClient(fallbackUrl, false)
      client.on('error', (e) => console.error('Redis fallback error', e))
      client.on('connect', () => console.info('ioredis: fallback client connected (no TLS)'))
    }
  }

  client.on('error', handleError)
  
  return client
}

export async function setJSON(key: string, value: unknown, ttlSeconds?: number) {
  const redis = getRedis()
  const s = JSON.stringify(value)
  if (ttlSeconds) {
    await redis.set(key, s, 'EX', ttlSeconds)
  } else {
    await redis.set(key, s)
  }
}

export async function getJSON<T = unknown>(key: string): Promise<T | null> {
  const redis = getRedis()
  const s = await redis.get(key)
  if (!s) return null
  try {
    return JSON.parse(s) as T
  } catch (e) {
    await redis.del(key)
    return null
  }
}

export async function incrWithTTL(key: string, ttlSeconds: number): Promise<number> {
  const redis = getRedis()
  const val = await redis.incr(key)
  if (val === 1) {
    await redis.expire(key, ttlSeconds)
  }
  return val
}

export type RateLimitResult = { allowed: boolean; remaining: number; resetSeconds: number }

export async function rateLimit(key: string, limit: number, windowSeconds: number): Promise<RateLimitResult> {
  const current = await incrWithTTL(key, windowSeconds)
  const allowed = current <= limit
  const remaining = Math.max(0, limit - current)
  const ttl = await getRedis().ttl(key)
  const resetSeconds = ttl >= 0 ? ttl : windowSeconds
  return { allowed, remaining, resetSeconds }
}

// Simple lock using SET NX with token; release verifies token
export async function acquireLock(key: string, ttlMs = 5000): Promise<string | null> {
  const token = cryptoRandomToken()
  const ok = await getRedis().set(key, token, 'PX', ttlMs, 'NX')
  if (ok) return token
  return null
}

export async function releaseLock(key: string, token: string): Promise<boolean> {
  // Lua script to release only if token matches
  const script = `
    if redis.call("get", KEYS[1]) == ARGV[1] then
      return redis.call("del", KEYS[1])
    else
      return 0
    end
  `
  const res = await getRedis().eval(script, 1, key, token)
  return res === 1
}

function cryptoRandomToken() {
  if (typeof crypto !== 'undefined' && (crypto as any).randomUUID) {
    // Node 16.9+ / stable
    // @ts-ignore
    return (crypto as any).randomUUID()
  }
  // fallback
  return Math.random().toString(36).slice(2)
}

export async function disconnectRedis() {
  if (!client) return
  try {
    await client.quit()
  } catch (e) {
    // ignore
  }
  client = null
}

export default {
  getRedis,
  setJSON,
  getJSON,
  incrWithTTL,
  rateLimit,
  acquireLock,
  releaseLock,
  disconnectRedis,
}
