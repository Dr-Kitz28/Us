/**
 * RSBM: Reciprocal Stable-Bandit Matching Algorithm
 * 
 * A research-backed matchmaking system combining:
 * - Stable Marriage (Gale-Shapley)
 * - Collaborative Filtering
 * - Thompson Sampling (Multi-Armed Bandit)
 * - Fairness & Safety constraints
 * 
 * Based on academic research from:
 * - Gale-Shapley stable matching
 * - Conroy-Beam 2024 (mate search as bandit problem)
 * - UCLA collaborative filtering studies
 */

import { prisma } from '@/lib/prisma'

export interface UserPreferences {
  userId: string
  ageMin: number
  ageMax: number
  maxDistance: number
  gender: string
  dealbreakers: {
    smoking?: boolean
    drinking?: boolean
    children?: boolean
    religion?: string[]
  }
}

export interface CandidateScore {
  candidateId: string
  reciprocalScore: number
  pLikeGiven: number // P(user → candidate)
  pLikeReceived: number // P(candidate → user)
  pReply: number // P(meaningful conversation)
  trustMultiplier: number
  diversityMultiplier: number
  fairnessMultiplier: number
  explainability: {
    topFactors: string[]
    matchReason: string
  }
}

export interface MatchingContext {
  userId: string
  currentLocation: { lat: number; lon: number }
  timeOfDay: string
  dayOfWeek: string
  sessionContext: {
    swipesThisSession: number
    likesThisSession: number
    timeSpent: number
  }
}

/**
 * Step 0: Hard Gate Filters
 * Must pass all constraints before entering scoring
 */
export class HardGateFilter {
  async passesGates(
    userId: string,
    candidateId: string,
    preferences: UserPreferences
  ): Promise<{ passes: boolean; reason?: string }> {
    // Safety blocks
    const isBlocked = await this.checkSafetyBlocks(userId, candidateId)
    if (isBlocked) {
      return { passes: false, reason: 'safety_block' }
    }

    // Age constraints
    const candidateAge = await this.getCandidateAge(candidateId)
    if (candidateAge < preferences.ageMin || candidateAge > preferences.ageMax) {
      return { passes: false, reason: 'age_constraint' }
    }

    // Distance constraints
    const distance = await this.calculateDistance(userId, candidateId)
    if (distance > preferences.maxDistance) {
      return { passes: false, reason: 'distance_constraint' }
    }

    // Orientation/gender constraints
    const genderMatch = await this.checkGenderPreference(
      userId,
      candidateId,
      preferences.gender
    )
    if (!genderMatch) {
      return { passes: false, reason: 'gender_preference' }
    }

    // Dealbreakers
    const dealbreaker = await this.checkDealbreakers(
      candidateId,
      preferences.dealbreakers
    )
    if (dealbreaker) {
      return { passes: false, reason: `dealbreaker_${dealbreaker}` }
    }

    return { passes: true }
  }

  private async checkSafetyBlocks(
    userId: string,
    candidateId: string
  ): Promise<boolean> {
    // Check blocks, reports, device/IP flags
    // Implementation in safety module
    return false
  }

  private async getCandidateAge(_candidateId: string): Promise<number> {
    // Fetch from user profile
    return 25 // Placeholder
  }

  private async calculateDistance(
    _userId: string,
    _candidateId: string
  ): Promise<number> {
    // Calculate geographic distance
    return 5 // Placeholder in km
  }

  private async checkGenderPreference(
    _userId: string,
    _candidateId: string,
    _preferredGender: string
  ): Promise<boolean> {
    return true // Placeholder
  }

  private async checkDealbreakers(
    _candidateId: string,
    _dealbreakers: UserPreferences['dealbreakers']
  ): Promise<string | null> {
    return null // Placeholder
  }
}

/**
 * Step 1: Two-Sided Preference Modeling
 * Learn probability distributions for likes and replies
 */
