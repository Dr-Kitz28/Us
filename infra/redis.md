Redis setup guide

We recommend Redis for caching user feeds, rate-limiting, locks and pub/sub.

Options
- Upstash: serverless, pay-as-you-go, great for Vercel serverless workloads.
- Redis Cloud / Elasticache: managed, better for heavy sustained traffic and durability.

Env
- `REDIS_URL` - connection string. For Upstash this is `rediss://:token@global-us1.upstash.io:6379`.

Usage patterns
- Hot feed cache: cache per-user candidate lists with TTL (e.g., 5-15 minutes).
- Rate limiting: store counters with TTL per user/actions.
- Locks: use Redis SETNX or Redlock for distributed locks when creating matches.

Example (ioredis):

```ts
import IORedis from 'ioredis'

const redis = new IORedis(process.env.REDIS_URL)

// Set with TTL
await redis.set(`feed:${userId}`, JSON.stringify(candidates), 'EX', 900)

// Rate limit example
const limitKey = `likes:${userId}:${date}`
const current = await redis.incr(limitKey)
if (current === 1) await redis.expire(limitKey, 86400)
```

Scaling notes
- For 100k MAU, use a managed Redis with clustering or Redis Cloud.
- Use key eviction policies and reasonable TTLs to keep memory in check.

Project helper
- We provide a small typed wrapper at `lib/cache/redis.ts` that exposes:
	- `getRedis()` — lazy Redis client
	- `setJSON()` / `getJSON()` — JSON helpers with optional TTL
	- `rateLimit()` / `incrWithTTL()` — simple rate-limiting helpers
	- `acquireLock()` / `releaseLock()` — basic distributed lock

Usage example (server-side API route):

```ts
import { getJSON, setJSON, rateLimit } from '../../lib/cache/redis'

// cache feed
await setJSON(`feed:${userId}`, candidates, 900)

// rate limit
const { allowed } = await rateLimit(`likes:${userId}:${date}`, 100, 86400)
if (!allowed) return new Response('Rate limit', { status: 429 })
```
