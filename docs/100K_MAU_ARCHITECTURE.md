# 100k MAU Architecture - Performance & Scale Guide

## Target Metrics

| Metric | Target | Current | Strategy |
|--------|--------|---------|----------|
| Monthly Active Users | 100,000 | ~10 | Horizontal scale |
| API Response Time | <75ms p95 | ~200ms | Edge + cache |
| Database Queries | <20ms | ~50ms | Indexes + pool |
| Cache Hit Rate | >80% | 0% | Redis layer |
| Uptime | 99.9% | N/A | Multi-region |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           CDN (Cloudflare)                               │
│  - Static assets, images                                                 │
│  - Edge caching (TTL: 1 day)                                            │
│  - DDoS protection                                                       │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    Edge Runtime (Vercel Edge)                            │
│  - Next.js API routes                                                    │
│  - <75ms cold start                                                      │
│  - Auto-scaling                                                          │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
                    ▼               ▼               ▼
┌──────────────────────┐ ┌──────────────────┐ ┌──────────────────────────┐
│   Redis (Upstash)    │ │  PostgreSQL      │ │   Object Storage         │
│                      │ │  (Supabase)      │ │   (Cloudflare R2)        │
│  - Rate limiting     │ │                  │ │                          │
│  - Session cache     │ │  - User data     │ │  - User photos           │
│  - Feed cache        │ │  - Matches       │ │  - ML artifacts          │
│  - Distributed locks │ │  - Messages      │ │  - Backups               │
└──────────────────────┘ └──────────────────┘ └──────────────────────────┘
```

---

## 1. Database Layer (PostgreSQL)

### Connection Strategy

```typescript
// lib/db/index.ts - Already implemented
const queryClient = postgres(getDbUrl(), {
  max: 20,              // Max connections in pool
  idle_timeout: 20,     // Close idle after 20s
  prepare: false,       // Disable prepared statements (serverless)
  ssl: 'require',       // Always use SSL
})
```

### Critical Indexes (Defined in schema.ts)

| Table | Index | Purpose | Query Time |
|-------|-------|---------|------------|
| users | email | Auth lookup | <5ms |
| profiles | gender, age, location | Feed filtering | <10ms |
| likes | (from_id, to_id) | Swipe lookup | <5ms |
| likes | (to_id, from_id) | Mutual check | <5ms |
| matches | user1_id, user2_id | Match list | <10ms |
| messages | (match_id, created_at) | Chat pagination | <15ms |

### Query Optimization

```typescript
// ❌ Bad: N+1 queries
for (const user of users) {
  const profile = await db.select().from(profiles).where(eq(profiles.userId, user.id))
}

// ✅ Good: Single join query
const usersWithProfiles = await db
  .select()
  .from(users)
  .leftJoin(profiles, eq(users.id, profiles.userId))
```

---

## 2. Caching Layer (Redis)

### Cache Strategy

| Data Type | TTL | Invalidation | Hit Rate Target |
|-----------|-----|--------------|-----------------|
| Feed candidates | 5 min | On swipe | 85% |
| User profile | 1 min | On update | 90% |
| Match count | 30 sec | On match | 80% |
| Rate limits | Sliding | Auto | 100% |

### Implementation (Already in lib/cache/index.ts)

```typescript
// Check cache first
const cached = await getCachedFeedCandidates(userId)
if (cached) return cached  // <5ms

// Cache miss: query database
const candidates = await getFeedCandidates(userId)
await cacheFeedCandidates(userId, candidates)  // Background

return candidates
```

---

## 3. API Design for Scale

### Batch Operations (Critical for 100k MAU)

```typescript
// ❌ Bad: One request per swipe
POST /api/likes { targetId: "user1" }
POST /api/likes { targetId: "user2" }
// 20 swipes = 20 requests

// ✅ Good: Batch endpoint
POST /api/v2/recommendations/swipe
{
  "swipes": [
    { "targetId": "user1", "action": "like" },
    { "targetId": "user2", "action": "pass" },
    // ... up to 50
  ]
}
// 20 swipes = 1 request
```

### Deck Endpoint (20-50 candidates per call)

```typescript
GET /api/v2/recommendations?limit=50
// Returns 50 candidates in one request
// Reduces API calls by 50x
```

---

## 4. Edge Runtime

### Enable for All API Routes

```typescript
// app/api/v2/recommendations/route.ts
export const runtime = 'edge'
export const dynamic = 'force-dynamic'
```

### Benefits

| Metric | Serverless | Edge |
|--------|------------|------|
| Cold start | 500-2000ms | 50-100ms |
| Geographic latency | Variable | <50ms |
| Scaling | Manual | Auto |

---

## 5. Rate Limiting

### Limits (Implemented in lib/cache/index.ts)

| Action | Limit | Window | Strategy |
|--------|-------|--------|----------|
| Likes | 100 | 24 hours | Sliding window |
| API calls | 20 | 1 second | Token bucket |
| Auth attempts | 5 | 15 minutes | Fixed window |

### Response Headers

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1704067200
```

