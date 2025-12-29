import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { likedUserEmail } = await request.json()

    if (!likedUserEmail) {
      return NextResponse.json({ error: 'Liked user email required' }, { status: 400 })
    }

    // Find current user
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    // Find liked user
    const likedUser = await prisma.user.findUnique({
      where: { email: likedUserEmail }
    })

    if (!currentUser || !likedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Create the like
    await prisma.like.create({
      data: {
        fromId: currentUser.id,
        toId: likedUser.id
      }
    })

    // Check if it's a mutual like (match)
    const mutualLike = await prisma.like.findFirst({
      where: {
        fromId: likedUser.id,
        toId: currentUser.id
      }
    })

    let isMatch = false
    if (mutualLike) {
      // Create match
      await prisma.match.create({
        data: {
          user1Id: currentUser.id,
          user2Id: likedUser.id
        }
      })
      isMatch = true
    }

    return NextResponse.json({
      success: true,
      isMatch,
      message: isMatch ? `🎉 It's a match with ${likedUser.name}!` : 'Like sent!'
    })

  } catch (error) {
    console.error('Like error:', error)
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}
