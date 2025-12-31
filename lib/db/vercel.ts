import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

/**
 * Vercel Postgres connection helper
 * - Uses postgres.js with connection pooling
 * - Designed for dedicated Vercel Postgres instances
 * - Configure `VERCEL_POSTGRES_URL` in Vercel secrets/env
 */

const url = process.env.VERCEL_POSTGRES_URL || process.env.DATABASE_URL
if (!url) {
  throw new Error('Missing VERCEL_POSTGRES_URL or DATABASE_URL environment variable')
}

const isProd = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1'

const sql = postgres(url, {
  max: isProd ? 50 : 5, // tuned for dedicated instances + replicas
  prepare: true, // enable prepared statements for long-running pooled servers
  ssl: isProd ? 'require' : false,
  idle_timeout: 30,
})

export const vercelDb = drizzle(sql, { schema })

export default vercelDb
