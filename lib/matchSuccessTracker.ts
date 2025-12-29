// Research-backed success tracking and optimization
// Tracks what actually leads to meaningful connections

interface SuccessMetrics {
  profileViews: number
  swipeRightRate: number
  matchRate: number
  conversationStartRate: number
  responseRate: number
  messageQualityScore: number
  dateRequestRate: number
  actualDateRate: number
}

interface UserBehaviorPattern {
  timeOfDayActive: string[]
  averageSessionLength: number
  swipesPerSession: number
  messageResponseTime: number
  profileCompleteness: number
  photoQuality: number
}

interface SuccessFactorAnalysis {
  strongestFactors: Array<{
    factor: string
    impact: string
    recommendation: string
  }>
  improvementOpportunities: Array<{
    area: string
    currentScore: number
    potentialGain: string
    actionItem: string
  }>
  benchmarkComparison: {
    userPerformance: number
    averagePerformance: number
    topPerformerBenchmark: number
  }
}

export class MatchSuccessTracker {
  
  // Track comprehensive success funnel
  static trackUserFunnel(userId: string, metrics: SuccessMetrics): SuccessFactorAnalysis {
    
    // Analyze conversion rates through the funnel
    const conversionRates = {
      profileToSwipe: metrics.swipeRightRate,
      swipeToMatch: metrics.matchRate,
      matchToConversation: metrics.conversationStartRate,
      conversationToResponse: metrics.responseRate,
      responseToDate: metrics.dateRequestRate,
      dateToMeeting: metrics.actualDateRate
    }
    
    // Identify bottlenecks (research-backed benchmarks)
    const benchmarks = {
      profileToSwipe: 0.15,      // 15% swipe right rate is healthy
      swipeToMatch: 0.20,        // 20% match rate indicates good profile
      matchToConversation: 0.70, // 70% should start conversations
      conversationToResponse: 0.80, // 80% should get responses
      responseToDate: 0.15,      // 15% should lead to date requests
      dateToMeeting: 0.60        // 60% of date requests should happen
    }
    
    // Analyze strongest performing factors
    const strongestFactors = []
    const improvementOpportunities = []
    
    // Profile View to Swipe Analysis
    if (conversionRates.profileToSwipe >= benchmarks.profileToSwipe * 1.2) {
      strongestFactors.push({
        factor: 'Profile Attractiveness',
        impact: 'High swipe rate indicates strong visual appeal',
        recommendation: 'Maintain current photo strategy - it\'s working!'
      })
    } else if (conversionRates.profileToSwipe < benchmarks.profileToSwipe * 0.8) {
      improvementOpportunities.push({
        area: 'Profile Photos',
        currentScore: Math.round(conversionRates.profileToSwipe * 100),
        potentialGain: '40-60% more matches',
        actionItem: 'Update photos - research shows photos are 10x more important than other factors'
      })
    }
    
    // Swipe to Match Analysis
    if (conversionRates.swipeToMatch >= benchmarks.swipeToMatch * 1.2) {
      strongestFactors.push({
        factor: 'Mutual Attraction',
        impact: 'High match rate shows good targeting',
        recommendation: 'Your selectivity is working - keep being choosy!'
      })
    } else if (conversionRates.swipeToMatch < benchmarks.swipeToMatch * 0.8) {
      improvementOpportunities.push({
        area: 'Match Quality',
        currentScore: Math.round(conversionRates.swipeToMatch * 100),
        potentialGain: '2-3x more matches',
        actionItem: 'Improve profile completeness and authenticity'
      })
    }
    
    // Match to Conversation Analysis
    if (conversionRates.matchToConversation >= benchmarks.matchToConversation * 1.1) {
      strongestFactors.push({
        factor: 'Conversation Initiation',
        impact: 'Great at starting conversations',
        recommendation: 'You\'re proactive - this leads to better outcomes!'
      })
    } else if (conversionRates.matchToConversation < benchmarks.matchToConversation * 0.9) {
      improvementOpportunities.push({
        area: 'Message Initiative',
        currentScore: Math.round(conversionRates.matchToConversation * 100),
        potentialGain: '50% more active conversations',
        actionItem: 'Start conversations within 24 hours - research shows timing matters'
      })
    }
    
    // Conversation Quality Analysis
    if (metrics.messageQualityScore >= 80) {
      strongestFactors.push({
        factor: 'Message Quality',
        impact: 'High-quality messages drive engagement',
        recommendation: 'Your messaging style creates connection!'
      })
    } else if (metrics.messageQualityScore < 60) {
      improvementOpportunities.push({
        area: 'Message Quality',
        currentScore: metrics.messageQualityScore,
        potentialGain: '3x better response rates',
        actionItem: 'Use questions and share personal details - avoid generic messages'
      })
    }
    
    // Response Rate Analysis
    if (conversionRates.conversationToResponse >= benchmarks.conversationToResponse * 1.1) {
      strongestFactors.push({
        factor: 'Message Appeal',
        impact: 'Messages consistently get responses',
        recommendation: 'Your conversation style works - keep it up!'
      })
    } else if (conversionRates.conversationToResponse < benchmarks.conversationToResponse * 0.9) {
      improvementOpportunities.push({
        area: 'Message Engagement',
        currentScore: Math.round(conversionRates.conversationToResponse * 100),
        potentialGain: '50-70% more active chats',
        actionItem: 'Reference their profile and ask engaging questions'
      })
    }
    
    // Calculate overall performance score
    const overallScore = Object.values(conversionRates).reduce((sum, rate) => sum + rate, 0) / Object.values(conversionRates).length * 100
    
    return {
      strongestFactors,
      improvementOpportunities,
      benchmarkComparison: {
        userPerformance: Math.round(overallScore),
        averagePerformance: 45, // Research-based average
        topPerformerBenchmark: 75 // Research-based top 10%
      }
    }
  }
  