export class PreferenceModel {
  /**
   * Matrix factorization + content-based hybrid model
   * Implements collaborative filtering as described in UCLA research
   */
  async predictLikeProbability(
    fromUserId: string,
    toUserId: string
  ): Promise<number> {
    // Use embedding-based similarity + historical patterns
    const embedding1 = await this.getUserEmbedding(fromUserId)
    const embedding2 = await this.getUserEmbedding(toUserId)

    const cosineSim = this.cosineSimilarity(embedding1, embedding2)

    // Adjust with content features
    const contentScore = await this.contentBasedScore(fromUserId, toUserId)

    // Historical like patterns (CF component)
    const cfScore = await this.collaborativeFilteringScore(fromUserId, toUserId)

    // Weighted combination
    return 0.4 * cosineSim + 0.3 * contentScore + 0.3 * cfScore
  }

  async predictReplyProbability(
    user1Id: string,
    user2Id: string
  ): Promise<number> {
    // Analyze conversation history patterns
    const responseRate1 = await this.getUserResponseRate(user1Id)
    const responseRate2 = await this.getUserResponseRate(user2Id)

    // Mutual responsiveness
    const mutualityScore = Math.min(responseRate1, responseRate2)

    // Context similarity (topics, communication style)
    const compatScore = await this.conversationCompatibility(user1Id, user2Id)

    return 0.6 * mutualityScore + 0.4 * compatScore
  }

  private async getUserEmbedding(_userId: string): Promise<number[]> {
    // Fetch or compute user embedding vector
    // Dimensions: interests, behavior, preferences, demographics
    return Array(128).fill(0.5) // Placeholder 128-dim vector
  }

  private cosineSimilarity(vec1: number[], vec2: number[]): number {
    const dotProduct = vec1.reduce((sum, val, i) => sum + val * vec2[i], 0)
    const mag1 = Math.sqrt(vec1.reduce((sum, val) => sum + val * val, 0))
    const mag2 = Math.sqrt(vec2.reduce((sum, val) => sum + val * val, 0))
    return dotProduct / (mag1 * mag2)
  }

  private async contentBasedScore(
    _userId1: string,
    _userId2: string
  ): Promise<number> {
    // Profile attribute similarity
    return 0.7 // Placeholder
  }

  private async collaborativeFilteringScore(
    _userId1: string,
    _userId2: string
  ): Promise<number> {
    // "Users who liked X also liked Y" patterns
    return 0.6 // Placeholder
  }

  private async getUserResponseRate(_userId: string): Promise<number> {
    return 0.8 // Placeholder
  }

  private async conversationCompatibility(
    _userId1: string,
    _userId2: string
  ): Promise<number> {
    return 0.75 // Placeholder
  }
}

/**
 * Step 2: Reciprocal Score Calculation
 * Core ranking signal combining mutual interest
 */
export class ReciprocalScorer {
  constructor(private preferenceModel: PreferenceModel) {}

  async calculateScore(
    userId: string,
    candidateId: string,
    context: MatchingContext
  ): Promise<CandidateScore> {
    // Base reciprocal components
    const pLikeGiven = await this.preferenceModel.predictLikeProbability(
      userId,
      candidateId
    )
    const pLikeReceived = await this.preferenceModel.predictLikeProbability(
      candidateId,
      userId
    )
    const pReply = await this.preferenceModel.predictReplyProbability(
      userId,
      candidateId
    )

    // Core reciprocal score: mutual interest * conversation likelihood
    const baseScore = pLikeGiven * pLikeReceived * pReply

    // Multipliers
    const trustMultiplier = await this.calculateTrustMultiplier(candidateId)
    const diversityMultiplier = await this.calculateDiversityMultiplier(
      userId,
      candidateId,
      context
    )
    const fairnessMultiplier = await this.calculateFairnessMultiplier(
      candidateId
    )

    const finalScore =
      baseScore * trustMultiplier * diversityMultiplier * fairnessMultiplier

    // Generate explainability
    const explainability = this.generateExplanation(
      userId,
      candidateId,
      {
        pLikeGiven,
        pLikeReceived,
        pReply,
        trustMultiplier,
        diversityMultiplier
      }
    )

    return {
      candidateId,
      reciprocalScore: finalScore,
      pLikeGiven,
      pLikeReceived,
      pReply,
      trustMultiplier,
      diversityMultiplier,
      fairnessMultiplier,
      explainability
    }
  }

