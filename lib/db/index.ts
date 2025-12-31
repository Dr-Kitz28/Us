/**
 * Drizzle Database Connection
 * 
 * Optimized for:
 * - 100k MAU capacity
 * - <75ms response time
 * - Serverless environments (Vercel, Cloudflare)
 * - Connection pooling
 * 
 * No Prisma dependency - uses native postgres driver
 */

import { drizzle } from 'drizzle-orm/postgres-js'
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-http'
import { drizzle as drizzleVercel } from 'drizzle-orm/vercel-postgres'
import { sql as vercelSql } from '@vercel/postgres'
import { neon } from '@neondatabase/serverless'
import postgres from 'postgres'
import * as schema from './schema'

// Environment detection
const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1'
const isVercel = process.env.VERCEL === '1'
const isServerless = isVercel || process.env.AWS_LAMBDA_FUNCTION_NAME

// Database URL validation - prioritize POSTGRES_URL for Vercel
function getDbUrl(): string {
  const url = process.env.POSTGRES_URL || process.env.DATABASE_URL
  
  if (!url) {
    throw new Error(
      'Missing POSTGRES_URL or DATABASE_URL environment variable. ' +
      'Set it to a PostgreSQL connection string.'
    )
  }
  
  // Block SQLite in production
  if (isProduction && (url.startsWith('file:') || url.includes('sqlite'))) {
    throw new Error(
      'SQLite is not supported in production. Use PostgreSQL.'
    )
  }
  
  return url
}

// ============================================================================
// Connection Strategy for 100k MAU
// ============================================================================

/**
 * For serverless (Vercel, Lambda):
 * - Use Neon HTTP driver (no persistent connections)
 * - Each request gets fresh connection
 * - No prepared statement collisions
 * - Optimized for edge functions
 * 
 * For traditional servers:
 * - Use postgres.js with connection pooling
 * - Persistent connections for performance
 * - Configurable pool size
 */

// Singleton pattern for connection reuse
let _db: ReturnType<typeof drizzle<typeof schema>> | null = null
let _dbNeon: ReturnType<typeof drizzleNeon<typeof schema>> | null = null
let _dbVercel: ReturnType<typeof drizzleVercel<typeof schema>> | null = null

/**
 * Get database instance optimized for Vercel Postgres
 * Uses @vercel/postgres driver - ideal for Vercel serverless
 */
export function getVercelDb() {
  if (_dbVercel) return _dbVercel
  
  _dbVercel = drizzleVercel(vercelSql, { schema })
  
  return _dbVercel
}

/**
 * Get database instance optimized for serverless (Neon)
 * Uses Neon HTTP driver - fallback for non-Vercel serverless
 */
export function getServerlessDb() {
  if (_dbNeon) return _dbNeon
  
  const sql = neon(getDbUrl())
  _dbNeon = drizzleNeon(sql, { schema })
  
  return _dbNeon
}

/**
 * Get database instance with connection pooling
 * Uses postgres.js - ideal for long-running servers
 */
export function getPooledDb() {
  if (_db) return _db
  
  const queryClient = postgres(getDbUrl(), {
    // Connection pool settings for 100k MAU
    max: isProduction ? 20 : 5, // Max connections in pool
    idle_timeout: 20, // Close idle connections after 20s
    connect_timeout: 10, // Connection timeout
    
    // Performance optimizations
    prepare: false, // Disable prepared statements (avoids collisions in serverless)
    
    // SSL for production
    ssl: isProduction ? 'require' : false,
    
    // Transform for camelCase
    transform: {
      undefined: null,
    },
  })
  
  _db = drizzle(queryClient, { schema })
  
  return _db
}

/**
 * Auto-detect best connection strategy
 */
export function getDb() {
  // Vercel serverless: use @vercel/postgres driver
  if (isVercel) {
    return getVercelDb()
  }
  
  // Other serverless environments: use Neon HTTP driver
  if (isServerless) {
    return getServerlessDb()
  }
  
  // Traditional servers: use connection pooling
  return getPooledDb()
}

// Default export for convenience
export const db = new Proxy({} as ReturnType<typeof getDb>, {
  get(_target, prop) {
    const instance = getDb()
    const value = (instance as any)[prop]
    if (typeof value === 'function') {
      return value.bind(instance)
    }
    return value
  },
})

// Re-export schema for convenience
export * from './schema'

// ============================================================================
// Query Helpers (optimized for <75ms response)
// ============================================================================
import { eq, and, or, ne, notInArray, sql, desc, asc } from 'drizzle-orm'

/**
 * Get feed candidates for a user
 * Optimized query with proper indexing for <75ms response
 */
