Drizzle + Vercel Postgres + Redis — Setup Guide

This project uses Drizzle ORM with PostgreSQL. For scalable, cost-effective production at ~100k MAU we recommend the stack:

- Drizzle ORM
- Vercel Postgres (dedicated plan) for primary DB + read replicas
- Redis (managed or Upstash) for caching, rate-limits, and feeds
- Background workers (e.g., BullMQ) for heavy writes and async tasks

Files of interest:

- `lib/db/index.ts` — auto-selects Neon HTTP driver for serverless or pooled `postgres.js` for servers.
- `lib/db/vercel.ts` — Vercel Postgres helper (dedicated instances).
- `drizzle/0000_wet_ultimates.supabase.sql` — cleaned migration SQL (if needed to import).

Environment variables

- `DATABASE_URL` or `VERCEL_POSTGRES_URL` - Postgres connection string.
- `REDIS_URL` - Redis connection string (e.g., `redis://:password@host:port`).
- `NODE_ENV` - `production` for production settings.

Vercel Postgres tips

- Use dedicated instance for sustained load; add read replicas for heavy read traffic.
- Configure connection pooling (psql pooler / pgBouncer) if you run many server instances.
- Use `lib/db/vercel.ts` when deploying to Vercel dedicated Postgres.

Redis tips

- Use Redis for hot feed caching, session storage, rate-limiting and locks.
- Managed providers: Upstash (serverless-friendly), AWS Elasticache, Redis Cloud.

Replication strategy

1. Primary DB handles writes.
2. Create read replicas for heavy read endpoints (recommendations, feeds, analytics).
3. Route read-only queries to replicas (use a read-replica connection URL or pool).
4. Use Redis to absorb most read traffic for user feeds.

Migration notes

- We keep `drizzle/0000_wet_ultimates.supabase.sql` as the canonical SQL for migration if you need to import manually.

Quick start (local)

1. Copy env vars into `.env.local`:

```
DATABASE_URL=postgres://user:pass@host:5432/dbname
REDIS_URL=redis://:password@redis-host:6379
NODE_ENV=development
```

2. Install deps and run dev server:

```bash
npm install
npm run dev
```

3. Use `lib/db/getDb()` in your app code — it will auto-select a serverless HTTP driver in Vercel serverless environments or pooled connections on traditional servers.

If you'd like, I can add a small `infra/` guide with concrete Vercel UI steps and example `vercel.json` routing. Reply with "Add infra guide" to continue.
