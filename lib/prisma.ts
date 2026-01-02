import { User, Profile, Like, Match, Message, Photo } from './prisma-types'

// Minimal Prisma-compatible shim backed by Drizzle queries.
// Implements only the methods used across the codebase: findUnique, findMany,
// create, createMany, updateMany, deleteMany, findFirst, count, upsert.

function single<T>(arr: T[]) {
  return arr.length > 0 ? (arr[0] as T) : null
}

export const prisma = {
  user: {
    async count(opts?: any) {
      const { db: database } = await import('./db')
      const schema = await import('./db/schema')
      const { sql, eq } = await import('drizzle-orm')
      const where = opts?.where || {}
      const dbAny = database as any
      let q = dbAny.select({ count: sql`count(*)::int` }).from(schema.users)

      if (where.createdAt) {
        if (where.createdAt.gte) q = q.where(sql`${schema.users.createdAt} >= ${where.createdAt.gte}`)
        if (where.createdAt.lte) q = q.where(sql`${schema.users.createdAt} <= ${where.createdAt.lte}`)
      }

      if (where.id) q = q.where(eq(schema.users.id, where.id))

      const res = await q
      return (res[0]?.count ?? 0) as number
    },
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
      const dbAny = database as any
      const where = opts?.where || {}
      const take = opts?.take || opts?.limit || undefined

      // build base query
      let q: any = dbAny.select({ user: schema.users }).from(schema.users)

      // basic where: email: { in: [] } or email: { not: val }
      if (where.email) {
        if (typeof where.email === 'object') {
          if (where.email.in) {
            q = dbAny.select().from(schema.users).where(sql`${schema.users.email} IN (${where.email.in.map((_: any) => sql`${_}`)})`)
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

    async delete(opts: any) {
      const { db: database } = await import('./db')
      const schema = await import('./db/schema')
      const where = opts?.where || {}
      const { eq } = await import('drizzle-orm')
      if (where.id) {
        const dbAny = database as any
        await (dbAny.delete(schema.users).where(eq(schema.users.id, where.id)))
        return null
      }
      throw new Error('Unsupported delete where clause')
    },

    async create(opts: any) {
      const { db: database } = await import('./db')
      const schema = await import('./db/schema')
      const data = opts?.data || {}
      
      // Extract user-level fields only (exclude nested relations like profile)
      const { profile, photos, ...userData } = data
      
      const [row] = await database.insert(schema.users).values(userData).returning()
      
      // Handle nested profile creation (Prisma-style: profile: { create: {...} })
      if (profile?.create && row?.id) {
        const profileData = {
          userId: row.id,
          bio: profile.create.bio ?? null,
          interests: profile.create.interests ?? null,
          gender: profile.create.gender ?? null,
          location: profile.create.location ?? null,
          age: profile.create.age ?? null,
        }
        await database.insert(schema.profiles).values(profileData).onConflictDoNothing()
      }
      
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

    async deleteMany(opts?: any) {
      const { db: database } = await import('./db')
      const schema = await import('./db/schema')
      const { eq } = await import('drizzle-orm')
      const where = opts?.where || {}

      const dbAny = database as any
      let q: any = dbAny.delete(schema.users)
      if (where.id) q = q.where(eq(schema.users.id, where.id))
      if (where.email) q = q.where(eq(schema.users.email, where.email))
      await q
      return null
    },

    async findFirst(opts?: any) {
      const { db: database } = await import('./db')
      const schema = await import('./db/schema')
      const { eq } = await import('drizzle-orm')
      const where = opts?.where || {}
      const dbAny = database as any
      let q: any = dbAny.select().from(schema.users)
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
      const dbAny = database as any
      let q: any = dbAny.select().from(schema.likes)
      if (where.fromId) q = q.where(eq(schema.likes.fromId, where.fromId))
      if (where.toId) q = q.where(eq(schema.likes.toId, where.toId))
      const res = await q.limit(1)
      return single(res) as unknown as Like | null
    },

    async findMany(opts?: any) {
      const { db: database } = await import('./db')
      const schema = await import('./db/schema')
      const { eq } = await import('drizzle-orm')
      const where = opts?.where || {}
      const dbAny = database as any
      let q: any = dbAny.select().from(schema.likes)
      if (where.fromId) q = q.where(eq(schema.likes.fromId, where.fromId))
      if (where.toId) q = q.where(eq(schema.likes.toId, where.toId))
      if (opts.take) q = q.limit(opts.take)
      const res = await q
      return res as unknown as Like[]
    },

    async count(opts?: any) {
      const { db: database } = await import('./db')
      const schema = await import('./db/schema')
      const { eq, sql } = await import('drizzle-orm')
      const where = opts?.where || {}
      const dbAny = database as any
      let q = dbAny.select({ count: sql`count(*)::int` }).from(schema.likes)
      if (where.fromId) q = q.where(eq(schema.likes.fromId, where.fromId))
      if (where.toId) q = q.where(eq(schema.likes.toId, where.toId))
      const res = await q
      return (res[0]?.count ?? 0) as number
    }
    ,
    async deleteMany(opts?: any) {
      const { db: database } = await import('./db')
      const schema = await import('./db/schema')
      const { eq } = await import('drizzle-orm')
      const where = opts?.where || {}

      const dbAny = database as any
      let q: any = dbAny.delete(schema.likes)
      if (where.fromId) q = q.where(eq(schema.likes.fromId, where.fromId))
      if (where.toId) q = q.where(eq(schema.likes.toId, where.toId))
      await q
      return null
    }
    ,
    async upsert(opts: any) {
      const { db: database } = await import('./db')
      const schema = await import('./db/schema')
      const { eq, and } = await import('drizzle-orm')
      const where = opts?.where || {}
      const create = opts?.create || {}
      const update = opts?.update || {}

      // support composite unique where: fromId_toId
      if (where.fromId_toId) {
        const { fromId, toId } = where.fromId_toId
        const existing = await database.select().from(schema.likes).where(and(eq(schema.likes.fromId, fromId), eq(schema.likes.toId, toId))).limit(1)
        if (existing.length > 0) {
          if (Object.keys(update).length > 0) {
            await database.update(schema.likes).set(update).where(eq(schema.likes.id, existing[0].id))
          }
          return existing[0]
        }
        const [row] = await database.insert(schema.likes).values(create).returning()
        return row
      }

      // fallback: create
      const [row] = await database.insert(schema.likes).values(create).returning()
      return row
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

    async findMany(opts?: any) {
      const { db: database } = await import('./db')
      const schema = await import('./db/schema')
      const { eq } = await import('drizzle-orm')
      const where = opts?.where || {}
      const dbAny = database as any
      let q: any = dbAny.select().from(schema.matches)
      if (where.user1Id) q = q.where(eq(schema.matches.user1Id, where.user1Id))
      if (where.user2Id) q = q.where(eq(schema.matches.user2Id, where.user2Id))
      const res = await q
      return res as unknown as Match[]
    },

    async findFirst(opts?: any) {
      const { db: database } = await import('./db')
      const schema = await import('./db/schema')
      const { eq, sql } = await import('drizzle-orm')
      const where = opts?.where || {}
      const dbAny = database as any
      let q: any = dbAny.select().from(schema.matches)

      if (where.id) q = q.where(eq(schema.matches.id, where.id))
      if (where.user1Id) q = q.where(eq(schema.matches.user1Id, where.user1Id))
      if (where.user2Id) q = q.where(eq(schema.matches.user2Id, where.user2Id))

      if (where.OR && Array.isArray(where.OR)) {
        const clauses = where.OR.map((cl: any) => sql`( ${schema.matches.user1Id} = ${cl.user1Id} AND ${schema.matches.user2Id} = ${cl.user2Id} )`)
        q = database.select().from(schema.matches).where(sql`${sql.join(clauses, sql` OR `)}`)
      }

      const res = await q.limit(1)
      return single(res) as unknown as Match | null
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
    },

    async count(opts?: any) {
      const { db: database } = await import('./db')
      const schema = await import('./db/schema')
      const { sql, eq } = await import('drizzle-orm')
      const where = opts?.where || {}
      const dbAny = database as any
      let q = dbAny.select({ count: sql`count(*)::int` }).from(schema.matches)

      if (where.createdAt) {
        if (where.createdAt.gte) q = q.where(sql`${schema.matches.createdAt} >= ${where.createdAt.gte}`)
        if (where.createdAt.lte) q = q.where(sql`${schema.matches.createdAt} <= ${where.createdAt.lte}`)
      }

      if (where.user1Id) q = q.where(eq(schema.matches.user1Id, where.user1Id))
      if (where.user2Id) q = q.where(eq(schema.matches.user2Id, where.user2Id))

      const res = await q
      return (res[0]?.count ?? 0) as number
    },

    async groupBy(opts: any) {
      const { db: database } = await import('./db')
      const schema = await import('./db/schema')
      const { sql } = await import('drizzle-orm')
      const by = opts?.by || []
      const take = opts?.take || 5

      // support only grouping by user1Id for analytics use-cases
      if (by.length === 1 && by[0] === 'user1Id') {
        const rows = await database
          .select({ user1Id: schema.matches.user1Id, _count: sql`count(*)::int` })
          .from(schema.matches)
          .groupBy(schema.matches.user1Id)
          .orderBy(sql`_count DESC`)
          .limit(take)

        return rows.map((r: any) => ({ user1Id: r.user1Id, _count: r._count }))
      }

      return []
    },
        async deleteMany(opts?: any) {
          const { db: database } = await import('./db')
          const schema = await import('./db/schema')
          const { eq } = await import('drizzle-orm')
          const where = opts?.where || {}

          const dbAny = database as any
          let q: any = dbAny.delete(schema.matches)
          if (where.user1Id) q = q.where(eq(schema.matches.user1Id, where.user1Id))
          if (where.user2Id) q = q.where(eq(schema.matches.user2Id, where.user2Id))
          await q
          return null
        },
  },

  message: {
    async create(opts: any) {
      const { db: database } = await import('./db')
      const schema = await import('./db/schema')
      const data = opts?.data || {}
      const [row] = await database.insert(schema.messages).values(data).returning()
      return row as unknown as Message
    },

    async createMany(opts: any) {
      const { db: database } = await import('./db')
      const schema = await import('./db/schema')
      const data = opts?.data || []
      const dbAny = database as any
      await dbAny.insert(schema.messages).values(data).onConflictDoNothing()
      return null
    },

    async count(opts?: any) {
      const { db: database } = await import('./db')
      const schema = await import('./db/schema')
      const { sql } = await import('drizzle-orm')
      const where = opts?.where || {}
      const dbAny = database as any
      let q = dbAny.select({ count: sql`count(*)::int` }).from(schema.messages)

      if (where.createdAt) {
        if (where.createdAt.gte) q = q.where(sql`${schema.messages.createdAt} >= ${where.createdAt.gte}`)
        if (where.createdAt.lte) q = q.where(sql`${schema.messages.createdAt} <= ${where.createdAt.lte}`)
      }

      const res = await q
      return (res[0]?.count ?? 0) as number
    },

    async updateMany(opts: any) {
      const { db: database } = await import('./db')
      const schema = await import('./db/schema')
      const { eq } = await import('drizzle-orm')
      const where = opts?.where || {}
      const data = opts?.data || {}
      const dbAny = database as any
      let q: any = dbAny.update(schema.messages).set(data)
      if (where.matchId) q = q.where(eq(schema.messages.matchId, where.matchId))
      await q
      return null
    }
    ,
    async deleteMany(opts?: any) {
      const { db: database } = await import('./db')
      const schema = await import('./db/schema')
      const { eq } = await import('drizzle-orm')
      const where = opts?.where || {}

      const dbAny = database as any
      let q: any = dbAny.delete(schema.messages)
      if (where.matchId) q = q.where(eq(schema.messages.matchId, where.matchId))
      if (where.senderId) q = q.where(eq(schema.messages.senderId, where.senderId))
      await q
      return null
    }
  },

  photo: {
    async create(opts: any) {
      const { db: database } = await import('./db')
      const schema = await import('./db/schema')
      const data = opts?.data || {}
      const [row] = await database.insert(schema.photos).values(data).returning()
      return row as unknown as Photo
    },
    async count(opts?: any) {
      const { db: database } = await import('./db')
      const schema = await import('./db/schema')
      const { sql, eq } = await import('drizzle-orm')
      const where = opts?.where || {}
      const dbAny = database as any
      let q = dbAny.select({ count: sql`count(*)::int` }).from(schema.photos)

      if (where.userId) q = q.where(eq(schema.photos.userId, where.userId))
      const res = await q
      return (res[0]?.count ?? 0) as number
    },
    async createMany(opts: any) {
      const { db: database } = await import('./db')
      const schema = await import('./db/schema')
      const data = opts?.data || []
      await database.insert(schema.photos).values(data).onConflictDoNothing()
      return null
    }
    ,
    async deleteMany(opts?: any) {
      const { db: database } = await import('./db')
      const schema = await import('./db/schema')
      const { eq } = await import('drizzle-orm')
      const where = opts?.where || {}

      const dbAny = database as any
      let q: any = dbAny.delete(schema.photos)
      if (where.userId) q = q.where(eq(schema.photos.userId, where.userId))
      if (where.id) q = q.where(eq(schema.photos.id, where.id))
      await q
      return null
    }
    ,
    async findFirst(opts: any) {
      const { db: database } = await import('./db')
      const schema = await import('./db/schema')
      const { eq } = await import('drizzle-orm')
      const where = opts?.where || {}
      const dbAny = database as any
      let q: any = dbAny.select().from(schema.photos)
      if (where.url) q = q.where(eq(schema.photos.url, where.url))
      if (where.id) q = q.where(eq(schema.photos.id, where.id))
      const res = await q.limit(1)
      return single(res) as unknown as Photo | null
    },

    async update(opts: any) {
      const { db: database } = await import('./db')
      const schema = await import('./db/schema')
      const where = opts?.where || {}
      const data = opts?.data || {}
      const { eq } = await import('drizzle-orm')
      if (where.id) {
        const [row] = await database.update(schema.photos).set(data).where(eq(schema.photos.id, where.id)).returning()
        return row as unknown as Photo
      }
      throw new Error('Unsupported photo update where clause')
    },

    async findMany(opts: any = {}) {
      const { db: database } = await import('./db')
      const schema = await import('./db/schema')
      const { eq, sql } = await import('drizzle-orm')
      const where = opts?.where || {}
      const dbAny = database as any
      let q: any = dbAny.select().from(schema.photos)
      if (where.url && typeof where.url === 'string') q = q.where(eq(schema.photos.url, where.url))
      if (where.url && where.url.in) q = q.where(sql`${schema.photos.url} IN (${where.url.in.map((_: any) => sql`${_}`)})`)
      if (opts.take) q = q.limit(opts.take)
      const res = await q
      return res as unknown as Photo[]
    }
  },

  pass: {
    async count(opts?: any) {
      const { db: database } = await import('./db')
      const schema = await import('./db/schema')
      const { sql, eq } = await import('drizzle-orm')
      const where = opts?.where || {}
      const dbAny = database as any
      let q = dbAny.select({ count: sql`count(*)::int` }).from(schema.passes)

      if (where.fromId) q = q.where(eq(schema.passes.fromId, where.fromId))
      if (where.toId) q = q.where(eq(schema.passes.toId, where.toId))
      const res = await q
      return (res[0]?.count ?? 0) as number
    },
    async deleteMany(opts?: any) {
      const { db: database } = await import('./db')
      const schema = await import('./db/schema')
      const { eq } = await import('drizzle-orm')
      const where = opts?.where || {}

      const dbAny = database as any
      let q: any = dbAny.delete(schema.passes)
      if (where.fromId) q = q.where(eq(schema.passes.fromId, where.fromId))
      if (where.toId) q = q.where(eq(schema.passes.toId, where.toId))
      await q
      return null
    }
  },

  profile: {
    async count(opts?: any) {
      const { db: database } = await import('./db')
      const schema = await import('./db/schema')
      const { sql, eq } = await import('drizzle-orm')
      const where = opts?.where || {}
      const dbAny = database as any
      let q = dbAny.select({ count: sql`count(*)::int` }).from(schema.profiles)

      if (where.userId) q = q.where(eq(schema.profiles.userId, where.userId))
      const res = await q
      return (res[0]?.count ?? 0) as number
    },
    async deleteMany(opts?: any) {
      const { db: database } = await import('./db')
      const schema = await import('./db/schema')
      const { eq } = await import('drizzle-orm')
      const where = opts?.where || {}

      const dbAny = database as any
      let q: any = dbAny.delete(schema.profiles)
      if (where.userId) q = q.where(eq(schema.profiles.userId, where.userId))
      await q
      return null
    }
  },

  report: {
    async findMany(opts?: any) {
      const { db: database } = await import('./db')
      const schema = await import('./db/schema')
      const { eq, sql } = await import('drizzle-orm')
      const where = opts?.where || {}
      const take = opts?.take || opts?.limit || 50

      const dbAny = database as any
      let q: any = dbAny.select().from(schema.reports)
      if (where.status) q = q.where(eq(schema.reports.status, where.status))
      if (where.priority) q = q.where(eq(schema.reports.priority, where.priority))

      const rows = await q.limit(take)

      // batch load reporter and reported users
      const userIds = Array.from(new Set(rows.flatMap((r: any) => [r.reporterId, r.reportedId].filter(Boolean))))
      let users: any[] = []
      if (userIds.length > 0) {
        users = await database.select().from(schema.users).where(sql`${schema.users.id} IN (${userIds.map((_: any) => sql`${_}`)})`)
      }
      const byId: Record<string, any> = {}
      users.forEach(u => (byId[u.id] = u))

      return rows.map((r: any) => ({
        ...r,
        reporter: byId[r.reporterId] || null,
        reported: byId[r.reportedId] || null,
      }))
    },

    async deleteMany(opts?: any) {
      const { db: database } = await import('./db')
      const schema = await import('./db/schema')
      const { eq } = await import('drizzle-orm')
      const where = opts?.where || {}

      const dbAny = database as any
      let q: any = dbAny.delete(schema.reports)
      if (where.reporterId) q = q.where(eq(schema.reports.reporterId, where.reporterId))
      if (where.reportedId) q = q.where(eq(schema.reports.reportedId, where.reportedId))
      await q
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

