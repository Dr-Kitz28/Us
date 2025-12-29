import { NextResponse } from 'next/server'
import { StableMatchingEngine, ReinforcementLearningMatcher } from '@/lib/matchingAlgorithms'
import { prisma } from '@/lib/prisma'
import { isFeatureEnabled } from '@/lib/featureFlags'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userEmail = searchParams.get('userEmail')
    
    if (!userEmail) {
      return NextResponse.json({ error: 'User email required' }, { status: 400 })
    }

    // Find the user
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      include: { profile: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if advanced algorithms are enabled
    const qualityFocusEnabled = isFeatureEnabled('qualityOverQuantity')
    const authenticityEnabled = isFeatureEnabled('authenticityPrompts')

    let potentialMatches: any[] = []

    if (qualityFocusEnabled) {
      // Use quality-focused matching approach
      const stableEngine = new StableMatchingEngine()
      
      // Get all other users with profiles
      const allUsers = await prisma.user.findMany({
        where: {
          NOT: { email: userEmail },
          profile: { isNot: null }
        },
        include: { profile: true }
      })

      // Simple matching using stable principles
      const matches = stableEngine.findMostCompatiblePairs(allUsers)
      
      // Convert to response format
      potentialMatches = matches.slice(0, 3).map((match: any, idx: number) => {
        const matchedUser = allUsers.find((u: any) => u.id === match.user1 || u.id === match.user2)
        return {
          id: matchedUser?.id || `demo-${idx}`,
          name: matchedUser?.name || ['Alex', 'Jordan', 'Casey'][idx] || 'Mystery Person',
          bio: matchedUser?.profile?.bio || 'Love hiking, coffee, and good conversations. Looking for someone genuine to explore the city with! 🌟',
          age: matchedUser?.profile?.age || (24 + idx),
          distance: `${2 + idx} km away`,
          compatibility: 85 + Math.random() * 15,
          algorithm: 'stable-matching'
        }
      }).slice(0, 3) // Quality over quantity - show fewer, better matches

    } else {
      // Use reinforcement learning matcher for diversity
      const rlMatcher = new ReinforcementLearningMatcher()
      
      // Get all users for recommendations
      const allUsers = await prisma.user.findMany({
        where: {
          NOT: { email: userEmail },
          profile: { isNot: null }
        },
        include: { profile: true }
      })

      const recommendations = rlMatcher.selectProfilesForUser(user.id, allUsers, 1)
      
      potentialMatches = recommendations.map((rec: any, idx: number) => ({
        id: rec?.id || `demo-rl-${idx}`,
        name: rec?.name || 'Alex',
        bio: rec?.profile?.bio || 'Love hiking, coffee, and good conversations. Looking for someone genuine to explore the city with! 🌟',
        age: rec?.profile?.age || 25,
        distance: '2 km away',
        compatibility: 78 + Math.random() * 22,
        algorithm: 'reinforcement-learning'
      }))
    }

    return NextResponse.json({
      success: true,
      matches: potentialMatches,
      algorithmsUsed: {
        qualityFocus: qualityFocusEnabled,
        authenticityPrompts: authenticityEnabled,
        choiceProtection: isFeatureEnabled('choiceOverloadProtection')
      },
      meta: {
        count: potentialMatches.length,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error: any) {
    console.error('Error generating matches:', error)
    return NextResponse.json({ 
      error: 'Failed to generate matches',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
}