  private async calculateTrustMultiplier(candidateId: string): Promise<number> {
    // Verification status, safety score, profile completeness
    const isVerified = await this.isUserVerified(candidateId)
    const safetyScore = await this.getSafetyScore(candidateId)
    const profileCompleteness = await this.getProfileCompleteness(candidateId)

    let multiplier = 1.0
    if (isVerified) multiplier *= 1.2
    multiplier *= 0.8 + 0.2 * safetyScore // 0.8-1.0 range
    multiplier *= 0.9 + 0.1 * profileCompleteness // 0.9-1.0 range

    return Math.min(multiplier, 1.5) // Cap at 1.5x
  }

  private async calculateDiversityMultiplier(
    userId: string,
    candidateId: string,
    context: MatchingContext
  ): Promise<number> {
    // Encourage some exploration (bounded)
    const recentInteractionSimilarity = await this.getRecentSimilarity(
      userId,
      candidateId
    )

    // If too similar to recent swipes, small penalty
    if (recentInteractionSimilarity > 0.9) {
      return 0.95
    }

    // If very different (exploration), small bonus
    if (recentInteractionSimilarity < 0.3) {
      return 1.05
    }

    return 1.0
  }

  private async calculateFairnessMultiplier(
    candidateId: string
  ): Promise<number> {
    // Prevent "rich get richer" - boost under-exposed users slightly
    const exposureRate = await this.getExposureRate(candidateId)
    const avgExposure = await this.getAverageExposureRate()

    if (exposureRate < 0.5 * avgExposure) {
      return 1.1 // 10% boost for under-exposed
    }

    return 1.0
  }

  private generateExplanation(
    userId: string,
    candidateId: string,
    scores: {
      pLikeGiven: number
      pLikeReceived: number
      pReply: number
      trustMultiplier: number
      diversityMultiplier: number
    }
  ): { topFactors: string[]; matchReason: string } {
    const factors: string[] = []

    if (scores.pLikeGiven > 0.7) factors.push('matches your preferences')
    if (scores.pLikeReceived > 0.7) factors.push('likely to like you back')
    if (scores.pReply > 0.7) factors.push('good conversation potential')
    if (scores.trustMultiplier > 1.1) factors.push('verified profile')
    if (scores.diversityMultiplier > 1.0) factors.push('something different')

    const matchReason = `Shown because: ${factors.join(', ')}`

    return {
      topFactors: factors,
      matchReason
    }
  }

  // Helper methods (would connect to real data)
  private async isUserVerified(userId: string): Promise<boolean> {
    return true // Placeholder
  }

  private async getSafetyScore(userId: string): Promise<number> {
    return 1.0 // 0-1 scale
  }

  private async getProfileCompleteness(userId: string): Promise<number> {
    return 0.9 // 0-1 scale
  }

  private async getRecentSimilarity(
    userId: string,
    candidateId: string
  ): Promise<number> {
    return 0.5 // Placeholder
  }

  private async getExposureRate(userId: string): Promise<number> {
    return 0.5 // Impressions per time period
  }

  private async getAverageExposureRate(): Promise<number> {
    return 0.5 // Platform average
  }
}

/**
 * Step 3: Stable "Most Compatible" Daily Slot
 * Gale-Shapley on top-K candidates
 */
export class StableMatchingSlot {
  async findMostCompatible(
    userId: string,
    candidates: CandidateScore[],
    k: number = 20
  ): Promise<CandidateScore | null> {
    // Take top K candidates by reciprocal score
    const topK = candidates
      .sort((a, b) => b.reciprocalScore - a.reciprocalScore)
      .slice(0, k)

    if (topK.length === 0) return null

    // Run simplified Gale-Shapley
    // For each candidate, compute user's rank of them and their rank of user
    const stableMatch = await this.galeShapleySimplified(userId, topK)

    return stableMatch
  }

