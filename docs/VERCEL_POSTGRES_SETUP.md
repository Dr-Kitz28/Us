# Vercel Postgres Setup Guide

Step-by-step guide to migrate from Supabase to Vercel Postgres using Drizzle ORM.

## Prerequisites

- Vercel account
- GitHub repository connected to Vercel
- Existing Drizzle schema in `lib/db/schema.ts`

## Step 1: Create Vercel Postgres Database

### Via Vercel Dashboard

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Navigate to **Storage** → **Create Database**
3. Select **Postgres** (powered by Neon)
4. Choose a database name (e.g., `dating-app-db`)
5. Select region (choose closest to your users, e.g., `us-east-1` or `ap-south-1`)
6. Click **Create**

### Via Vercel CLI (Alternative)

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Create database
vercel postgres create dating-app-db
```

## Step 2: Get Connection String

1. In Vercel Dashboard → **Storage** → Select your database
2. Click **".env.local" tab** 
3. Copy the connection strings shown:

```bash
# Quickstart (recommended)
POSTGRES_URL="..."
POSTGRES_PRISMA_URL="..."
POSTGRES_URL_NON_POOLING="..."

# For Drizzle, you only need:
POSTGRES_URL="postgres://default:xxxxx@xxxx.pooler.aws-neon.tech/verceldb?sslmode=require"
```

## Step 3: Add Environment Variables to Vercel Project

### Via Dashboard

1. Go to your Vercel project → **Settings** → **Environment Variables**
2. Add the following:
   - Key: `POSTGRES_URL`
   - Value: [paste connection string from Step 2]
   - Environments: Select **Production**, **Preview**, **Development**
3. Click **Save**

### Via Vercel CLI (Alternative)

```bash
# Add environment variable
vercel env add POSTGRES_URL

# When prompted:
# - Value: [paste connection string]
# - Environments: Choose all (production, preview, development)
```

## Step 4: Update Local Environment

Create or update `.env.local`:

```bash
# .env.local
POSTGRES_URL="postgres://default:xxxxx@xxxx.pooler.aws-neon.tech/verceldb?sslmode=require"
```

**Important**: 
- Do NOT commit `.env.local` to Git (already in `.gitignore`)
- The code automatically falls back to `DATABASE_URL` if `POSTGRES_URL` is not set

## Step 5: Run Migrations

```bash
# Load environment variables
# (Vercel CLI automatically loads .env.local)

# Generate migration (if schema changed)
npm run drizzle:generate -- --name="initial-schema"

# Push schema to Vercel Postgres
npm run drizzle:push

# Or apply existing migrations
npm run drizzle:migrate
```

## Step 6: Verify Connection

```bash
# Start dev server
npm run dev

# Check health endpoint
curl http://localhost:3000/api/health

# Expected response:
{
  "status": "healthy",
  "database": "connected",
  "environment": "vercel"
}
```

## Step 7: Deploy to Vercel

```bash
# Commit changes
git add -A
git commit -m "feat: migrate to Vercel Postgres"
git push origin main

# Vercel will automatically deploy
# Or trigger manually:
vercel --prod
```

## Architecture Overview

### Connection Strategy

The app automatically detects the environment and uses the optimal driver:

```typescript
// Vercel serverless → @vercel/postgres
if (process.env.VERCEL === '1') {
  return getVercelDb() // Uses @vercel/postgres
}

// Other serverless (AWS Lambda) → Neon HTTP
if (process.env.AWS_LAMBDA_FUNCTION_NAME) {
  return getServerlessDb() // Uses neon-http
}

// Traditional server → postgres.js with pooling
return getPooledDb()
```

### Imports

```typescript
// lib/db/index.ts
import { sql } from '@vercel/postgres'
import { drizzle } from 'drizzle-orm/vercel-postgres'

export function getVercelDb() {
  return drizzle(sql, { schema })
}
```

### Environment Variables Priority

1. **POSTGRES_URL** (Vercel convention)
2. **DATABASE_URL** (fallback for local/other hosts)

```typescript
// drizzle.config.ts
dbCredentials: {
  url: process.env.POSTGRES_URL || process.env.DATABASE_URL!
}
```

## Migrating Data from Supabase

### Option 1: Export/Import via CSV

```bash
# From Supabase (using psql)
psql "postgresql://postgres.xxx:password@aws-0-ap-south-1.pooler.supabase.com:6543/postgres" \
  -c "\COPY users TO 'users.csv' CSV HEADER"

# To Vercel Postgres
psql "$POSTGRES_URL" \
  -c "\COPY users FROM 'users.csv' CSV HEADER"
```

### Option 2: pg_dump/pg_restore

```bash
# Dump from Supabase
pg_dump "postgresql://postgres.xxx:password@aws-0-ap-south-1.pooler.supabase.com:6543/postgres" \
  --no-owner --no-acl > supabase_dump.sql

