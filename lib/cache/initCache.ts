import { initializeCache } from './redisCache'

// Safe dev-friendly cache initializer. Creates the singleton but does not force connection.
const devConfig = {
  redis: {
    url: process.env.REDIS_URL || 'redis://127.0.0.1:6379',
    password: process.env.REDIS_PASSWORD || undefined,
    tls: false,
  },
  ttl: {
    userProfile: 900, // 15min
    feedCandidates: 300, // 5min
    matchScore: 600, // 10min
    userEmbedding: 3600, // 1h
    safetyFlags: 60 // 1min
  }
}

try {
  initializeCache(devConfig)
  // do not call connect() here to avoid blocking startup when Redis is absent
} catch (err) {
  // Non-fatal in dev; log for visibility
  // eslint-disable-next-line no-console
  console.warn('initializeCache failed:', err)
}

export {}
