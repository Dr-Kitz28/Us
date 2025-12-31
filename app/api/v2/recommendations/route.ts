/**
 * Drizzle-based Recommendations API
 * 
 * Performance targets:
 * - <75ms response time
 * - 100k MAU capacity
 * - Batch fetching (20-50 candidates)
 * 
 * This replaces the Prisma-based recommendations endpoint
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { 
  db, 
  users, 
  profiles, 
  likes, 
  passes, 
  matches, 
  blocks,
  getFeedCandidates 
} from '@/lib/db'
import { 
  getCachedFeedCandidates, 
  cacheFeedCandidates,
  checkLikeRateLimit 
} from '@/lib/cache'
import { eq, and, or, ne, notInArray, sql, desc } from 'drizzle-orm'

// Edge runtime for <75ms response times
export const runtime = 'edge'
export const dynamic = 'force-dynamic'

// Response time tracking
const PERF_THRESHOLD_MS = 75

interface FeedCandidate {
  id: string
  name: string | null
  image: string | null
  age: number | null
  bio: string | null
  interests: string | null
  location: string | null
  goldenRatioScore: number | null
  photos: string[]
}

export async function GET(req: NextRequest) {
  const startTime = performance.now()
  const requestId = crypto.randomUUID()

  try {
    // 1. Auth check
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 2. Get current user
    const [currentUser] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, session.user.email))
      .limit(1)

    if (!currentUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const userId = currentUser.id

    // 3. Parse query params
    const url = new URL(req.url)
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100)
    const gender = url.searchParams.get('gender') || undefined
    const minAge = url.searchParams.get('minAge') ? parseInt(url.searchParams.get('minAge')!) : undefined
    const maxAge = url.searchParams.get('maxAge') ? parseInt(url.searchParams.get('maxAge')!) : undefined

    // 4. Check cache first
    const cacheKey = `${userId}:${gender || 'any'}:${minAge || 0}:${maxAge || 100}`
    const cached = await getCachedFeedCandidates(cacheKey)
    
    if (cached && cached.length > 0) {
      const elapsed = performance.now() - startTime
      console.log(`[${requestId}] Feed served from cache in ${elapsed.toFixed(2)}ms`)
      
      return NextResponse.json({
        candidates: cached.slice(0, limit),
        cached: true,
        responseTime: elapsed,
        requestId,
      })
    }

    // 5. Get candidates from database
    const candidates = await getFeedCandidates(userId, {
      limit,
      gender,
      minAge,
      maxAge,
    })

    // 6. Format response
    const formattedCandidates: FeedCandidate[] = candidates.map(c => ({
      id: c.user.id,
      name: c.user.name,
      image: c.user.image,
      age: c.profile?.age || null,
      bio: c.profile?.bio || null,
      interests: c.profile?.interests || null,
      location: c.profile?.location || null,
      goldenRatioScore: c.profile?.goldenRatioScore || null,
      photos: [], // Would need separate query for photos
    }))

    // 7. Cache results
    if (formattedCandidates.length > 0) {
      await cacheFeedCandidates(cacheKey, formattedCandidates)
    }

    const elapsed = performance.now() - startTime

    // 8. Log performance warning if > threshold
    if (elapsed > PERF_THRESHOLD_MS) {
      console.warn(
        `[${requestId}] Feed query exceeded ${PERF_THRESHOLD_MS}ms threshold: ${elapsed.toFixed(2)}ms`
      )
    }

    return NextResponse.json({
      candidates: formattedCandidates,
      cached: false,
      responseTime: elapsed,
      requestId,
    })

  } catch (error) {
    const elapsed = performance.now() - startTime
    console.error(`[${requestId}] Feed error after ${elapsed.toFixed(2)}ms:`, error)

    return NextResponse.json(
      { 
        error: 'Internal server error',
        requestId,
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/v2/recommendations/swipe
 * 
 * Batch swipe endpoint (20-50 actions per call)
 * Reduces write amplification and improves throughput
 */
export async function POST(req: NextRequest) {
  const startTime = performance.now()
  const requestId = crypto.randomUUID()

  try {
    // 1. Auth check
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 2. Get current user
    const [currentUser] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, session.user.email))
      .limit(1)

    if (!currentUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const userId = currentUser.id

    // 3. Rate limit check
    const rateLimit = await checkLikeRateLimit(userId)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { 
          error: 'Daily like limit reached',
          remaining: rateLimit.remaining,
        },
        { status: 429 }
      )
    }

    // 4. Parse body
    const body = await req.json()
    const swipes: Array<{ targetId: string; action: 'like' | 'pass' }> = body.swipes

    if (!Array.isArray(swipes) || swipes.length === 0) {
      return NextResponse.json(
        { error: 'Invalid swipes array' },
        { status: 400 }
      )
    }

    if (swipes.length > 50) {
      return NextResponse.json(
        { error: 'Maximum 50 swipes per batch' },
        { status: 400 }
      )
    }

    // 5. Validate all target users exist
    const targetIds = swipes.map(s => s.targetId)
    const existingUsers = await db
      .select({ id: users.id })
      .from(users)
      .where(sql`${users.id} IN (${sql.join(targetIds.map(id => sql`${id}`), sql`, `)})`)

    const existingIds = new Set(existingUsers.map(u => u.id))
    const invalidIds = targetIds.filter(id => !existingIds.has(id))

    if (invalidIds.length > 0) {
      return NextResponse.json(
        { error: 'Invalid target user IDs', invalidIds },
        { status: 400 }
      )
    }

    // 6. Process swipes
    const results = {
      processed: 0,
      likes: 0,
      passes: 0,
      matches: [] as string[],
    }

    // Separate likes and passes
    const likesToInsert = swipes
      .filter(s => s.action === 'like')
      .map(s => ({ fromId: userId, toId: s.targetId }))

    const passesToInsert = swipes
      .filter(s => s.action === 'pass')
      .map(s => ({ fromId: userId, toId: s.targetId }))

    // Insert likes
    if (likesToInsert.length > 0) {
      await db.insert(likes).values(likesToInsert).onConflictDoNothing()
      results.likes = likesToInsert.length

      // Check for mutual likes (matches)
      for (const like of likesToInsert) {
        const [mutualLike] = await db
          .select({ id: likes.id })
          .from(likes)
          .where(and(
            eq(likes.fromId, like.toId),
            eq(likes.toId, userId)
          ))
          .limit(1)

        if (mutualLike) {
          // Create match
          const [first, second] = userId < like.toId 
            ? [userId, like.toId] 
            : [like.toId, userId]

          const [newMatch] = await db
            .insert(matches)
            .values({ user1Id: first, user2Id: second })
            .onConflictDoNothing()
            .returning({ id: matches.id })

          if (newMatch) {
            results.matches.push(newMatch.id)
          }
        }
      }
    }

    // Insert passes
    if (passesToInsert.length > 0) {
      await db.insert(passes).values(passesToInsert).onConflictDoNothing()
      results.passes = passesToInsert.length
    }

    results.processed = swipes.length

    const elapsed = performance.now() - startTime

    return NextResponse.json({
      ...results,
      responseTime: elapsed,
      requestId,
    })

  } catch (error) {
    const elapsed = performance.now() - startTime
    console.error(`[${requestId}] Swipe error after ${elapsed.toFixed(2)}ms:`, error)

    return NextResponse.json(
      { 
        error: 'Internal server error',
        requestId,
      },
      { status: 500 }
    )
  }
}
