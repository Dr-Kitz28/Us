import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Find users that the current user hasn't liked or passed yet
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email! },
      include: { 
        likesGiven: true,
        // passesGiven: true  // Temporarily disabled until Prisma client is regenerated
      }
    })

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get IDs of users already liked or passed
    const likedUserIds = currentUser.likesGiven.map(like => like.toId)
    // const passedUserIds = currentUser.passesGiven.map(pass => pass.toId)  // Temporarily disabled
    const excludedUserIds = [...likedUserIds] // , ...passedUserIds]  // Temporarily only exclude liked

    // Find available users (not liked, not passed, not current user)
    const availableUsers = await prisma.user.findMany({
      where: {
        AND: [
          { NOT: { id: currentUser.id } }, // Not current user
          { NOT: { id: { in: excludedUserIds } } }, // Not already liked or passed
          { profile: { isNot: null } } // Has a profile
        ]
      },
      include: {
        profile: true,
        photos: true
      },
      take: 50 // Limit to 50 users for performance
    })

    return NextResponse.json({
      success: true,
      users: availableUsers,
      count: availableUsers.length
    })

  } catch (error) {
    console.error('Recommendations error:', error)
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}