  // Analyze what photos/profile elements lead to success
  static analyzeSuccessPatterns(userId: string, successfulMatches: Array<{
    profileElements: {
      photoTypes: string[]
      bioKeywords: string[]
      interests: string[]
    }
    conversationSuccess: boolean
    dateResult: boolean
  }>): {
    successfulPhotoTypes: Array<{ type: string, successRate: number }>
    successfulBioElements: Array<{ element: string, impact: number }>
    successfulInterests: Array<{ interest: string, connectionRate: number }>
    recommendations: string[]
  } {
    
    const photoAnalysis = this.analyzePhotoSuccess(successfulMatches)
    const bioAnalysis = this.analyzeBioSuccess(successfulMatches)
    const interestAnalysis = this.analyzeInterestSuccess(successfulMatches)
    
    const recommendations = []
    
    // Photo recommendations
    const topPhotoType = photoAnalysis[0]
    if (topPhotoType && topPhotoType.successRate > 0.6) {
      recommendations.push(`Your ${topPhotoType.type} photos work best - add more!`)
    }
    
    // Bio recommendations
    const topBioElement = bioAnalysis[0]
    if (topBioElement && topBioElement.impact > 0.5) {
      recommendations.push(`Mentioning "${topBioElement.element}" in your bio attracts quality matches`)
    }
    
    // Interest recommendations
    const topInterest = interestAnalysis[0]
    if (topInterest && topInterest.connectionRate > 0.7) {
      recommendations.push(`Your interest in "${topInterest.interest}" creates great connections`)
    }
    
    return {
      successfulPhotoTypes: photoAnalysis,
      successfulBioElements: bioAnalysis,
      successfulInterests: interestAnalysis,
      recommendations
    }
  }
  
  private static analyzePhotoSuccess(matches: Array<any>): Array<{ type: string, successRate: number }> {
    const photoTypeSuccess = new Map<string, { total: number, successful: number }>()
    
    matches.forEach(match => {
      match.profileElements.photoTypes.forEach((type: string) => {
        if (!photoTypeSuccess.has(type)) {
          photoTypeSuccess.set(type, { total: 0, successful: 0 })
        }
        const current = photoTypeSuccess.get(type)!
        current.total += 1
        if (match.conversationSuccess && match.dateResult) {
          current.successful += 1
        }
      })
    })
    
    return Array.from(photoTypeSuccess.entries())
      .map(([type, stats]) => ({
        type,
        successRate: stats.total > 0 ? stats.successful / stats.total : 0
      }))
      .sort((a, b) => b.successRate - a.successRate)
  }
  
  private static analyzeBioSuccess(matches: Array<any>): Array<{ element: string, impact: number }> {
    const bioElementSuccess = new Map<string, { total: number, successful: number }>()
    
    matches.forEach(match => {
      match.profileElements.bioKeywords.forEach((keyword: string) => {
        if (!bioElementSuccess.has(keyword)) {
          bioElementSuccess.set(keyword, { total: 0, successful: 0 })
        }
        const current = bioElementSuccess.get(keyword)!
        current.total += 1
        if (match.conversationSuccess) {
          current.successful += 1
        }
      })
    })
    
    return Array.from(bioElementSuccess.entries())
      .map(([element, stats]) => ({
        element,
        impact: stats.total > 2 ? stats.successful / stats.total : 0 // Only consider if enough data
      }))
      .sort((a, b) => b.impact - a.impact)
      .slice(0, 5)
  }
  
