'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
import { useUserExperience, HealthyGamification, AuthenticityFeatures } from '@/lib/userExperience'
import { isFeatureEnabled } from '@/lib/featureFlags'

export default function FeedPage() {
  const { data: session, status } = useSession()
  const [currentProfile, setCurrentProfile] = useState<any>(null)
  const [swipeCount, setSwipeCount] = useState(0)
  const [wellnessMessage, setWellnessMessage] = useState<string | null>(null)
  const { shouldLimitChoices, incrementSwipeCount, trackRejection, trackAcceptance, shouldEncourageBreak } = useUserExperience()

  // Check feature flags
  const qualityFocusEnabled = isFeatureEnabled('qualityOverQuantity')
  const burnoutPreventionEnabled = isFeatureEnabled('burnoutPrevention')
  const choiceProtectionEnabled = isFeatureEnabled('choiceOverloadProtection')

  useEffect(() => {
    if (session?.user?.email && qualityFocusEnabled) {
      // Fetch personalized matches from our research-backed API
      fetch(`/api/matches?userEmail=${encodeURIComponent(session.user.email)}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.matches.length > 0) {
            setCurrentProfile({
              ...data.matches[0],
              prompts: data.matches[0].prompts || [
                { question: "I'm probably overthinking...", answer: "Whether pineapple belongs on pizza (it doesn't)" },
                { question: "My friends would describe me as...", answer: "The one who always has snacks and terrible jokes" },
                { question: "I get way too excited about...", answer: "Finding a new hiking trail or the perfect coffee shop" }
              ]
            })
          }
        })
        .catch(console.error)
    }
  }, [session, qualityFocusEnabled])

  useEffect(() => {
    if (burnoutPreventionEnabled) {
      const message = HealthyGamification.getWellnessReminder(swipeCount)
      setWellnessMessage(message)
    }
  }, [swipeCount, burnoutPreventionEnabled])

  const handleSwipe = (direction: 'like' | 'pass') => {
    if (!session?.user?.email) return

    const userId = session.user.email // Use email as user identifier
    incrementSwipeCount(userId)
    setSwipeCount(prev => prev + 1)

    if (direction === 'like') {
      trackAcceptance(userId)
      // Show match animation if enabled
      if (HealthyGamification.shouldShowMatch(userId)) {
        alert('It\'s a Match! 🎉')
      }
    } else {
      trackRejection(userId)
    }

    // Check for choice overload protection
    if (choiceProtectionEnabled && shouldLimitChoices(userId)) {
      setCurrentProfile(null)
      setWellnessMessage("You've seen enough profiles for today. Quality over quantity! 💝")
      return
    }

    // Check for burnout prevention
    if (burnoutPreventionEnabled && shouldEncourageBreak(userId)) {
      setCurrentProfile(null)
      setWellnessMessage("Take a breather! The right person is worth waiting for. ✨")
      return
    }

    // Load next profile (in real app, this would fetch from algorithm)
    setCurrentProfile(null)
  }

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading your personalized matches...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Not signed in</h1>
          <p className="text-muted-foreground">Please sign in to continue</p>
          <Button onClick={() => window.location.href = '/login'}>
            Go to Login
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-white sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-bold text-primary">Uz</h1>
          <nav className="flex items-center gap-4">
            <a href="/app/matches" className="text-sm hover:text-primary">Matches</a>
            <a href="/app/profile" className="text-sm hover:text-primary">Profile</a>
            <Avatar src={null} fallback={session.user?.name?.[0] ?? '👤'} size={32} />
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          {wellnessMessage && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-center">
              <p className="text-blue-800 font-medium">{wellnessMessage}</p>
              {shouldEncourageBreak(session.user?.email || '') && (
                <Button 
                  variant="outline" 
                  className="mt-3" 
                  onClick={() => setWellnessMessage(null)}
                >
                  I'll take a break
                </Button>
              )}
            </div>
          )}

          {currentProfile ? (
            <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-6">
              {/* Profile Image */}
              <div className="aspect-[3/4] bg-gradient-to-br from-pink-300 to-purple-400 flex items-center justify-center">
                <div className="text-white text-center">
                  <div className="text-6xl mb-4">👤</div>
                  <p className="text-lg font-medium">{currentProfile.name}</p>
                  <p className="text-sm opacity-90">Age {currentProfile.age} • {currentProfile.distance}</p>
                </div>
              </div>
              
              {/* Profile Content */}
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-2">{currentProfile.name}</h3>
                <p className="text-gray-600 mb-4">{currentProfile.bio}</p>

                {/* Authenticity Prompts (Research-backed) */}
                {isFeatureEnabled('authenticityPrompts') && currentProfile.prompts && (
                  <div className="space-y-3 mb-4">
                    {currentProfile.prompts.map((prompt: any, idx: number) => (
                      <div key={idx} className="bg-gray-50 rounded-lg p-3">
                        <p className="text-sm font-medium text-gray-700 mb-1">{prompt.question}</p>
                        <p className="text-gray-900">{prompt.answer}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => handleSwipe('pass')}
                  >
                    👎 Pass
                  </Button>
                  <Button 
                    className="flex-1"
                    onClick={() => handleSwipe('like')}
                  >
                    ❤️ Like
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            /* Enhanced Empty State */
            <div className="text-center py-16">
              <div className="text-6xl mb-6">💝</div>
              <h3 className="text-xl font-semibold mb-2">
                {swipeCount > 0 ? "That's enough for now!" : "No one new around you"}
              </h3>
              <p className="text-muted-foreground mb-6">
                {swipeCount > 0 
                  ? "Quality connections are worth taking time to find. Check back later for more personalized matches!" 
                  : "We're working hard to find you amazing people nearby using our advanced matching algorithms."
                }
              </p>
              <Button onClick={() => window.location.reload()}>
                {swipeCount > 0 ? "Check back later" : "Check again"}
              </Button>
              
              {/* Research Credit */}
              <div className="mt-8 text-xs text-gray-500">
                <p>✨ Powered by research-backed algorithms</p>
                <p>Quality over quantity • Stable matching • Anti-burnout features</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
