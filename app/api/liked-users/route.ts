import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Get all liked users (people I've liked)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email! }
    })

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const likes = await prisma.like.findMany({
      where: { fromId: currentUser.id },
      include: {
        to: {
          include: {
            profile: true,
            photos: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Check which likes resulted in matches
    const likedUsers = await Promise.all(
      likes.map(async (like) => {
        // Check if there's a match
        const match = await prisma.match.findFirst({
          where: {
            OR: [
              { user1Id: currentUser.id, user2Id: like.to.id },
              { user1Id: like.to.id, user2Id: currentUser.id }
            ]
          }
        })

        return {
          id: like.to.id,
          name: like.to.name,
          email: like.to.email,
          profile: like.to.profile,
          photos: like.to.photos,
          likedAt: like.createdAt,
          isMatch: !!match,
          matchedAt: match?.createdAt || null,
          matchId: match?.id || null
        }
      })
    )

    return NextResponse.json({ 
      success: true, 
      users: likedUsers,
      count: likedUsers.length,
      matchCount: likedUsers.filter(user => user.isMatch).length
    })

  } catch (error) {
    console.error('Error fetching liked users:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}