  private async galeShapleySimplified(
    userId: string,
    candidates: CandidateScore[]
  ): Promise<CandidateScore> {
    // Simplified version: find candidate with highest mutual preference
    // Full GS would run iterative proposal-acceptance rounds

    let bestMatch = candidates[0]
    let bestMutuality = bestMatch.pLikeGiven * bestMatch.pLikeReceived

    for (const candidate of candidates) {
      const mutuality = candidate.pLikeGiven * candidate.pLikeReceived
      if (mutuality > bestMutuality) {
        bestMutuality = mutuality
        bestMatch = candidate
      }
    }

    return bestMatch
  }
}

/**
 * Step 4: Thompson Sampling Bandit for Exploration
 * Learns from uncertainty, explores cold-start and under-exposed users
 */
export class ThompsonSamplingExplorer {
  async selectExplorationCandidates(
    userId: string,
    allCandidates: string[],
    explorationBudget: number = 0.1 // 10% of impressions
  ): Promise<string[]> {
    // Thompson Sampling: sample from posterior distributions
    const uncertainCandidates = await this.getUncertainCandidates(
      userId,
      allCandidates
    )

    // Sample proportional to uncertainty (variance)
    const exploratory = this.sampleByUncertainty(
      uncertainCandidates,
      Math.floor(allCandidates.length * explorationBudget)
    )

    return exploratory
  }

  private async getUncertainCandidates(
    userId: string,
    candidateIds: string[]
  ): Promise<Array<{ id: string; mean: number; variance: number }>> {
    // For each candidate, estimate posterior mean and variance
    return candidateIds.map(id => ({
      id,
      mean: 0.5, // Placeholder: estimated match probability
      variance: 0.2 // Placeholder: uncertainty
    }))
  }

  private sampleByUncertainty(
    candidates: Array<{ id: string; mean: number; variance: number }>,
    count: number
  ): string[] {
    // Sample from Beta or Gaussian posteriors
    // Higher variance = more likely to explore

    const sampled = candidates
      .map(c => ({
        id: c.id,
        sample: c.mean + Math.random() * c.variance // Simplified sampling
      }))
      .sort((a, b) => b.sample - a.sample)
      .slice(0, count)
      .map(s => s.id)

    return sampled
  }
}

/**
 * Step 5: Bias and Inequality Controls
 * Ensures fairness across cohorts
 */
export class FairnessController {
  async enforceExposureParity(
    candidates: CandidateScore[],
    cohortField: 'gender' | 'region' | 'language'
  ): Promise<CandidateScore[]> {
    // Group by cohort
    const cohorts = await this.groupByCohort(candidates, cohortField)

    // Check exposure rates
    for (const [cohort, users] of Object.entries(cohorts)) {
      const avgExposure = await this.getCohortExposure(cohort)
      const targetExposure = await this.getTargetExposure()

      // If under-exposed, boost scores slightly
      if (avgExposure < 0.8 * targetExposure) {
        users.forEach(user => {
          user.fairnessMultiplier *= 1.15
          user.reciprocalScore *= 1.15
        })
      }
    }

    // Re-sort after fairness adjustments
    return candidates.sort((a, b) => b.reciprocalScore - a.reciprocalScore)
  }

  async calibrateByCohor(_candidateIds: string[]): Promise<void> {
    // Periodically check: are predicted match rates aligned with observed rates?
    // If model under-predicts for certain cohorts, recalibrate
  }

  private async groupByCohort(
    candidates: CandidateScore[],
    field: string
  ): Promise<Record<string, CandidateScore[]>> {
    const groups: Record<string, CandidateScore[]> = {}
    for (const candidate of candidates) {
      const cohortValue = await this.getCohortValue(candidate.candidateId, field)
      if (!groups[cohortValue]) groups[cohortValue] = []
      groups[cohortValue].push(candidate)
    }
    return groups
  }

  private async getCohortValue(_userId: string, _field: string): Promise<string> {
    return 'default' // Placeholder
  }

  private async getCohortExposure(cohort: string): Promise<number> {
    return 1.0 // Placeholder
  }

  private async getTargetExposure(): Promise<number> {
    return 1.0 // Placeholder
  }
}

/**
 * Main RSBM Orchestrator
 * Coordinates all steps
 */
