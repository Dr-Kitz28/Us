// Advanced Analytics for Research-Backed Dating App
// Tracks user behavior patterns to provide wellness insights

interface SessionData {
  sessionId: string
  userId: string
  startTime: number
  endTime?: number
  swipeCount: number
  likeCount: number
  passCount: number
  averageTimePerProfile: number
  rejectionStreak: number
  matchesMade: number
  wellnessInterventions: number
  qualityFocusPrompts: number
}

interface UserBehaviorPattern {
  userId: string
  averageSessionLength: number
  preferredActiveHours: number[]
  swipeVelocity: number // swipes per minute
  selectivityRatio: number // likes/total swipes
  burnoutRisk: 'low' | 'medium' | 'high'
  lastActiveDate: Date
  totalSessions: number
  healthyBehaviorScore: number // 0-100
}

export class AdvancedAnalytics {
  private static sessions = new Map<string, SessionData>()
  private static userPatterns = new Map<string, UserBehaviorPattern>()

  // Session Management
  static startSession(userId: string): string {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    this.sessions.set(sessionId, {
      sessionId,
      userId,
      startTime: Date.now(),
      swipeCount: 0,
      likeCount: 0,
      passCount: 0,
      averageTimePerProfile: 0,
      rejectionStreak: 0,
      matchesMade: 0,
      wellnessInterventions: 0,
      qualityFocusPrompts: 0
    })

    return sessionId
  }

  static endSession(sessionId: string): SessionData | null {
    const session = this.sessions.get(sessionId)
    if (!session) return null

    session.endTime = Date.now()
    
    // Update user patterns
    this.updateUserPattern(session)
    
    return session
  }

  // Behavior Tracking
  static recordSwipe(sessionId: string, action: 'like' | 'pass', timeSpent: number) {
    const session = this.sessions.get(sessionId)
    if (!session) return

    session.swipeCount++
    
    if (action === 'like') {
      session.likeCount++
      session.rejectionStreak = 0
    } else {
      session.passCount++
      session.rejectionStreak++
    }

    // Update average time per profile
    session.averageTimePerProfile = 
      (session.averageTimePerProfile * (session.swipeCount - 1) + timeSpent) / session.swipeCount
  }

  static recordMatch(sessionId: string) {
    const session = this.sessions.get(sessionId)
    if (session) {
      session.matchesMade++
    }
  }

  static recordWellnessIntervention(sessionId: string, type: 'wellness' | 'quality') {
    const session = this.sessions.get(sessionId)
    if (!session) return

    if (type === 'wellness') {
      session.wellnessInterventions++
    } else {
      session.qualityFocusPrompts++
    }
  }

  // Pattern Analysis
  private static updateUserPattern(session: SessionData) {
    const existing = this.userPatterns.get(session.userId)
    const sessionLength = (session.endTime || Date.now()) - session.startTime

    if (!existing) {
      // Create new pattern
      this.userPatterns.set(session.userId, {
        userId: session.userId,
        averageSessionLength: sessionLength,
        preferredActiveHours: [new Date().getHours()],
        swipeVelocity: session.swipeCount / (sessionLength / 60000), // swipes per minute
        selectivityRatio: session.likeCount / Math.max(session.swipeCount, 1),
        burnoutRisk: this.calculateBurnoutRisk(session),
        lastActiveDate: new Date(),
        totalSessions: 1,
        healthyBehaviorScore: this.calculateHealthScore(session)
      })
    } else {
      // Update existing pattern
      const totalSessions = existing.totalSessions + 1
      
      this.userPatterns.set(session.userId, {
        ...existing,
        averageSessionLength: (existing.averageSessionLength * existing.totalSessions + sessionLength) / totalSessions,
        swipeVelocity: (existing.swipeVelocity * existing.totalSessions + (session.swipeCount / (sessionLength / 60000))) / totalSessions,
        selectivityRatio: this.updateSelectivityRatio(existing, session),
        burnoutRisk: this.calculateBurnoutRisk(session, existing),
        lastActiveDate: new Date(),
        totalSessions,
        healthyBehaviorScore: this.calculateHealthScore(session, existing)
      })
    }
  }