# Restore to Vercel Postgres
psql "$POSTGRES_URL" < supabase_dump.sql
```

### Option 3: Drizzle Migration (Recommended for Schema Only)

```bash
# 1. Push current schema to Vercel Postgres
POSTGRES_URL="your-vercel-url" npm run drizzle:push

# 2. Seed data using API or script
npm run seed
```

## CI/CD Integration

GitHub Actions automatically uses Vercel Postgres when `POSTGRES_URL` is set:

```yaml
# .github/workflows/ci.yml
env:
  POSTGRES_URL: postgresql://localhost:5432/test_db
  
services:
  postgres:
    image: postgres:15-alpine
```

For integration tests, CI uses a local Postgres container. In production, Vercel uses the database configured in environment variables.

## Troubleshooting

### Build Error: "Missing POSTGRES_URL or DATABASE_URL"

**Solution**: Add `POSTGRES_URL` to Vercel project environment variables (Step 3)

### Connection Timeout

**Problem**: `Error: connect ETIMEDOUT`

**Solution**: 
1. Check database region matches Vercel function region
2. Verify connection string includes `?sslmode=require`
3. Check Neon database isn't paused (free tier auto-sleeps after 5min)

### Type Errors with `@vercel/postgres`

**Problem**: `Type 'VercelPgClient' is not assignable to...`

**Solution**: Ensure you're using `drizzle-orm/vercel-postgres` import:

```typescript
import { drizzle } from 'drizzle-orm/vercel-postgres' // ✅ Correct
import { drizzle } from 'drizzle-orm/postgres-js'     // ❌ Wrong
```

### Migration Not Applied

**Problem**: Schema changes not reflected in database

**Solution**:

```bash
# Verify migration files exist
ls drizzle/*.sql

# Push schema directly (bypass migrations)
npm run drizzle:push

# Or apply specific migration
npm run drizzle:migrate
```

### Local Development Uses Wrong Database

**Problem**: Local dev connects to Vercel Postgres instead of local Postgres

**Solution**: Update `.env.local` to prioritize local database:

```bash
# .env.local
DATABASE_URL="postgresql://postgres:password@localhost:5432/dating_app_dev"
# Don't set POSTGRES_URL for local dev
```

## Performance Tips

### 1. Connection Pooling

Vercel Postgres uses Neon's connection pooler by default (port 6543). For direct connections:

```bash
# Pooled (recommended for serverless)
POSTGRES_URL="postgres://user:pass@host.pooler.aws-neon.tech/db"

# Direct (for migration tools only)
POSTGRES_URL_NON_POOLING="postgres://user:pass@host.aws-neon.tech/db"
```

### 2. Query Optimization

```typescript
// ✅ Good: Use indexes
await db.select().from(users).where(eq(users.email, email))

// ❌ Bad: Full table scan
await db.select().from(users).where(sql`lower(name) = 'john'`)
```

### 3. Caching Strategy

Use Redis for hot data to reduce database load:

```typescript
// Check cache first
const cached = await redis.get(`user:${userId}`)
if (cached) return JSON.parse(cached)

// Then query database
const user = await db.query.users.findFirst({ where: eq(users.id, userId) })
await redis.setex(`user:${userId}`, 300, JSON.stringify(user))
```

## Cost Estimates

### Vercel Postgres (Neon) Pricing

- **Free Tier**: 
  - 3 projects
  - 0.5 GB storage
  - Shared compute (0.25 vCPU, 1 GB RAM)
  - Auto-sleeps after 5 minutes

- **Pro Tier** ($19/month):
  - Unlimited projects
  - 10 GB storage included
  - Dedicated compute (0.25 vCPU, 1 GB RAM)
  - No auto-sleep

- **Scale Tier** (usage-based):
  - Starting at $69/month
  - Up to 200 GB storage
  - Autoscaling compute (0.25-4 vCPU, 1-16 GB RAM)
  - Connection pooling

For 100k MAU dating app:
- **Storage**: ~20 GB (users, profiles, messages, photos metadata)
- **Compute**: Scale tier with 1 vCPU (handles ~500 QPS)
- **Estimated cost**: $100-150/month

## Next Steps

1. ✅ Created Vercel Postgres database
2. ✅ Added connection string to environment variables
3. ✅ Ran migrations
4. ✅ Deployed to Vercel
5. Monitor performance at: https://vercel.com/[your-username]/[project]/analytics
6. Set up Redis for caching (see `docs/REDIS_SETUP.md`)
7. Configure Vercel Edge Config for feature flags
8. Set up monitoring with Axiom or Datadog

## References

- [Vercel Postgres Docs](https://vercel.com/docs/storage/vercel-postgres)
- [Drizzle Vercel Postgres Guide](https://orm.drizzle.team/docs/get-started-postgresql#vercel-postgres)
- [Neon Documentation](https://neon.tech/docs/introduction)
- [Connection Pooling Best Practices](https://neon.tech/docs/connect/connection-pooling)
