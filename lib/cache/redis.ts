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
  // Mask credentials when logging
  const rawUrl = process.env.REDIS_URL as string
  const masked = rawUrl.replace(/:\/\/.*@/, '://:*****@')
  const tlsDetected = rawUrl.toLowerCase().startsWith('rediss://')
  console.info('ioredis: initializing', { url: masked, tls: tlsDetected })
  client = new Redis(rawUrl)
  client.on('error', (err) => {
    // keep minimal logging here; callers may attach more context
    // avoid throwing on errors so server can continue to operate
    // eslint-disable-next-line no-console
    console.error('Redis error', err)
  })
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