  private static calculateBurnoutRisk(session: SessionData, existing?: UserBehaviorPattern): 'low' | 'medium' | 'high' {
    let riskScore = 0

    // High rejection streak
    if (session.rejectionStreak > 20) riskScore += 3
    else if (session.rejectionStreak > 10) riskScore += 2

    // High swipe count in short time
    const sessionLength = (session.endTime || Date.now()) - session.startTime
    const swipeVelocity = session.swipeCount / (sessionLength / 60000)
    if (swipeVelocity > 2) riskScore += 2
    else if (swipeVelocity > 1) riskScore += 1

    // Long session time
    if (sessionLength > 60 * 60 * 1000) riskScore += 2 // 1+ hours
    else if (sessionLength > 30 * 60 * 1000) riskScore += 1 // 30+ minutes

    // Multiple wellness interventions needed
    if (session.wellnessInterventions > 3) riskScore += 2
    else if (session.wellnessInterventions > 1) riskScore += 1

    if (existing) {
      // Daily usage pattern
      if (existing.totalSessions > 5) riskScore += 1 // Multiple sessions today
      if (existing.averageSessionLength > 45 * 60 * 1000) riskScore += 1 // Long average sessions
    }

    if (riskScore >= 6) return 'high'
    if (riskScore >= 3) return 'medium'
    return 'low'
  }

  private static calculateHealthScore(session: SessionData, existing?: UserBehaviorPattern): number {
    let score = 100

    // Deduct for unhealthy patterns
    if (session.rejectionStreak > 15) score -= 20
    if (session.swipeCount > 50) score -= 15
    if (session.wellnessInterventions > 2) score -= 10
    if (session.averageTimePerProfile < 5000) score -= 10 // Less than 5 seconds per profile

    // Add for healthy patterns
    if (session.averageTimePerProfile > 15000) score += 10 // 15+ seconds per profile
    const sessionSelectivity = session.likeCount / Math.max(session.swipeCount, 1)
    if (sessionSelectivity > 0.2) score += 10 // Reasonably selective
    if (session.matchesMade > 0) score += 5

    return Math.max(0, Math.min(100, score))
  }

  private static updateSelectivityRatio(existing: UserBehaviorPattern, session: SessionData): number {
    // Weighted average based on session sizes
    const existingWeight = existing.totalSessions
    const sessionWeight = 1
    const totalWeight = existingWeight + sessionWeight

    const sessionRatio = session.likeCount / Math.max(session.swipeCount, 1)
    
    return (existing.selectivityRatio * existingWeight + sessionRatio * sessionWeight) / totalWeight
  }

  // Public Analytics Methods
  static getUserPattern(userId: string): UserBehaviorPattern | null {
    return this.userPatterns.get(userId) || null
  }

  static getSessionData(sessionId: string): SessionData | null {
    return this.sessions.get(sessionId) || null
  }

  static shouldSuggestBreak(userId: string): boolean {
    const pattern = this.userPatterns.get(userId)
    if (!pattern) return false

    return pattern.burnoutRisk === 'high' || 
           pattern.healthyBehaviorScore < 40 ||
           pattern.averageSessionLength > 60 * 60 * 1000 // 1+ hour sessions
  }

  static getWellnessInsight(userId: string): string | null {
    const pattern = this.userPatterns.get(userId)
    if (!pattern) return null

    if (pattern.swipeVelocity > 2) {
      return "You're swiping quickly! Research shows slowing down leads to better matches. 🐌"
    }
    
    if (pattern.selectivityRatio < 0.1) {
      return "You seem selective! That's great - quality connections are worth waiting for. ✨"
    }
    
    if (pattern.selectivityRatio > 0.8) {
      return "You're liking most profiles. Consider being more selective for better matches. 🎯"
    }

    if (pattern.averageSessionLength > 45 * 60 * 1000) {
      return "Long dating sessions can lead to decision fatigue. Short, focused sessions work better! 💪"
    }

    return null
  }

  // Research-backed recommendations
  static getPersonalizedRecommendation(userId: string): {
    type: 'timing' | 'behavior' | 'strategy' | 'wellness'
    message: string
    icon: string
  } | null {
    const pattern = this.userPatterns.get(userId)
    if (!pattern) return null

    // Timing recommendations
    if (pattern.preferredActiveHours.length > 0) {
      const currentHour = new Date().getHours()
      const preferredHours = pattern.preferredActiveHours
      
      if (!preferredHours.includes(currentHour)) {
        return {
          type: 'timing',
          message: `You typically have better luck dating around ${preferredHours[0]}:00. Consider trying then!`,
          icon: '⏰'
        }
      }
    }

    // Behavior recommendations
    if (pattern.burnoutRisk === 'high') {
      return {
        type: 'wellness',
        message: 'Your usage pattern suggests you might benefit from a break. Your mental health matters! 🌱',
        icon: '🌸'
      }
    }

    if (pattern.swipeVelocity > 2.5) {
      return {
        type: 'behavior',
        message: 'Try spending more time on each profile. Research shows this leads to better matches! 📚',
        icon: '🔍'
      }
    }

    return null
  }
}
