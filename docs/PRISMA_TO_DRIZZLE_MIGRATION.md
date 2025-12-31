# Migration from Prisma to Drizzle ORM

## Why Drizzle?

| Feature | Prisma | Drizzle |
|---------|--------|---------|
| Code generation | Required | Not needed |
| Cold start | ~500ms | ~50ms |
| Query performance | Good | ~3x faster |
| Prepared statements | Yes (causes issues) | Optional |
| Serverless support | Via Data Proxy ($$$) | Native |
| Bundle size | Large | Small |
| TypeScript | Generated types | Native inference |

## Migration Steps

### 1. Install Dependencies

```bash
npm install drizzle-orm postgres @neondatabase/serverless @paralleldrive/cuid2
npm install -D drizzle-kit
```

### 2. New Files Created

- `lib/db/schema.ts` - Drizzle schema (equivalent to Prisma schema)
- `lib/db/index.ts` - Database connection with helpers
- `lib/cache/index.ts` - Redis cache layer
- `drizzle.config.ts` - Drizzle Kit configuration
- `app/api/v2/recommendations/route.ts` - Example migrated endpoint

### 3. Generate Migrations

```bash
# Generate SQL migration from schema
npx drizzle-kit generate

# Push schema directly (for development)
npx drizzle-kit push
```

### 4. Migrate API Routes

**Before (Prisma):**
```typescript
import { prisma } from '@/lib/prisma'

const user = await prisma.user.findUnique({
  where: { email },
  include: { profile: true }
})
```

**After (Drizzle):**
```typescript
import { db, users, profiles } from '@/lib/db'
import { eq } from 'drizzle-orm'

const [user] = await db
  .select()
  .from(users)
  .leftJoin(profiles, eq(users.id, profiles.userId))
  .where(eq(users.email, email))
  .limit(1)
```

### 5. Key Differences

#### Queries

| Operation | Prisma | Drizzle |
|-----------|--------|---------|
| Find one | `prisma.user.findUnique({ where: { id } })` | `db.select().from(users).where(eq(users.id, id)).limit(1)` |
| Find many | `prisma.user.findMany({ where: { ... } })` | `db.select().from(users).where(...)` |
| Create | `prisma.user.create({ data: { ... } })` | `db.insert(users).values({ ... }).returning()` |
| Update | `prisma.user.update({ where, data })` | `db.update(users).set({ ... }).where(...)` |
| Delete | `prisma.user.delete({ where })` | `db.delete(users).where(...)` |

#### Relations

```typescript
// Drizzle join
const userWithProfile = await db
  .select()
  .from(users)
  .leftJoin(profiles, eq(users.id, profiles.userId))
  .where(eq(users.id, userId))

// Access: userWithProfile.users, userWithProfile.profiles
```

### 6. Update package.json

```json
{
  "scripts": {
    "db:generate": "drizzle-kit generate",
    "db:push": "drizzle-kit push",
    "db:studio": "drizzle-kit studio",
    "db:migrate": "drizzle-kit migrate"
  }
}
```

### 7. Gradual Migration

You can run both Prisma and Drizzle during migration:

1. Keep Prisma for existing routes
2. Use Drizzle for new routes (e.g., `/api/v2/*`)
3. Migrate routes one by one
4. Remove Prisma when complete

### 8. Performance Tips

1. **Use Edge Runtime**: Add `export const runtime = 'edge'` to API routes
2. **Enable Caching**: Use the Redis cache layer for hot data
3. **Batch Operations**: Use batch inserts/updates
4. **Connection Pooling**: Automatic in `lib/db/index.ts`
5. **Indexes**: All critical indexes defined in schema

## Files to Delete After Full Migration

- `lib/prisma.ts`
- `prisma/schema.prisma`
- `prisma/migrations/`
- `.prisma/` directory

## Commands

```bash
# Remove Prisma after migration
npm uninstall @prisma/client prisma

# Update postinstall script in package.json
# Change from "prisma generate" to nothing or "drizzle-kit generate"
```
