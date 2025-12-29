import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { getCache } from '@/lib/cache/redisCache'
import { createClient } from 'redis'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const isDevBypass = process.env.NODE_ENV !== 'production' && (request.headers.get('x-dev-bypass') === '1' || request.nextUrl.searchParams.get('dev') === '1')

    if (!session?.user?.email && !isDevBypass) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Support a dev-friendly "mark seen" action via body.action === 'markSeen'
    if (body.action === 'markSeen') {
      const matchId = body.matchId
      if (!matchId) return NextResponse.json({ error: 'matchId required' }, { status: 400 })

      // resolve current user (dev bypass supported)
      let currentUser
      if (isDevBypass) {
        currentUser = await prisma.user.findUnique({ where: { email: 'upload_test@example.com' } })
        if (!currentUser) return NextResponse.json({ error: 'Dev test user not found' }, { status: 404 })
      } else {
        currentUser = await prisma.user.findUnique({ where: { email: session.user.email } })
        if (!currentUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }

      // mark unseen messages sent to current user as seen
      await prisma.message.updateMany({
        where: { matchId, senderId: { not: currentUser.id }, seenAt: null },
        data: { seenAt: new Date() }
      })

      // publish seen event (non-fatal)
      try {
        const cache = getCache()
        await cache.publishEvent(`match:${matchId}:message`, {
          type: 'messages_seen',
          matchId,
          by: currentUser.id,
        })
      } catch (err) {
        // ignore
      }

      return NextResponse.json({ success: true })
    }

    const matchId = body.matchId
    const content = body.content

    if (!matchId || !content?.trim()) {
      return NextResponse.json({ error: 'Match ID and content required' }, { status: 400 })
    }

    // Get current user (support dev bypass using test user email)
    let currentUser
    if (isDevBypass) {
      currentUser = await prisma.user.findUnique({ where: { email: 'upload_test@example.com' } })
      if (!currentUser) {
        return NextResponse.json({ error: 'Dev test user not found' }, { status: 404 })
      }
    } else {
      currentUser = await prisma.user.findUnique({ where: { email: session.user.email } })
      if (!currentUser) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }
    }

    // Verify the match exists and user is part of it
    const match = await prisma.match.findUnique({
      where: { id: matchId }
    })

    if (!match || (match.user1Id !== currentUser.id && match.user2Id !== currentUser.id)) {
      return NextResponse.json({ error: 'Match not found or unauthorized' }, { status: 404 })
    }

    // Rate limit messages per user (using Redis cache)
    try {
      const cache = getCache()
      const allowed = await cache.rateLimitMessages(currentUser.id)
      if (!allowed) {
        return NextResponse.json({ error: 'Message rate limit exceeded' }, { status: 429 })
      }
    } catch (err) {
      // If cache not available, continue without rate-limiting (dev-friendly)
      console.warn('Rate limit check skipped:', err)
    }

    // Create the message
    const message = await prisma.message.create({
      data: {
        matchId: matchId,
        senderId: currentUser.id,
        content: content.trim()
      },
      include: {
        sender: true
      }
    })

    // Publish realtime event (if redis available) so clients can subscribe
    try {
      const cache = getCache()
      await cache.publishEvent(`match:${matchId}:message`, {
        type: 'new_message',
        matchId,
        message: {
          id: message.id,
          content: message.content,
          senderId: message.senderId,
          createdAt: message.createdAt
        }
      })
    } catch (err) {
      // Non-fatal
    }

    return NextResponse.json({
      success: true,
      message: {
        id: message.id,
        content: message.content,
        senderId: message.senderId,
        createdAt: message.createdAt.toISOString(),
        senderName: message.sender.name || 'Unknown'
      }
    })

  } catch (error) {
    console.error('Error sending message:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const isDevBypass = process.env.NODE_ENV !== 'production' && (request.headers.get('x-dev-bypass') === '1' || request.nextUrl.searchParams.get('dev') === '1')

    // Support SSE stream via ?stream=1&matchId=... (dev bypass only)
    if (request.nextUrl.searchParams.get('stream') === '1') {
      const matchIdStream = request.nextUrl.searchParams.get('matchId')
      if (!matchIdStream) return new Response(JSON.stringify({ error: 'matchId required' }), { status: 400 })
      if (!isDevBypass) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })

      const channel = `match:${matchIdStream}:message`
      const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379'
      const redisClient = createClient({ url: redisUrl })
      await redisClient.connect()
      const encoder = new TextEncoder()

      const stream = new ReadableStream({
        async start(controller) {
          let closed = false
          const onMessage = (message: string) => {
            try { controller.enqueue(encoder.encode(`data: ${message}\n\n`)) } catch (e) {}
          }
          try { await redisClient.subscribe(channel, onMessage) } catch (err) { controller.enqueue(encoder.encode(`event: error\ndata: ${JSON.stringify({ error: 'subscribe_failed' })}\n\n`)) }
          // Use request.signal to detect client abort in Node/Next.js
          request.signal.addEventListener('abort', async () => {
            if (closed) return
            closed = true
            try { await redisClient.unsubscribe(channel) } catch (e) {}
            try { await redisClient.quit() } catch (e) {}
            try { controller.close() } catch (e) {}
          })
        }
      })

      return new Response(stream, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache, no-transform', Connection: 'keep-alive' } })
    }

    if (!session?.user?.email && !isDevBypass) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const matchId = request.nextUrl.searchParams.get('matchId')
    if (!matchId) {
      return NextResponse.json({ error: 'matchId required' }, { status: 400 })
    }

    let currentUser
    if (isDevBypass) {
      currentUser = await prisma.user.findUnique({ where: { email: 'upload_test@example.com' } })
      if (!currentUser) {
        return NextResponse.json({ error: 'Dev test user not found' }, { status: 404 })
      }
    } else {
      currentUser = await prisma.user.findUnique({ where: { email: session.user.email } })
      if (!currentUser) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }
    }

    // Verify match and membership
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          include: { sender: true }
        }
      }
    })

    if (!match || (match.user1Id !== currentUser.id && match.user2Id !== currentUser.id)) {
      return NextResponse.json({ error: 'Match not found or unauthorized' }, { status: 404 })
    }

    // Mark messages delivered for messages sent to current user (optional)
    try {
      await prisma.message.updateMany({
        where: {
          matchId,
          senderId: { not: currentUser.id },
          deliveredAt: null
        },
        data: { deliveredAt: new Date() }
      })
    } catch (err) {
      // ignore non-fatal
    }

    const formatted = match.messages.map(msg => ({
      id: msg.id,
      content: msg.content,
      senderId: msg.senderId,
      createdAt: msg.createdAt.toISOString(),
      senderName: msg.sender.name || 'Unknown'
    }))

    return NextResponse.json({ success: true, messages: formatted })
  } catch (error) {
    console.error('Get messages error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
