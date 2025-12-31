import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

let _prismaInstance: PrismaClient | undefined

function createPrisma(): PrismaClient {
  if (_prismaInstance) return _prismaInstance

  const dbUrl = process.env.DATABASE_URL ?? ''
  const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1'

  if (isProduction) {
    if (!dbUrl) {
      throw new Error(
        'Missing DATABASE_URL in production. Set the DATABASE_URL (Postgres) in your Vercel/GitHub secrets.'
      )
    }
    // Defensive check: if DATABASE_URL points to SQLite in production, fail with a clear message
    if (dbUrl.startsWith('file:') || dbUrl.includes('mode=memory') || dbUrl.includes('memory')) {
      throw new Error(
        'Invalid DATABASE_URL for production: detected SQLite URL. Use a Postgres DATABASE_URL in production.'
      )
    }
  }

  // Support Prisma Data Proxy: if `PRISMA_DATA_PROXY_URL` is set use it as the
  // datasource override so the client connects via the Data Proxy endpoint.
  const dataProxyUrl = process.env.PRISMA_DATA_PROXY_URL
  const clientOptions: any = { log: ['error', 'warn'] }
  if (dataProxyUrl) {
    clientOptions.datasources = { db: { url: dataProxyUrl } }
    // helpful debug message in non-production
    if (!isProduction) console.log('Using Prisma Data Proxy via PRISMA_DATA_PROXY_URL')
  }

  const client = globalForPrisma.prisma ?? new PrismaClient(clientOptions)
  if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = client
  _prismaInstance = client
  return client
}

// Lazy proxy: delay creating PrismaClient until first property access/call
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop: string | symbol) {
    const real = createPrisma()
    // @ts-ignore - forward property access to real client
    const value = (real as any)[prop]
    if (typeof value === 'function') return value.bind(real)
    return value
  },
  // handle calling the proxy directly (unlikely for Prisma client)
  apply(_target, thisArg, args) {
    const real = createPrisma()
    // @ts-ignore
    return (real as any).apply(thisArg, args)
  },
}) as unknown as PrismaClient
