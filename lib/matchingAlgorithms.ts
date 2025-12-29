// Enhanced matching algorithms based on research insights
import { User, Profile, Like, Match } from '@prisma/client'

export interface MatchingScore {
  userId: string
  score: number
  factors: {
    reciprocityLikelihood: number
    compatibilityScore: number
    proximityBonus: number
    activityRecency: number
  }
}

// Stable Marriage Algorithm (Gale-Shapley) inspired implementation
export class StableMatchingEngine {
  // Calculate preference ranking based on user behavior patterns
  calculateUserPreferences(userId: string, potentialMatches: User[]): string[] {
    // This would analyze like patterns, message patterns, profile interactions
    // For now, return sorted by compatibility factors
    return potentialMatches
      .map(user => ({
        id: user.id,
        score: this.calculateCompatibilityScore(userId, user.id)
      }))
      .sort((a, b) => b.score - a.score)
      .map(item => item.id)
  }

  // Enhanced compatibility scoring using multiple factors
  private calculateCompatibilityScore(userId1: string, userId2: string): number {
    // Implement collaborative filtering + content-based scoring
    // Research shows CF outperforms simple demographic matching
    const cfScore = this.collaborativeFilteringScore(userId1, userId2)
    const contentScore = this.contentBasedScore(userId1, userId2)
    const recencyBonus = this.activityRecencyBonus(userId2)
    
    // Weight based on research findings
    return (cfScore * 0.6) + (contentScore * 0.3) + (recencyBonus * 0.1)
  }

  private collaborativeFilteringScore(userId1: string, userId2: string): number {
    // Find users with similar like patterns to userId1
    // If they liked userId2, increase score
    // This mimics the successful CF approaches mentioned in research
    return 0.5 // Placeholder - would implement full CF algorithm
  }

  private contentBasedScore(userId1: string, userId2: string): number {
    // Compare profiles for compatibility factors
    // Age difference, location proximity, shared interests
    return 0.5 // Placeholder
  }

  private activityRecencyBonus(userId: string): number {
    // Research shows recent activity is important for mutual engagement
    return 0.1 // Placeholder
  }

  // Find most compatible pairs using stable matching principles
  findMostCompatiblePairs(userPool: User[]): Array<{user1: string, user2: string, score: number}> {
    const pairs: Array<{user1: string, user2: string, score: number}> = []
    
    // Implement Gale-Shapley inspired algorithm
    // Research shows Hinge's "Most Compatible" is 8x more likely to lead to phone number exchange
    for (let i = 0; i < userPool.length; i++) {
      for (let j = i + 1; j < userPool.length; j++) {
        const score = this.calculateMutualCompatibility(userPool[i].id, userPool[j].id)
        if (score > 0.7) { // High threshold for "most compatible"
          pairs.push({
            user1: userPool[i].id,
            user2: userPool[j].id,
            score
          })
        }
      }
    }
    
    return pairs.sort((a, b) => b.score - a.score)
  }

  private calculateMutualCompatibility(userId1: string, userId2: string): number {
    // Calculate likelihood both users would like each other
    const score1to2 = this.calculateCompatibilityScore(userId1, userId2)
    const score2to1 = this.calculateCompatibilityScore(userId2, userId1)
    
    // Research shows mutual interest prediction is key to reducing "unrequited" matches
    return Math.min(score1to2, score2to1) // Conservative approach
  }
}

// Multi-Armed Bandit for exploration vs exploitation
export class ReinforcementLearningMatcher {
  // Thompson Sampling approach as suggested in Conroy-Beam research
  selectProfilesForUser(userId: string, candidatePool: User[], count: number = 10): User[] {
    // Balance showing known preferences vs exploring new types
    const explorationRate = 0.2 // 20% exploration, 80% exploitation
    
    const exploitationCount = Math.floor(count * (1 - explorationRate))
    const explorationCount = count - exploitationCount
    
    // Get high-confidence matches (exploitation)
    const knownGoodMatches = candidatePool
      .sort((a, b) => this.getPredictedScore(userId, b.id) - this.getPredictedScore(userId, a.id))
      .slice(0, exploitationCount)
    
    // Get diverse/exploratory matches
    const exploratoryMatches = candidatePool
      .filter(u => !knownGoodMatches.includes(u))
      .sort(() => Math.random() - 0.5) // Random selection for exploration
      .slice(0, explorationCount)
    
    return [...knownGoodMatches, ...exploratoryMatches]
  }

  private getPredictedScore(userId: string, targetId: string): number {
    // Would implement Thompson Sampling with beta distributions
    // Based on historical swipe outcomes
    return Math.random() // Placeholder
  }

  // Update model based on user feedback (swipes, messages, dates)
  updateModel(userId: string, targetId: string, outcome: 'like' | 'pass' | 'match' | 'message' | 'date') {
    // Research shows importance of feedback loops like Hinge's "We Met" feature
    // Update user's preference model based on outcomes
    console.log(`Updating model for user ${userId}: ${outcome} on ${targetId}`)
  }
}

// Anti-bias measures based on research warnings
export class FairMatchingGuard {
  // Prevent algorithmic bias that could exclude minority users
  ensureDiverseRecommendations(userId: string, recommendations: User[]): User[] {
    // Research shows CF can create bias feedback loops
    // Inject diversity to prevent echo chambers
    const diversityThreshold = 0.3
    
    // This would analyze demographic diversity and inject variety
    // if recommendations are too homogeneous
    return recommendations // Placeholder
  }

  // Detect and mitigate rejection mindset (research by Pronk & Denissen)
  adjustForChoiceOverload(userId: string, profileCount: number): number {
    // Research shows 27% drop in acceptance from first to last profile
    // Limit profiles to prevent decision fatigue
    const maxProfiles = 20 // Based on choice overload research
    return Math.min(profileCount, maxProfiles)
  }
}