---

## 6. Monitoring & Observability

### Key Metrics to Track

```typescript
// Performance
metrics.histogram('api.response_time', elapsed, { route, status })
metrics.histogram('db.query_time', queryTime, { table, operation })
metrics.histogram('cache.hit_ratio', hitRate, { key_type })

// Business
metrics.counter('swipes.total', 1, { action: 'like' | 'pass' })
metrics.counter('matches.created', 1)
metrics.counter('messages.sent', 1)
```

### Alerts

| Metric | Warning | Critical |
|--------|---------|----------|
| p95 response time | >75ms | >150ms |
| Error rate | >1% | >5% |
| Cache hit ratio | <70% | <50% |
| DB connections | >15 | >18 |

---

## 7. Cost Optimization (< ₹5k/month)

### Free Tier Usage

| Service | Free Tier | Expected Usage |
|---------|-----------|----------------|
| Vercel | 100GB bandwidth | ~50GB |
| Supabase | 500MB DB, 1GB transfer | ~200MB |
| Upstash Redis | 10k commands/day | ~8k |
| Cloudflare R2 | 10GB storage | ~5GB |

### Cost Reduction Strategies

1. **Batch API calls**: Reduce request count by 50x
2. **Aggressive caching**: Reduce DB queries by 80%
3. **Image optimization**: Compress to WebP, <100KB each
4. **Connection pooling**: Reduce DB connection overhead

---

## 8. Scaling Roadmap

### Phase 1: 0-10k MAU (Current)
- Single region deployment
- Basic caching
- Supabase free tier

### Phase 2: 10k-50k MAU
- Multi-region edge deployment
- Redis cluster (Upstash Pro)
- Supabase Pro tier
- CDN for all assets

### Phase 3: 50k-100k MAU
- Database read replicas
- Dedicated connection pooler
- Pre-computed candidate sets
- Background job queue

### Phase 4: 100k+ MAU (ML-Centric)
- Consider Java/Kotlin backend (your spec)
- C++ ranking service via gRPC
- Python ML pipelines
- HNSW vector index for embeddings

---

## 9. ML Integration (Future)

### Pre-computed Tables (Already in schema.ts)

```typescript
// User embeddings for ML matching
export const userEmbeddings = pgTable('user_embeddings', {
  userId: text('user_id').notNull().unique(),
  vector: text('vector').notNull(),  // JSON array
  version: text('version').notNull(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

// Pre-computed candidate sets
export const candidateSets = pgTable('candidate_sets', {
  userId: text('user_id').notNull().unique(),
  candidatesJson: text('candidates_json').notNull(),
  version: text('version').notNull(),
})
```

### ML Pipeline Integration

```
1. Batch job (daily): Generate embeddings → Store in DB
2. Index build: Create HNSW index → Upload to R2
3. Serving: Load index → ANN query for candidates
4. Online: Lightweight rerank in API layer
```

---

## 10. Quick Wins Checklist

- [x] Migrate to Drizzle ORM (faster queries, no cold start issues)
- [x] Add Redis caching layer
- [x] Define database indexes
- [x] Implement batch swipe endpoint
- [x] Add rate limiting
- [ ] Enable Edge runtime on all routes
- [ ] Set up monitoring dashboard
- [ ] Configure CDN for images
- [ ] Add database read replica
- [ ] Implement connection pooling

---

## Files Created

| File | Purpose |
|------|---------|
| `lib/db/schema.ts` | Drizzle schema with indexes |
| `lib/db/index.ts` | Database connection + helpers |
| `lib/cache/index.ts` | Redis caching layer |
| `drizzle.config.ts` | Migration configuration |
| `app/api/v2/recommendations/route.ts` | Optimized API endpoint |
| `docs/PRISMA_TO_DRIZZLE_MIGRATION.md` | Migration guide |
| `docs/100K_MAU_ARCHITECTURE.md` | This document |

---

## Next Steps

1. **Clear disk space** and run `npm install`
2. **Run migrations**: `npx drizzle-kit push`
3. **Test new endpoint**: `/api/v2/recommendations`
4. **Monitor performance**: Check response times
5. **Gradually migrate** remaining Prisma routes
