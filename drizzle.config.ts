/**
 * Drizzle Kit Configuration
 * 
 * For migrations and schema management
 * Run: npx drizzle-kit generate
 * Run: npx drizzle-kit push
 */

import type { Config } from 'drizzle-kit'

export default {
  schema: './lib/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    // Prioritize POSTGRES_URL for Vercel, fallback to DATABASE_URL for local
    url: process.env.POSTGRES_URL || process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
} satisfies Config
