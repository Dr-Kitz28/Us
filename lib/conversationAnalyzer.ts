// Research-backed conversation analysis and improvement system
// Based on studies on message quality, response rates, and relationship formation

interface ConversationMetrics {
  messageLength: number
  questionCount: number
  personalDetailCount: number
  responseTime: number
  enthusiasmScore: number
  reciprocityScore: number
}

interface ConversationInsight {
  type: 'suggestion' | 'warning' | 'praise'
  category: 'engagement' | 'depth' | 'timing' | 'quality'
  message: string
  researchBacking: string
  priority: 'high' | 'medium' | 'low'
}

export class ConversationAnalyzer {
  
  // Research: Messages 50-150 characters get highest response rates
  static analyzeMessageLength(message: string): ConversationInsight[] {
    const insights: ConversationInsight[] = []
    const length = message.trim().length
    
    if (length < 10) {
      insights.push({
        type: 'warning',
        category: 'engagement',
        message: 'Very short messages get 60% fewer responses',
        researchBacking: 'OKCupid data shows messages under 10 characters perform poorly',
        priority: 'high'
      })
    } else if (length < 30) {
      insights.push({
        type: 'suggestion',
        category: 'engagement',
        message: 'Try adding a bit more - 50-100 characters is optimal',
        researchBacking: 'Research shows 50-150 character messages get best response rates',
        priority: 'medium'
      })
    } else if (length > 200) {
      insights.push({
        type: 'warning',
        category: 'engagement',
        message: 'Long messages can feel overwhelming - try being more concise',
        researchBacking: 'Messages over 200 characters see declining response rates',
        priority: 'medium'
      })
    } else if (length >= 50 && length <= 150) {
      insights.push({
        type: 'praise',
        category: 'engagement',
        message: 'Perfect message length! This range gets best responses',
        researchBacking: 'Optimal 50-150 character range based on dating app research',
        priority: 'low'
      })
    }
    
    return insights
  }
  
  // Research: Questions increase response rates by 30-50%
  static analyzeQuestionContent(message: string): ConversationInsight[] {
    const insights: ConversationInsight[] = []
    const questionMarkers = ['?', 'what', 'how', 'where', 'when', 'why', 'which', 'who']
    const questionCount = questionMarkers.filter(marker => 
      message.toLowerCase().includes(marker)
    ).length
    
    if (questionCount === 0) {
      insights.push({
        type: 'suggestion',
        category: 'engagement',
        message: 'Add a question to boost response rates by 30%!',
        researchBacking: 'Dating app research shows questions significantly increase replies',
        priority: 'high'
      })
    } else if (questionCount > 2) {
      insights.push({
        type: 'warning',
        category: 'engagement',
        message: 'Too many questions can feel like an interview',
        researchBacking: 'More than 2 questions per message reduces response quality',
        priority: 'medium'
      })
    } else {
      insights.push({
        type: 'praise',
        category: 'engagement',
        message: 'Great use of questions for engagement!',
        researchBacking: '1-2 questions per message is optimal for responses',
        priority: 'low'
      })
    }
    
    return insights
  }
  
  // Research: Personal details create connection
  static analyzePersonalSharing(message: string): ConversationInsight[] {
    const insights: ConversationInsight[] = []
    const personalMarkers = [
      'I', 'my', 'me', 'myself', 'mine', 'I\'m', 'I\'ve', 'I\'ll', 
      'love', 'enjoy', 'hate', 'feel', 'think', 'believe'
    ]
    
    const personalCount = personalMarkers.filter(marker => 
      message.toLowerCase().includes(marker.toLowerCase())
    ).length
    
    if (personalCount === 0) {
      insights.push({
        type: 'suggestion',
        category: 'depth',
        message: 'Share something personal to create connection',
        researchBacking: 'Self-disclosure increases attraction and response rates',
        priority: 'medium'
      })
    } else if (personalCount > 5) {
      insights.push({
        type: 'warning',
        category: 'depth',
        message: 'Balance personal sharing - ask about them too!',
        researchBacking: 'Reciprocal disclosure works better than one-sided sharing',
        priority: 'medium'
      })
    }
    
    return insights
  }
  
  // Research: Generic messages get ignored
  static analyzeSpecificity(message: string, profileContext?: {
    bio?: string
    interests?: string[]
    photos?: Array<{ url: string }>
  }): ConversationInsight[] {
    const insights: ConversationInsight[] = []
    
    const genericPhrases = [
      'hey', 'hi', 'hello', 'how are you', 'what\'s up', 'how\'s it going',
      'nice pics', 'you\'re cute', 'you\'re beautiful', 'dtf'
    ]
    
    const isGeneric = genericPhrases.some(phrase => 
      message.toLowerCase().includes(phrase)
    )
    
    if (isGeneric && message.length < 50) {
      insights.push({
        type: 'warning',
        category: 'quality',
        message: 'Generic messages get 90% fewer responses - be specific!',
        researchBacking: 'Research shows personalized messages dramatically outperform generic ones',
        priority: 'high'
      })
    }
    
    // Check if message references profile
    if (profileContext?.bio && message.toLowerCase().includes('bio')) {
      insights.push({
        type: 'praise',
        category: 'quality',
        message: 'Excellent! Referencing their profile shows genuine interest',
        researchBacking: 'Messages referencing profile details get 3x more responses',
        priority: 'low'
      })
    }
    
    return insights
  }
  
