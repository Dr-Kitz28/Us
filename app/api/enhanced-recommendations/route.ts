// Research-backed recommendation engine API with RSBM integration
import { NextRequest, NextResponse } from 'next/server';
// Ensure Node runtime for server-side modules
export const runtime = 'nodejs';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { users, profiles, photos } from '@/lib/db/schema';
import { eq, ne, sql, or } from 'drizzle-orm';
import { ResearchBackedMatcher } from '@/lib/recommendations/ResearchBackedMatcher';

// Simple in-memory cache for recommendations (15 minutes TTL)
const recommendationsCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes

function getCachedRecommendations(userId: string, useAdvanced: boolean) {
  const cacheKey = `${userId}:${useAdvanced}`;
  const cached = recommendationsCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  
  return null;
}

function setCachedRecommendations(userId: string, useAdvanced: boolean, data: any) {
  const cacheKey = `${userId}:${useAdvanced}`;
  recommendationsCache.set(cacheKey, { data, timestamp: Date.now() });
  
  // Clean old cache entries
  if (recommendationsCache.size > 1000) {
    const now = Date.now();
    for (const [key, value] of recommendationsCache.entries()) {
      if (now - value.timestamp > CACHE_TTL) {
        recommendationsCache.delete(key);
      }
    }
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    const limit = parseInt(url.searchParams.get('limit') || '10')
    const useAdvanced = url.searchParams.get('advanced') === 'true'

    // Check cache first
    const cached = getCachedRecommendations(session.user.email, useAdvanced);
    if (cached) {
      return NextResponse.json({
        ...cached,
        fromCache: true
      })
    }

    // Get current user
    const currentUserResults = await db.select().from(users).where(eq(users.email, session.user.email)).limit(1)
    const currentUser = currentUserResults[0]

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (useAdvanced) {
      // Use research-backed matching
      const recommendations = await ResearchBackedMatcher.getRecommendations(
        session.user.email!, 
        limit
      )
      
      // Get full user data for the recommendations
      const userEmails = recommendations.map(r => r.userId)
      
      if (userEmails.length === 0) {
        const result = {
          success: true,
          users: [],
          algorithm: 'research-backed',
          totalFound: 0
        };
        setCachedRecommendations(session.user.email, useAdvanced, result);
        return NextResponse.json(result)
      }

      const usersData = await db.select().from(users).where(
        or(...userEmails.map(email => eq(users.email, email)))
      )
      
      const userIds = usersData.map(u => u.id)
      const profilesData = await db.select().from(profiles).where(
        or(...userIds.map(id => eq(profiles.userId, id)))
      )
      
      const photosData = await db.select().from(photos).where(
        or(...userIds.map(id => eq(photos.userId, id)))
      )

      // Create lookup maps
      const profileMap = new Map(profilesData.map(p => [p.userId, p]))
      const photoMap = new Map<string, any[]>()
      photosData.forEach(photo => {
        if (!photoMap.has(photo.userId)) {
          photoMap.set(photo.userId, [])
        }
        photoMap.get(photo.userId)!.push(photo)
      })

      // Merge compatibility data with user data
      const enrichedUsers = usersData.map(user => {
        const compatibility = recommendations.find(r => r.userId === user.email)
        return {
          ...user,
          profile: profileMap.get(user.id) || null,
          photos: photoMap.get(user.id) || [],
          compatibilityScore: compatibility?.compatibilityScore || 0,
          matchReasons: compatibility?.reasonsForMatch || [],
          sharedInterests: compatibility?.sharedInterests || []
        }
      })

      const result = {
        success: true,
        users: enrichedUsers,
        algorithm: 'research-backed',
        totalFound: enrichedUsers.length
      };
      
      setCachedRecommendations(session.user.email, useAdvanced, result);
      return NextResponse.json(result)
    } else {
      // Fall back to simple recommendation
      const usersData = await db.select().from(users)
        .where(ne(users.email, session.user.email))
        .limit(limit)

      const userIds = usersData.map(u => u.id)
      
      if (userIds.length === 0) {
        const result = {
          success: true,
          users: [],
          algorithm: 'simple',
          totalFound: 0
        };
        setCachedRecommendations(session.user.email, useAdvanced, result);
        return NextResponse.json(result)
      }

      const profilesData = await db.select().from(profiles).where(
        or(...userIds.map(id => eq(profiles.userId, id)))
      )
      
      const photosData = await db.select().from(photos).where(
        or(...userIds.map(id => eq(photos.userId, id)))
      )

      // Create lookup maps
      const profileMap = new Map(profilesData.map(p => [p.userId, p]))
      const photoMap = new Map<string, any[]>()
      photosData.forEach(photo => {
        if (!photoMap.has(photo.userId)) {
          photoMap.set(photo.userId, [])
        }
        photoMap.get(photo.userId)!.push(photo)
      })

      const enrichedUsers = usersData.map(user => ({
        ...user,
        profile: profileMap.get(user.id) || null,
        photos: photoMap.get(user.id) || []
      }))

      const result = {
        success: true,
        users: enrichedUsers,
        algorithm: 'simple',
        totalFound: enrichedUsers.length
      };
      
      setCachedRecommendations(session.user.email, useAdvanced, result);
      return NextResponse.json(result)
    }
  } catch (error) {
    console.error('Enhanced recommendations error:', error)
    
    // Enhanced error logging
    if (error instanceof Error) {
      console.error('Error stack:', error.stack)
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to get recommendations',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined
      },
      { status: 500 }
    )
  }
}
