import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
export const runtime = 'nodejs'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Find current user
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email! }
    })

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get matches where current user is either user1 or user2
    const matches = await prisma.match.findMany({
      where: {
        OR: [
          { user1Id: currentUser.id },
          { user2Id: currentUser.id }
        ]
      },
      include: {
        user1: {
          include: {
            profile: true,
            photos: true
          }
        },
        user2: {
          include: {
            profile: true,
            photos: true
          }
        },
        messages: {
          orderBy: {
            createdAt: 'asc'
          },
          include: {
            sender: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Format matches for the messaging interface
    const formattedMatches = matches.map(match => {
      // Determine which user is the "other" user
      const otherUser = match.user1Id === currentUser.id ? match.user2 : match.user1
      
      return {
        id: match.id,
        user1Id: match.user1Id,
        user2Id: match.user2Id,
        createdAt: match.createdAt.toISOString(),
        otherUser: {
          id: otherUser.id,
          name: otherUser.name,
          email: otherUser.email,
          photos: otherUser.photos,
          profile: otherUser.profile
        },
        messages: match.messages.map(msg => ({
          id: msg.id,
          content: msg.content,
          senderId: msg.senderId,
          createdAt: msg.createdAt.toISOString(),
          senderName: msg.sender.name || 'Unknown'
        }))
      }
    })

    return NextResponse.json({
      success: true,
      matches: formattedMatches,
      count: formattedMatches.length
    })

  } catch (error) {
    console.error('Get matches error:', error)
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}
