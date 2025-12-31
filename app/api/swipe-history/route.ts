import { NextRequest, NextResponse } from 'next/server'
export const runtime = 'nodejs'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: {
        email: session.user.email!
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get swipe statistics
    const [likesCount, passesCount, matchesCount] = await Promise.all([
      prisma.like.count({
        where: { fromId: user.id }
      }),
      prisma.pass.count({
        where: { fromId: user.id }
      }),
      prisma.match.count({
        where: {
          OR: [
            { user1Id: user.id },
            { user2Id: user.id }
          ]
        }
      })
    ])

    return NextResponse.json({
      success: true,
      history: {
        likes: likesCount,
        passes: passesCount,
        matches: matchesCount
      }
    })

  } catch (error) {
    console.error('Error fetching swipe history:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
