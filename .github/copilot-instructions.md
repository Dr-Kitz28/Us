# GitHub Copilot Instructions for Next-Gen Dating App

## Project Overview

This is a production-ready dating application built with Next.js 14, featuring research-backed matching algorithms (RSBM), comprehensive security, and India-first design principles.

## Project Setup Checklist

- [x] Verify that the copilot-instructions.md file in the .github directory is created.
- [x] Clarify Project Requirements - Next.js 14 + TypeScript dating app with Prisma, Tailwind, NextAuth
- [x] Scaffold the Project - Project structure established with App Router and API routes
- [x] Customize the Project - Implemented RSBM, Docker/K8s, Redis, security, safety, observability
- [x] Install Required Extensions - No additional extensions required
- [x] Compile the Project - Dependencies installed successfully
- [x] Create and Run Task - Dev task created for running server
- [x] Launch the Project - Development server running at http://localhost:3000
- [x] Ensure Documentation is Complete - README and copilot-instructions updated

## Code Conventions & Best Practices

### Architecture
- **Clean Architecture**: Separation of concerns (Presentation/Domain/Data layers)
- **API Routes**: Use Next.js App Router with route handlers in `/app/api`
- **Components**: React Server Components by default, use 'use client' only when needed
- **State Management**: Zustand for client state, React Query for server state

### TypeScript
- **Strict mode enabled**: No `any` types allowed
- **Type safety**: Define interfaces for all data structures
- **Zod validation**: Use Zod schemas for API input validation

### Security
- **Never log PII**: Use DataRedactor for logging user data
- **Encrypt sensitive fields**: Use FieldEncryption for phone, email, location
- **JWT tokens**: Access tokens expire in 15min, refresh tokens in 7 days
- **Rate limiting**: 100 requests/day for likes, 20 requests/second globally

### Database
- **Prisma ORM**: All database queries use Prisma client
- **Connection pooling**: Use `prisma.$transaction()` for atomic operations
- **Migrations**: Always create migrations: `npx prisma migrate dev`

### Caching
- **Redis for hot data**: Use DatingAppCache class for feed caching, rate limiting, locks
- **TTL strategy**: Feed cache = 15min, user profile = 5min, matches = 30min
- **Cache invalidation**: Clear caches on user updates

### Performance
- **India-first**: Optimize for 2G/3G networks, low-end Android devices
- **Code splitting**: Dynamic imports for heavy components
- **Image optimization**: Use Next.js Image component, WebP format, lazy loading
- **Bundle size**: Keep client bundle < 200KB gzipped

### Error Handling
- **Structured errors**: Use errorTracker.capture() with context
- **User-friendly messages**: Never expose internal errors to users
- **Correlation IDs**: Include requestId in all error responses

## Key Files & Directories

### Core Algorithm
- `/lib/rsbm/reciprocalMatcher.ts` - RSBM matching engine (700+ lines)

### Infrastructure
- `/docker-compose.yml` - 11 services (PostgreSQL, Redis, Kafka, etc.)
- `/k8s/` - Kubernetes manifests

### Security & Safety
- `/lib/security/cryptography.ts` - Encryption, hashing, JWT (500+ lines)
- `/lib/safety/trustAndSafety.ts` - Reporting, moderation (500+ lines)

### Caching & Observability
- `/lib/cache/redisCache.ts` - Redis with dating helpers (600+ lines)
- `/lib/observability/monitoring.ts` - Logging, tracing, metrics (500+ lines)

### UI Components
- `/components/dating/SwipeableCard.tsx` - Swipeable card (400+ lines)
- `/lib/design/tokens.ts` - Design system

## Feature Flags

All major features behind flags (see `lib/featureFlags.ts`):

- `FEATURE_RSBM_MATCHING` - RSBM matching algorithm
- `FEATURE_GOLDEN_RATIO` - Golden ratio matching
- `FEATURE_VOICE_PROMPTS` - Voice prompts (future)
- `FEATURE_VIDEO_PROFILES` - Video profiles (future)

## Common Tasks

### Adding a new API route

```typescript
// app/api/your-route/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { logger, metrics } from '@/lib/observability/monitoring';

export async function GET(req: NextRequest) {
  const startTime = Date.now();
  const requestId = crypto.randomUUID();
  
  try {
    logger.info('API request', { route: '/api/your-route', requestId });
    
    // Your logic here
    
    metrics.recordHistogram('api.response_time', Date.now() - startTime, {
      route: '/api/your-route',
      status: 'success'
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('API error', { error, requestId });
    metrics.incrementCounter('api.errors', { route: '/api/your-route' });
    
    return NextResponse.json(
      { error: 'Internal server error', requestId },
      { status: 500 }
    );
  }
}
```

### Running database migrations

```powershell
npx prisma migrate dev --name add_new_field
npx prisma migrate deploy  # production
```

### Using the cache

```typescript
import { datingAppCache } from '@/lib/cache/redisCache';

// Cache feed candidates
await datingAppCache.cacheFeedCandidates(userId, candidates, 900);

// Rate limit likes
const allowed = await datingAppCache.rateLimitLikes(userId);
if (!allowed) {
  return NextResponse.json({ error: 'Daily limit reached' }, { status: 429 });
}
```

## Debugging

### Viewing logs
```powershell
npm run dev                                    # local
docker-compose logs -f app                     # docker
kubectl logs -f deployment/dating-app -n dating-app  # k8s
```

### Tracing
- Every request has `requestId` in headers
- Use `traceId` to follow requests across services
- Jaeger UI at http://localhost:16686

### Metrics
- Prometheus at http://localhost:9090
- Grafana at http://localhost:3001

### Health checks
```powershell
curl http://localhost:3000/api/health
```

## Research References

Implementation backed by academic research:

- **Matching**: Gale-Shapley stable marriage, Thompson Sampling
- **Behavioral**: LSE dopamine reward studies
- **Profile Quality**: University of Amsterdam photo research
- **Choice Overload**: Pronk & Denissen studies
- **Messaging**: OKCupid data on response rates
- **Gamification**: Variable reward schedules (70% optimal)
- **Gen-Z**: Authenticity over perfection

## Getting Help

- **API Docs**: See individual route files
- **Algorithm**: `/docs/RESEARCH_IMPLEMENTATION_COMPLETE.md`
- **Mobile**: `/docs/MOBILE_STRATEGY.md`
- **Infrastructure**: `/k8s/` manifests
- **Security**: `/lib/security/cryptography.ts`