export class RSBMEngine {
  private hardGate: HardGateFilter
  private preferenceModel: PreferenceModel
  private scorer: ReciprocalScorer
  private stableSlot: StableMatchingSlot
  private explorer: ThompsonSamplingExplorer
  private fairness: FairnessController

  constructor() {
    this.hardGate = new HardGateFilter()
    this.preferenceModel = new PreferenceModel()
    this.scorer = new ReciprocalScorer(this.preferenceModel)
    this.stableSlot = new StableMatchingSlot()
    this.explorer = new ThompsonSamplingExplorer()
    this.fairness = new FairnessController()
  }

  /**
   * Main feed generation method
   */
  async generateFeed(
    userId: string,
    preferences: UserPreferences,
    context: MatchingContext,
    feedSize: number = 20
  ): Promise<{
    mostCompatible: CandidateScore | null
    mainFeed: CandidateScore[]
    explorationCandidates: CandidateScore[]
  }> {
    // Step 1: Get candidate pool (already filtered by basic criteria)
    const candidatePool = await this.getCandidatePool(userId, preferences)

    // Step 2: Apply hard gates
    const gatedCandidates: string[] = []
    for (const candidateId of candidatePool) {
      const gateResult = await this.hardGate.passesGates(
        userId,
        candidateId,
        preferences
      )
      if (gateResult.passes) {
        gatedCandidates.push(candidateId)
      }
    }

    // Step 3: Score all candidates
    const scoredCandidates: CandidateScore[] = []
    for (const candidateId of gatedCandidates) {
      const score = await this.scorer.calculateScore(userId, candidateId, context)
      scoredCandidates.push(score)
    }

    // Step 4: Apply fairness adjustments
    const fairCandidates = await this.fairness.enforceExposureParity(
      scoredCandidates,
      'gender'
    )

    // Step 5: Find Most Compatible (daily stable match)
    const mostCompatible = await this.stableSlot.findMostCompatible(
      userId,
      fairCandidates,
      20
    )

    // Step 6: Thompson Sampling exploration (10% of feed)
    const explorationIds = await this.explorer.selectExplorationCandidates(
      userId,
      gatedCandidates,
      0.1
    )
    const explorationCandidates = scoredCandidates.filter(c =>
      explorationIds.includes(c.candidateId)
    )

    // Step 7: Main feed = top scores + exploration, deduplicated
    const mainFeedCount = feedSize - explorationCandidates.length
    const mainFeed = fairCandidates
      .filter(c => !explorationIds.includes(c.candidateId))
      .filter(c => c.candidateId !== mostCompatible?.candidateId)
      .slice(0, mainFeedCount)

    return {
      mostCompatible,
      mainFeed,
      explorationCandidates
    }
  }

  private async getCandidatePool(
    userId: string,
    preferences: UserPreferences
  ): Promise<string[]> {
    // Fetch from database: users matching basic filters
    // Basic implementation: return users with a profile (non-null)
    // Exclude the querying user and limit results to a reasonable size
    try {
      const whereClause: any = { id: { not: userId } }

      // Build profile filters correctly for Prisma relation filtering
      const profileFilters: any = {}

      if (preferences?.gender && preferences.gender !== 'any') {
        profileFilters.gender = preferences.gender
      }

      if (typeof preferences?.ageMin === 'number' || typeof preferences?.ageMax === 'number') {
        const ageFilter: any = {}
        if (typeof preferences.ageMin === 'number') ageFilter.gte = preferences.ageMin
        if (typeof preferences.ageMax === 'number') ageFilter.lte = preferences.ageMax
        profileFilters.age = ageFilter
      }

      if (Object.keys(profileFilters).length > 0) {
        // Use `is` to filter on the related `profile` record
        whereClause.profile = { is: profileFilters }
      } else {
        // Only require that a profile exists
        whereClause.profile = { isNot: null }
      }

      const candidates = await prisma.user.findMany({
        where: whereClause,
        select: { id: true },
        take: 1000
      })

      return candidates.map(c => c.id)
    } catch {
      // On error, return empty pool to keep behaviour safe
      return []
    }
  }
}
