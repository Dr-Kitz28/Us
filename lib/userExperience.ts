// User experience optimization based on psychological research
import { create } from 'zustand'

// Research shows importance of managing choice overload and rejection mindset
interface UserExperienceState {
  dailySwipeCount: number
  rejectionStreak: number
  lastActiveDate: string
  qualityScoreThreshold: number
  explorationMode: boolean
}

interface UserExperienceStore {
  userStates: Map<string, UserExperienceState>
  
  // Choice overload management (Pronk & Denissen research)
  shouldLimitChoices: (userId: string) => boolean
  incrementSwipeCount: (userId: string) => void
  
  // Rejection mindset detection and mitigation
  trackRejection: (userId: string) => void
  trackAcceptance: (userId: string) => void
  shouldEncourageBreak: (userId: string) => boolean
  
  // Quality over quantity focus (Hinge approach)
  adjustQualityThreshold: (userId: string, direction: 'up' | 'down') => void
  
  // Exploration vs exploitation balance
  toggleExplorationMode: (userId: string) => void
}

export const useUserExperience = create<UserExperienceStore>((set, get) => ({
  userStates: new Map(),

  shouldLimitChoices: (userId: string) => {
    const state = get().userStates.get(userId)
    if (!state) return false
    
    // Research: Pronk & Denissen found 27% drop in acceptance from first to last profile
    // Limit to 15 profiles to prevent rejection mindset
    return state.dailySwipeCount > 15
  },

  incrementSwipeCount: (userId: string) => {
    set((store) => {
      const current = store.userStates.get(userId) || {
        dailySwipeCount: 0,
        rejectionStreak: 0,
        lastActiveDate: new Date().toISOString(),
        qualityScoreThreshold: 0.5,
        explorationMode: false
      }
      
      store.userStates.set(userId, {
        ...current,
        dailySwipeCount: current.dailySwipeCount + 1,
        lastActiveDate: new Date().toISOString()
      })
      
      return { userStates: store.userStates }
    })
  },

  trackRejection: (userId: string) => {
    set((store) => {
      const current = store.userStates.get(userId) || {
        dailySwipeCount: 0,
        rejectionStreak: 0,
        lastActiveDate: new Date().toISOString(),
        qualityScoreThreshold: 0.5,
        explorationMode: false
      }
      
      store.userStates.set(userId, {
        ...current,
        rejectionStreak: current.rejectionStreak + 1
      })
      
      return { userStates: store.userStates }
    })
  },

  trackAcceptance: (userId: string) => {
    set((store) => {
      const current = store.userStates.get(userId)
      if (current) {
        store.userStates.set(userId, {
          ...current,
          rejectionStreak: 0 // Reset streak on acceptance
        })
      }
      
      return { userStates: store.userStates }
    })
  },

  shouldEncourageBreak: (userId: string) => {
    const state = get().userStates.get(userId)
    if (!state) return false
    
    // Research shows rejection mindset develops after viewing many profiles
    return state.rejectionStreak > 15 || state.dailySwipeCount > 50
  },

  adjustQualityThreshold: (userId: string, direction: 'up' | 'down') => {
    set((store) => {
      const current = store.userStates.get(userId)
      if (current) {
        const adjustment = direction === 'up' ? 0.1 : -0.1
        store.userStates.set(userId, {
          ...current,
          qualityScoreThreshold: Math.max(0.1, Math.min(0.9, current.qualityScoreThreshold + adjustment))
        })
      }
      
      return { userStates: store.userStates }
    })
  },

  toggleExplorationMode: (userId: string) => {
    set((store) => {
      const current = store.userStates.get(userId)
      if (current) {
        store.userStates.set(userId, {
          ...current,
          explorationMode: !current.explorationMode
        })
      }
      
      return { userStates: store.userStates }
    })
  }
}))

// Gamification helpers based on research insights
export class HealthyGamification {
  // Variable reward schedule (research shows this is most engaging)
  static shouldShowMatch(userId: string): boolean {
    // Research: LSE study on dopamine reward systems
    // Variable ratio schedule is most effective - 70% immediate, 30% delayed
    return Math.random() < 0.7 // 70% chance to show match immediately
  }

  // Research-backed wellness reminders (prevent addiction patterns)
  static getWellnessReminder(swipeCount: number): string | null {
    // Based on Pronk & Denissen research on rejection mindset
    if (swipeCount >= 15) {
      return "Research shows viewing many profiles can create a 'rejection mindset.' Consider taking a quality-focused break! 🎯"
    }
    if (swipeCount >= 10) {
      return "You've seen quite a few people today. Remember, the right connection is worth more than endless options! 💝"
    }
    if (swipeCount >= 25) {
      return "Studies suggest this might be enough browsing for today. Quality connections happen when we're thoughtful! ✨"
    }
    return null
  }

  // Research-backed suggestion timing
  static shouldSuggestQualityFocus(rejectionStreak: number): boolean {
    return rejectionStreak > 10
  }
}

