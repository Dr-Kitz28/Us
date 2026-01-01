import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
export const runtime = 'nodejs'
import { db } from '@/lib/db'
import { users, matches, profiles, photos } from '@/lib/db/schema'
import { eq, or } from 'drizzle-orm'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Find current user
    const currentUserResults = await db.select().from(users).where(eq(users.email, session.user.email)).limit(1)
    const currentUser = currentUserResults[0]

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get matches where current user is either user1 or user2
    const matchResults = await db
      .select()
      .from(matches)
      .where(
        or(
          eq(matches.user1Id, currentUser.id),
          eq(matches.user2Id, currentUser.id)
        )
      )
      .orderBy(matches.createdAt)

    if (matchResults.length === 0) {
      return NextResponse.json({
        success: true,
        matches: [],
        count: 0
      })
    }

    // Get all unique user IDs from matches
    const userIds = new Set<string>()
    matchResults.forEach(match => {
      userIds.add(match.user1Id)
      userIds.add(match.user2Id)
    })

    // Fetch all users, profiles, and photos in batch
    const allUsers = await db.select().from(users).where(
      or(...Array.from(userIds).map(id => eq(users.id, id)))
    )
    
    const allProfiles = await db.select().from(profiles).where(
      or(...Array.from(userIds).map(id => eq(profiles.userId, id)))
    )
    
    const allPhotos = await db.select().from(photos).where(
      or(...Array.from(userIds).map(id => eq(photos.userId, id)))
    )

    // Create lookup maps
    const userMap = new Map(allUsers.map(u => [u.id, u]))
    const profileMap = new Map(allProfiles.map(p => [p.userId, p]))
    const photoMap = new Map<string, any[]>()
    allPhotos.forEach(photo => {
      if (!photoMap.has(photo.userId)) {
        photoMap.set(photo.userId, [])
      }
      photoMap.get(photo.userId)!.push(photo)
    })

    // Format matches for the messaging interface
    const formattedMatches = matchResults.map(match => {
      // Determine which user is the "other" user
      const otherUserId = match.user1Id === currentUser.id ? match.user2Id : match.user1Id
      const otherUser = userMap.get(otherUserId)
      
      if (!otherUser) {
        // Skip this match if the other user doesn't exist
        return null
      }

      const otherUserProfile = profileMap.get(otherUserId)
      const otherUserPhotos = photoMap.get(otherUserId) || []
      
      return {
        id: match.id,
        user1Id: match.user1Id,
        user2Id: match.user2Id,
        createdAt: match.createdAt?.toISOString() || new Date().toISOString(),
        otherUser: {
          id: otherUser.id,
          name: otherUser.name || 'Unknown',
          email: otherUser.email,
          photos: otherUserPhotos,
          profile: otherUserProfile ? {
            age: otherUserProfile.age,
            bio: otherUserProfile.bio,
            location: otherUserProfile.location,
            interests: otherUserProfile.interests
          } : null
        },
        messages: [] // Messages will be loaded separately when viewing a match
      }
    }).filter(Boolean) // Remove null entries

    return NextResponse.json({
      success: true,
      matches: formattedMatches,
      count: formattedMatches.length
    })

  } catch (error) {
    console.error('Get matches error:', error)
    
    // Enhanced error logging for debugging
    if (error instanceof Error) {
      console.error('Error stack:', error.stack)
      console.error('Error name:', error.name)
    }
    
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? String(error) : undefined
    }, { status: 500 })
  }
}