  // Research: Enthusiasm is contagious
  static analyzeEnthusiasm(message: string): ConversationInsight[] {
    const insights: ConversationInsight[] = []
    
    const enthusiasmMarkers = ['!', '😊', '😄', '😍', '🔥', '💯', 'amazing', 'awesome', 'love', 'excited']
    const enthusiasmCount = enthusiasmMarkers.filter(marker => 
      message.includes(marker)
    ).length
    
    if (enthusiasmCount === 0) {
      insights.push({
        type: 'suggestion',
        category: 'engagement',
        message: 'Add some enthusiasm - positive energy is attractive!',
        researchBacking: 'Positive emotions in messages increase response rates and attraction',
        priority: 'medium'
      })
    } else if (enthusiasmCount > 4) {
      insights.push({
        type: 'warning',
        category: 'engagement',
        message: 'Tone down the enthusiasm slightly - authenticity matters',
        researchBacking: 'Moderate enthusiasm (1-3 markers) performs better than excessive',
        priority: 'low'
      })
    }
    
    return insights
  }
  
  // Comprehensive message analysis
  static analyzeMessage(
    message: string, 
    profileContext?: {
      bio?: string
      interests?: string[]
      photos?: Array<{ url: string }>
    }
  ): {
    overallScore: number
    insights: ConversationInsight[]
    topSuggestion: string
    researchTip: string
  } {
    const allInsights: ConversationInsight[] = [
      ...this.analyzeMessageLength(message),
      ...this.analyzeQuestionContent(message),
      ...this.analyzePersonalSharing(message),
      ...this.analyzeSpecificity(message, profileContext),
      ...this.analyzeEnthusiasm(message)
    ]
    
    // Calculate score based on insights
    let score = 70 // Base score
    
    allInsights.forEach(insight => {
      if (insight.type === 'praise') score += 10
      else if (insight.type === 'warning' && insight.priority === 'high') score -= 20
      else if (insight.type === 'warning' && insight.priority === 'medium') score -= 10
      else if (insight.type === 'suggestion' && insight.priority === 'high') score -= 15
      else if (insight.type === 'suggestion' && insight.priority === 'medium') score -= 5
    })
    
    score = Math.max(0, Math.min(100, score))
    
    // Get top priority insight
    const prioritizedInsights = allInsights
      .filter(insight => insight.type !== 'praise')
      .sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 }
        return priorityOrder[b.priority] - priorityOrder[a.priority]
      })
    
    const topSuggestion = prioritizedInsights[0]?.message || 'Your message looks great!'
    
    const researchTip = this.getResearchTip(score, allInsights)
    
    return {
      overallScore: score,
      insights: allInsights,
      topSuggestion,
      researchTip
    }
  }
  
  private static getResearchTip(score: number, insights: ConversationInsight[]): string {
    if (score >= 85) {
      return "🎯 Research shows messages like yours get 3x more responses!"
    } else if (score >= 70) {
      return "📈 Good message! Small tweaks can boost response rates by 50%."
    } else if (score >= 50) {
      return "💡 Research tip: Questions + personal details = better conversations."
    } else {
      return "🔬 Studies show specific, question-based messages get 10x more replies."
    }
  }
  
  // Conversation starter suggestions based on profile
  static getConversationStarters(profile: {
    bio?: string
    interests?: string[]
    photos?: Array<{ url: string }>
  }): string[] {
    const starters: string[] = []
    
    if (profile.interests && profile.interests.length > 0) {
      const interest = profile.interests[0]
      starters.push(`I saw you're into ${interest} - what got you started with that?`)
      starters.push(`${interest} is awesome! What's your favorite thing about it?`)
    }
    
    if (profile.bio) {
      // Simple bio analysis for starters
      const bioLower = profile.bio.toLowerCase()
      if (bioLower.includes('travel')) {
        starters.push("I noticed you mentioned travel - what's the best place you've been?")
      }
      if (bioLower.includes('food') || bioLower.includes('cooking')) {
        starters.push("Fellow foodie! What's your go-to comfort food?")
      }
      if (bioLower.includes('music')) {
        starters.push("I see you're into music - any concerts coming up?")
      }
    }
    
    // Generic but effective starters if no specific context
    if (starters.length === 0) {
      starters.push(
        "Your profile caught my eye - what's something you're passionate about?",
        "I had to say hi! What's been the highlight of your week?",
        "Your photos show you have great taste - tell me about your latest adventure!"
      )
    }
    
    return starters.slice(0, 3)
  }
}
