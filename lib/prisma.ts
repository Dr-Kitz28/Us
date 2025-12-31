import { User, Profile, Like, Match, Message, Photo } from './prisma-types'

// Minimal Prisma-compatible shim backed by Drizzle queries.
// Implements only the methods used across the codebase: findUnique, findMany,
// create, createMany, updateMany, deleteMany, findFirst, count, upsert.

function single<T>(arr: T[]) {
  return arr.length > 0 ? (arr[0] as T) : null
}

export const prisma = {
  user: {
    async findUnique(opts: any) {
      const { db: database } = await import('./db')
      const schema = await import('./db/schema')
      const { eq } = await import('drizzle-orm')
      const where = opts?.where || {}
      if (where.email) {
        const res = await database.select().from(schema.users).where(eq(schema.users.email, where.email)).limit(1)
        return single(res) as unknown as User | null
      }
      if (where.id) {
        const res = await database.select().from(schema.users).where(eq(schema.users.id, where.id)).limit(1)
        return single(res) as unknown as User | null
      }
      return null
    },

    async findMany(opts: any = {}) {
      const { db: database } = await import('./db')
      const schema = await import('./db/schema')
      const { eq, ne, sql } = await import('drizzle-orm')
      const where = opts?.where || {}
      const take = opts?.take || opts?.limit || undefined

      // build base query
      let q = database.select({ user: schema.users }).from(schema.users)

      // basic where: email: { in: [] } or email: { not: val }
      if (where.email) {
        if (typeof where.email === 'object') {
          if (where.email.in) {
            q = database.select().from(schema.users).where(sql`${schema.users.email} IN (${where.email.in.map((_: any) => sql`${_}`)})`)
          } else if (where.email.not) {
            q = q.where(ne(schema.users.email, where.email.not))
          }
        } else {
          q = q.where(eq(schema.users.email, where.email))
        }
      }

      if (take) q = q.limit(take)

      // include handling: profile, photos
      const include = opts?.include || {}
      if (include.profile) {
        // left join with profiles
        const usersWithProfiles = await database
          .select({ user: schema.users, profile: schema.profiles })
          .from(schema.users)
          .leftJoin(schema.profiles, eq(schema.users.id, schema.profiles.userId))
          .limit(take || 100)

        // attach photos if requested
        if (include.photos) {
          const userIds = usersWithProfiles.map((u: any) => u.user.id)
          const photos = await database.select().from(schema.photos).where(sql`${schema.photos.userId} IN (${userIds.map((_: any) => sql`${_}`)})`)
          const byUser: Record<string, any[]> = {}
          photos.forEach((p: any) => {
            byUser[p.userId] = byUser[p.userId] || []
            byUser[p.userId].push(p)
          })
          return usersWithProfiles.map((r: any) => ({ ...r.user, profile: r.profile, photos: byUser[r.user.id] || [] }))
        }

        return usersWithProfiles.map((r: any) => ({ ...r.user, profile: r.profile }))
      }

      const res = await (q as any)
      return res as unknown as User[]
    },

    async create(opts: any) {
      const { db: database } = await import('./db')
      const schema = await import('./db/schema')
      const data = opts?.data || {}
      const [row] = await database.insert(schema.users).values(data).returning()
      return row as unknown as User
    },

    async update(opts: any) {
      const { db: database } = await import('./db')
      const schema = await import('./db/schema')
      const where = opts.where || {}
      const data = opts.data || {}
      if (where.id) {
        const { eq } = await import('drizzle-orm')
        const [row] = await database.update(schema.users).set(data).where(eq(schema.users.id, where.id)).returning()
        return row as unknown as User
      }
      throw new Error('Unsupported update where clause')
    },

    async findFirst(opts: any) {
      const { db: database } = await import('./db')
      const schema = await import('./db/schema')
      const { eq } = await import('drizzle-orm')
      const where = opts?.where || {}
      let q = database.select().from(schema.users)
      if (where.email) q = q.where(eq(schema.users.email, where.email))
      if (where.id) q = q.where(eq(schema.users.id, where.id))
      const res = await q.limit(1)
      return single(res) as unknown as User | null
    },
  },

  like: {
    async create(opts: any) {
      const { db: database } = await import('./db')
      const schema = await import('./db/schema')
      const data = opts?.data || {}
      await database.insert(schema.likes).values(data).onConflictDoNothing()
      return null
    },

    async findFirst(opts: any) {
      const { db: database } = await import('./db')
      const schema = await import('./db/schema')
      const { eq } = await import('drizzle-orm')
      const where = opts?.where || {}
      let q = database.select().from(schema.likes)
      if (where.fromId) q = q.where(eq(schema.likes.fromId, where.fromId))
      if (where.toId) q = q.where(eq(schema.likes.toId, where.toId))
      const res = await q.limit(1)
      return single(res) as unknown as Like | null
    },

    async findMany(opts: any) {
      const { db: database } = await import('./db')
      const schema = await import('./db/schema')
      const { eq } = await import('drizzle-orm')
      const where = opts?.where || {}
      let q = database.select().from(schema.likes)
      if (where.fromId) q = q.where(eq(schema.likes.fromId, where.fromId))
      if (where.toId) q = q.where(eq(schema.likes.toId, where.toId))
      if (opts.take) q = q.limit(opts.take)
      const res = await q
      return res as unknown as Like[]
    },

    async count(opts: any) {
      const { db: database } = await import('./db')
      const schema = await import('./db/schema')
      const { eq, sql } = await import('drizzle-orm')
      const where = opts?.where || {}
      let q = database.select({ count: sql`count(*)::int` }).from(schema.likes)
      if (where.fromId) q = q.where(eq(schema.likes.fromId, where.fromId))
      if (where.toId) q = q.where(eq(schema.likes.toId, where.toId))
      const res = await q
      return (res[0]?.count ?? 0) as number
    }
  },

  match: {
    async create(opts: any) {
      const { db: database } = await import('./db')
      const schema = await import('./db/schema')
      const data = opts?.data || {}
      const [row] = await database.insert(schema.matches).values(data).returning()
      return row as unknown as Match
    },

    async findMany(opts: any) {
      const { db: database } = await import('./db')
      const schema = await import('./db/schema')
      const { eq } = await import('drizzle-orm')
      const where = opts?.where || {}
      let q = database.select().from(schema.matches)
      if (where.user1Id) q = q.where(eq(schema.matches.user1Id, where.user1Id))
      if (where.user2Id) q = q.where(eq(schema.matches.user2Id, where.user2Id))
      const res = await q
      return res as unknown as Match[]
    },

    async findUnique(opts: any) {
      const { db: database } = await import('./db')
      const schema = await import('./db/schema')
      const { eq } = await import('drizzle-orm')
      const where = opts?.where || {}
      if (where.id) {
        const res = await database.select().from(schema.matches).where(eq(schema.matches.id, where.id)).limit(1)
        return single(res) as unknown as Match | null
      }
      return null
    }
  },

  message: {
    async create(opts: any) {
      const { db: database } = await import('./db')
      const schema = await import('./db/schema')
      const data = opts?.data || {}
      const [row] = await database.insert(schema.messages).values(data).returning()
      return row as unknown as Message
    },

    async updateMany(opts: any) {
      const { db: database } = await import('./db')
      const schema = await import('./db/schema')
      const { eq } = await import('drizzle-orm')
      const where = opts?.where || {}
      const data = opts?.data || {}
      let q = database.update(schema.messages).set(data)
      if (where.matchId) q = q.where(eq(schema.messages.matchId, where.matchId))
      await q
      return null
    }
  },

  photo: {
    async createMany(opts: any) {
      const { db: database } = await import('./db')
      const schema = await import('./db/schema')
      const data = opts?.data || []
      await database.insert(schema.photos).values(data).onConflictDoNothing()
      return null
    }
  },

  // generic helper to disconnect (compat with prisma.$disconnect)
  async $disconnect() {
    // noop for Drizzle
    return
  }
}

export default prisma