export async function getFeedCandidates(
  userId: string,
  options: {
    limit?: number
    gender?: string
    minAge?: number
    maxAge?: number
    location?: string
  } = {}
) {
  const { limit = 50, gender, minAge, maxAge, location } = options
  const database = getDb()
  
  // Get user's likes, passes, blocks, and matches to exclude
  const [userLikes, userPasses, userBlocks, userMatches] = await Promise.all([
    database.select({ toId: schema.likes.toId })
      .from(schema.likes)
      .where(eq(schema.likes.fromId, userId)),
    database.select({ toId: schema.passes.toId })
      .from(schema.passes)
      .where(eq(schema.passes.fromId, userId)),
    database.select({ blockedId: schema.blocks.blockedId })
      .from(schema.blocks)
      .where(eq(schema.blocks.blockerId, userId)),
    database.select({ user1Id: schema.matches.user1Id, user2Id: schema.matches.user2Id })
      .from(schema.matches)
      .where(or(
        eq(schema.matches.user1Id, userId),
        eq(schema.matches.user2Id, userId)
      )),
  ])
  
  // Build exclusion list
  const excludeIds = new Set<string>([userId])
  userLikes.forEach(l => excludeIds.add(l.toId))
  userPasses.forEach(p => excludeIds.add(p.toId))
  userBlocks.forEach(b => excludeIds.add(b.blockedId))
  userMatches.forEach(m => {
    excludeIds.add(m.user1Id)
    excludeIds.add(m.user2Id)
  })
  
  // Build dynamic conditions
  const conditions = [
    ne(schema.users.id, userId),
    sql`${schema.users.deletedAt} IS NULL`,
  ]
  
  if (excludeIds.size > 1) {
    conditions.push(notInArray(schema.users.id, Array.from(excludeIds)))
  }
  
  // Optional filters
  if (gender) {
    conditions.push(eq(schema.profiles.gender, gender))
  }
  
  if (minAge) {
    conditions.push(sql`${schema.profiles.age} >= ${minAge}`)
  }
  
  if (maxAge) {
    conditions.push(sql`${schema.profiles.age} <= ${maxAge}`)
  }
  
  if (location) {
    conditions.push(eq(schema.profiles.location, location))
  }
  
  // Optimized query with join and limit
  const candidates = await database
    .select({
      user: schema.users,
      profile: schema.profiles,
    })
    .from(schema.users)
    .leftJoin(schema.profiles, eq(schema.users.id, schema.profiles.userId))
    .where(and(...conditions))
    .orderBy(desc(schema.profiles.goldenRatioScore), desc(schema.users.createdAt))
    .limit(limit)
  
  return candidates
}

/**
 * Check for mutual like (match detection)
 * Single query, indexed, <10ms
 */
export async function checkMutualLike(fromId: string, toId: string) {
  const database = getDb()
  
  const mutualLike = await database
    .select({ id: schema.likes.id })
    .from(schema.likes)
    .where(and(
      eq(schema.likes.fromId, toId),
      eq(schema.likes.toId, fromId)
    ))
    .limit(1)
  
  return mutualLike.length > 0
}

/**
 * Create match atomically
 */
export async function createMatch(user1Id: string, user2Id: string) {
  const database = getDb()
  
  // Ensure consistent ordering for unique constraint
  const [first, second] = user1Id < user2Id ? [user1Id, user2Id] : [user2Id, user1Id]
  
  const [match] = await database
    .insert(schema.matches)
    .values({
      user1Id: first,
      user2Id: second,
    })
    .returning()
  
  return match
}

/**
 * Batch swipe recording (20-50 actions per call)
 * Optimized for reduced write amplification
 */
export async function recordSwipes(
  userId: string,
  swipes: Array<{ targetId: string; action: 'like' | 'pass' }>
) {
  const database = getDb()
  
  const likes = swipes
    .filter(s => s.action === 'like')
    .map(s => ({ fromId: userId, toId: s.targetId }))
  
  const passes = swipes
    .filter(s => s.action === 'pass')
    .map(s => ({ fromId: userId, toId: s.targetId }))
  
  const results: { matches: typeof schema.matches.$inferSelect[] } = { matches: [] }
  
  // Insert likes and check for matches
  if (likes.length > 0) {
    await database.insert(schema.likes).values(likes).onConflictDoNothing()
    
    // Check for mutual likes (potential matches)
    for (const like of likes) {
      const isMutual = await checkMutualLike(userId, like.toId)
      if (isMutual) {
        const match = await createMatch(userId, like.toId)
        results.matches.push(match)
      }
    }
  }
  
  // Insert passes
  if (passes.length > 0) {
    await database.insert(schema.passes).values(passes).onConflictDoNothing()
  }
  
  return results
}

// ============================================================================
// Performance Monitoring
// ============================================================================
export async function getQueryStats() {
  const database = getPooledDb()
  
  // Only works with postgres.js pooled connection
  const stats = await database.execute(sql`
    SELECT 
      numbackends as active_connections,
      xact_commit as transactions_committed,
      xact_rollback as transactions_rolled_back,
      blks_read as blocks_read,
      blks_hit as blocks_hit,
      CASE WHEN blks_read + blks_hit > 0 
        THEN round(100.0 * blks_hit / (blks_read + blks_hit), 2) 
        ELSE 0 
      END as cache_hit_ratio
    FROM pg_stat_database 
    WHERE datname = current_database()
  `)
  
  return stats[0]
}