  private static analyzeInterestSuccess(matches: Array<any>): Array<{ interest: string, connectionRate: number }> {
    const interestSuccess = new Map<string, { total: number, successful: number }>()
    
    matches.forEach(match => {
      match.profileElements.interests.forEach((interest: string) => {
        if (!interestSuccess.has(interest)) {
          interestSuccess.set(interest, { total: 0, successful: 0 })
        }
        const current = interestSuccess.get(interest)!
        current.total += 1
        if (match.conversationSuccess) {
          current.successful += 1
        }
      })
    })
    
    return Array.from(interestSuccess.entries())
      .map(([interest, stats]) => ({
        interest,
        connectionRate: stats.total > 1 ? stats.successful / stats.total : 0
      }))
      .sort((a, b) => b.connectionRate - a.connectionRate)
      .slice(0, 5)
  }
  
  // Generate personalized success report
  static generateSuccessReport(
    userId: string,
    metrics: SuccessMetrics,
    behaviorPattern: UserBehaviorPattern,
    timeframe: '7d' | '30d' | '90d'
  ): {
    overallGrade: 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D'
    keyInsights: string[]
    nextSteps: Array<{
      action: string
      expectedImpact: string
      timeToSee: string
    }>
    successStory: string
  } {
    
    const overallScore = (
      metrics.swipeRightRate * 0.1 +
      metrics.matchRate * 0.2 +
      metrics.conversationStartRate * 0.2 +
      metrics.responseRate * 0.2 +
      metrics.messageQualityScore * 0.15 +
      metrics.dateRequestRate * 0.1 +
      metrics.actualDateRate * 0.05
    ) * 100
    
    const grade = overallScore >= 85 ? 'A+' :
                  overallScore >= 80 ? 'A' :
                  overallScore >= 75 ? 'B+' :
                  overallScore >= 70 ? 'B' :
                  overallScore >= 65 ? 'C+' :
                  overallScore >= 60 ? 'C' : 'D'
    
    const keyInsights = [
      `Your ${timeframe} match rate is ${Math.round(metrics.matchRate * 100)}% (${metrics.matchRate > 0.2 ? 'above' : 'below'} average)`,
      `Message quality score: ${metrics.messageQualityScore}/100 - ${metrics.messageQualityScore > 70 ? 'strong' : 'needs work'}`,
      `Best active time: ${behaviorPattern.timeOfDayActive[0] || 'evening'} (when most users are online)`
    ]
    
    const nextSteps = []
    
    if (metrics.matchRate < 0.15) {
      nextSteps.push({
        action: 'Update your main photo with a clear, smiling face shot',
        expectedImpact: '40-60% more matches',
        timeToSee: '1-2 weeks'
      })
    }
    
    if (metrics.messageQualityScore < 70) {
      nextSteps.push({
        action: 'Use profile-specific openers with questions',
        expectedImpact: '2-3x better response rates',
        timeToSee: 'Immediate'
      })
    }
    
    if (metrics.conversationStartRate < 0.6) {
      nextSteps.push({
        action: 'Message new matches within 24 hours',
        expectedImpact: '50% more active conversations',
        timeToSee: '1 week'
      })
    }
    
    const successStory = this.generateSuccessStory(grade, metrics)
    
    return {
      overallGrade: grade,
      keyInsights,
      nextSteps,
      successStory
    }
  }
  
  private static generateSuccessStory(grade: string, metrics: SuccessMetrics): string {
    if (grade === 'A+' || grade === 'A') {
      return "🌟 You're in the top 10% of users! Your profile attracts quality matches and your conversation skills create real connections. Keep doing what you're doing!"
    } else if (grade === 'B+' || grade === 'B') {
      return "📈 You're doing well! Small improvements to your photos or messaging could easily put you in the top tier of users."
    } else if (grade === 'C+' || grade === 'C') {
      return "💪 Good foundation! Focus on your biggest opportunity first - usually photos or message quality - and you'll see rapid improvement."
    } else {
      return "🚀 Great potential! Research shows users who optimize their profiles see 300% improvement in 30 days. Your journey starts now!"
    }
  }
}