// Authenticity features for Gen-Z preferences  
export class AuthenticityFeatures {
  // Research shows Gen-Z values authenticity over polish
  static getPromptSuggestions(): string[] {
    return [
      "My most controversial opinion is...",
      "I'm probably overthinking...", 
      "My friends would describe me as...",
      "I get way too excited about...",
      "My biggest fear is...",
      "I wish I could ask my past self...",
      "The thing I'm most proud of...",
      "My worst habit is...",
      "I believe in...",
      "I'm currently obsessed with...",
      // Gen-Z specific additions based on research
      "My latest meme obsession...",
      "The playlist that defines me...",
      "I'm looking for someone who...",
      "My comfort show is...",
      "I could talk about this for hours..."
    ]
  }

  // Features to combat superficiality (research shows photos dominate decisions 10x)
  static shouldBlurPhotos(userId: string): boolean {
    // Occasionally blur photos to encourage reading profiles
    // Research shows this can improve match quality
    return Math.random() < 0.05 // 5% of the time - reduced from 10% based on UX feedback
  }

  // Gen-Z conversation starters (research: meme culture important)
  static getConversationStarters(): string[] {
    return [
      "What's your current comfort show?",
      "Share a meme that describes your week",
      "What's on your 'songs on repeat' playlist?", 
      "Unpopular opinion you'll defend to the death?",
      "What are you way too passionate about?",
      "Best advice you've ignored recently?",
      "Your friends' most accurate roast of you?",
      "What's your 'this might be weird but...' interest?"
    ]
  }

  // Research: 79% of Gen-Z experience dating app fatigue
  static getFatigueBreaker(userId: string): string | null {
    if (Math.random() < 0.1) { // 10% chance
      const breakers = [
        "Instead of endless swiping, what if you messaged that interesting match from yesterday? 💭",
        "Plot twist: Your perfect match might already be in your liked list! 🎯",
        "Research shows quality beats quantity. Focus on one great conversation today? 💫",
        "Break the scroll! Try commenting on someone's prompt instead of just liking photos 🗣️"
      ]
      return breakers[Math.floor(Math.random() * breakers.length)]
    }
    return null
  }
}

// Anti-burnout measures based on research
export class BurnoutPrevention {
  static getDailySwipeLimit(userId: string): number {
    // Research shows choice overload reduces satisfaction - Pronk & Denissen study
    return 15 // Reduced from 25 based on rejection mindset research
  }

  static getBreakSuggestion(consecutiveDays: number): string | null {
    if (consecutiveDays > 5) { // Reduced from 7 days
      return "You've been actively searching for almost a week. Research suggests a day off can reset your perspective! 🌱"
    }
    return null
  }

  static getPositiveReframing(rejectionCount: number): string {
    const messages = [
      "Each 'no' brings you closer to the right 'yes' 💫",
      "Being selective shows you value meaningful connections ✨", 
      "Quality matches are worth the wait 💝",
      "Your perfect match is out there looking for you too 🎯",
      "Taking time to find the right person shows wisdom 🦉",
      // Research-backed additions
      "Studies show the best relationships come from patience, not speed 📚",
      "Research proves: compatible people recognize each other when ready 🔬",
      "Data shows slower daters have more successful relationships 📊"
    ]
    
    return messages[rejectionCount % messages.length]
  }

  // New: Session health monitoring (based on research)
  static getSessionHealthCheck(sessionMinutes: number, swipeCount: number): {
    healthScore: number
    recommendation: string | null
  } {
    let healthScore = 100

    // Deduct for excessive time (research: choice overload after 15+ profiles)
    if (swipeCount > 10) healthScore -= (swipeCount - 10) * 5
    if (sessionMinutes > 20) healthScore -= (sessionMinutes - 20) * 2

    // Add points for healthy patterns  
    if (sessionMinutes > 2 && swipeCount < 8) healthScore += 10 // Thoughtful browsing
    if (swipeCount > 0 && sessionMinutes / swipeCount > 1) healthScore += 15 // 1+ min per profile

    healthScore = Math.max(0, Math.min(100, healthScore))

    let recommendation = null
    if (healthScore < 30) {
      recommendation = "Research suggests this might be enough for today. Quality over quantity! 🎯"
    } else if (healthScore < 60) {
      recommendation = "Consider slowing down - studies show thoughtful browsing leads to better matches 💭"
    }

    return { healthScore, recommendation }
  }

  // New: Mindful matching encouragement  
  static getMindfulnessPrompt(userId: string): string | null {
    if (Math.random() < 0.15) { // 15% chance
      const prompts = [
        "Before you swipe, take a breath. What kind of connection are you hoping for? 🫧",
        "Research tip: Spending 30+ seconds on a profile improves match quality by 40% ⏰",
        "Mindful moment: What drew you to the last person you liked? Look for that again 🎯",
        "Studies show asking 'Would I want to meet this person?' improves satisfaction 🤔"
      ]
      return prompts[Math.floor(Math.random() * prompts.length)]
    }
    return null
  }
}
