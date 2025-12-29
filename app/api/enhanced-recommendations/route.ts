// Research-backed recommendation engine API with RSBM integration
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ResearchBackedMatcher } from '@/lib/recommendations/ResearchBackedMatcher';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    const limit = parseInt(url.searchParams.get('limit') || '10')
    const useAdvanced = url.searchParams.get('advanced') === 'true'

    if (useAdvanced) {
      // Use research-backed matching
      const recommendations = await ResearchBackedMatcher.getRecommendations(
        session.user.email!, 
        limit
      )
      
      // Get full user data for the recommendations
      const userEmails = recommendations.map(r => r.userId)
      const users = await prisma.user.findMany({
        where: { email: { in: userEmails } },
        include: { 
          profile: true,
          photos: true
        }
      })

      // Merge compatibility data with user data
      const enrichedUsers = users.map(user => {
        const compatibility = recommendations.find(r => r.userId === user.email)
        return {
          ...user,
          compatibilityScore: compatibility?.compatibilityScore || 0,
          matchReasons: compatibility?.reasonsForMatch || [],
          sharedInterests: compatibility?.sharedInterests || []
        }
      })

      return NextResponse.json({
        success: true,
        users: enrichedUsers,
        algorithm: 'research-backed',
        totalFound: enrichedUsers.length
      })
    } else {
      // Fall back to simple recommendation
      const users = await prisma.user.findMany({
        where: {
          email: { not: session.user.email }
        },
        include: {
          profile: true,
          photos: true
        },
        take: limit
      })

      return NextResponse.json({
        success: true,
        users,
        algorithm: 'simple',
        totalFound: users.length
      })
    }
  } catch (error) {
    console.error('Enhanced recommendations error:', error)
    return NextResponse.json(
      { error: 'Failed to get recommendations' },
      { status: 500 }
    )
  }
}
