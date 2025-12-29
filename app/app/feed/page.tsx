'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
import { useUserExperience, HealthyGamification, BurnoutPrevention, AuthenticityFeatures } from '@/lib/userExperience'
import { AdvancedAnalytics } from '@/lib/advancedAnalytics'
import { ProfileQualityAnalyzer } from '@/lib/profileQuality'

interface User {
  id: string
  name: string
  email: string
  profile?: {
    age?: number
    bio?: string
    location?: string
    interests?: string
  }
  photos: Array<{ url: string }>
}

export default function FeedPage() {
  const { data: session, status } = useSession()
  const [availableUsers, setAvailableUsers] = useState<User[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [matchNotification, setMatchNotification] = useState<{
    show: boolean
    userName: string
  } | null>(null)
  const [matchCount, setMatchCount] = useState(0)

  // Research-backed UX tracking
  const userExperience = useUserExperience()
  const [swipeCount, setSwipeCount] = useState(0)
  const [sessionStartTime] = useState(Date.now())
  const [sessionId] = useState(() => AdvancedAnalytics.startSession(session?.user?.email || 'anonymous'))
  const [wellnessAlert, setWellnessAlert] = useState<string | null>(null)
  const [showQualityPrompt, setShowQualityPrompt] = useState(false)
  const [profileViewStartTime, setProfileViewStartTime] = useState(Date.now())
  
  // Research-backed profile quality insights
  const [profileInsights, setProfileInsights] = useState<{
    score: number
    insight: string
    tips: string[]
  } | null>(null)
  const [showProfileTip, setShowProfileTip] = useState(false)

  // Touch/swipe handling - MUST be at the top before any conditional logic
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null)
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null)
  const [swipeOffset, setSwipeOffset] = useState(0)
  
  // Mouse drag handling for desktop
  const [mouseDown, setMouseDown] = useState(false)
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragTimeout, setDragTimeout] = useState<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (session?.user?.email) {
      loadAvailableUsers()
      loadMatchCount()
      analyzeUserProfile()
    }
  }, [session])

  // Track profile view time for analytics
  useEffect(() => {
    setProfileViewStartTime(Date.now())
  }, [currentIndex])

  const loadMatchCount = async () => {
    try {
      const response = await fetch('/api/user-matches')
      const data = await response.json()
      if (data.success) {
        setMatchCount(data.count)
      }
    } catch (error) {
      console.error('Error loading match count:', error)
    }
  }

  const analyzeUserProfile = async () => {
    try {
      // Get current user's profile data
      const response = await fetch('/api/user-profile')
      const data = await response.json()
      
      if (data.success && data.user) {
        const profile = {
          photos: data.user.photos || [],
          bio: data.user.profile?.bio || null,
          interests: data.user.profile?.interests || null
        }
        
        // Analyze profile quality
        const analysis = ProfileQualityAnalyzer.analyzeProfile(profile)
        
        // Get personalized tips based on user behavior
        const swipeHistoryResponse = await fetch('/api/swipe-history')
        const swipeData = await swipeHistoryResponse.json()
        
        if (swipeData.success) {
          const tips = ProfileQualityAnalyzer.getPersonalizedTips(
            session?.user?.email || '',
            swipeData.history
          )
          
          setProfileInsights({
            score: analysis.overallScore,
            insight: analysis.researchInsight,
            tips: tips.concat(analysis.topSuggestions.map(s => s.suggestion))
          })
          
          // Show profile tip after a short delay if score is low
          if (analysis.overallScore < 70) {
            setTimeout(() => {
              setShowProfileTip(true)
            }, 10000) // Show after 10 seconds of browsing
          }
        }
      }
    } catch (error) {
      console.error('Error analyzing profile:', error)
    }
  }

  const loadAvailableUsers = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Research-backed choice overload protection
      const userId = session?.user?.email
      if (userId && userExperience.shouldLimitChoices(userId)) {
        // Show choice overload intervention
        setWellnessAlert("Research shows limiting choices leads to better decisions. You've seen enough for today! 🎯")
        setTimeout(() => setWellnessAlert(null), 8000)
        setAvailableUsers([])
        setLoading(false)
        return
      }
      
      // Get all users except the current user using enhanced recommendations
      const response = await fetch('/api/enhanced-recommendations?advanced=true&limit=20')
      const data = await response.json()
      
      if (data.success && data.users) {
        // Filter out current user if somehow included
        const filteredUsers = data.users.filter((user: User) => 
          user.email !== session?.user?.email
        )
        setAvailableUsers(filteredUsers)
        
        if (filteredUsers.length === 0) {
          setError('No users available to show. Try seeding the database first!')
        }
      } else {
        setError(data.error || 'Failed to load users')
      }
    } catch (err) {
      console.error('Error loading users:', err)
      setError('Failed to connect to server')
    } finally {
      setLoading(false)
    }
  }

  const handleLike = async () => {
    const currentUser = availableUsers[currentIndex]
    if (!currentUser || !session?.user?.email) return

    try {
      // Research-backed UX tracking
      const userId = session.user.email!
      const timeSpent = Date.now() - profileViewStartTime
      
      setSwipeCount(prev => prev + 1)
      userExperience.incrementSwipeCount(userId)
      userExperience.trackAcceptance(userId)
      
      // Advanced analytics tracking
      AdvancedAnalytics.recordSwipe(sessionId, 'like', timeSpent)

      // Check for wellness reminders
      const wellness = HealthyGamification.getWellnessReminder(swipeCount + 1)
      if (wellness) {
        setWellnessAlert(wellness)
        AdvancedAnalytics.recordWellnessIntervention(sessionId, 'wellness')
        setTimeout(() => setWellnessAlert(null), 6000)
      }

      // Record the like
      const response = await fetch('/api/likes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          likedUserEmail: currentUser.email
        })
      })

      const result = await response.json()
      
      // Check if it's a match - but use variable reward schedule
      if (result.isMatch && HealthyGamification.shouldShowMatch(userId)) {
        setMatchNotification({
          show: true,
          userName: currentUser.name
        })
        AdvancedAnalytics.recordMatch(sessionId)
        // Hide notification after 5 seconds
        setTimeout(() => {
          setMatchNotification(null)
        }, 5000)
        // Update match count
        loadMatchCount()
      } else if (result.isMatch) {
        // Match exists but delayed - just update count
        AdvancedAnalytics.recordMatch(sessionId)
        loadMatchCount()
      }

      // Move to next user
      setCurrentIndex(prev => prev + 1)
    } catch (error) {
      console.error('Error liking user:', error)
    }
  }

  const handlePass = async () => {
    const currentUser = availableUsers[currentIndex]
    if (!currentUser || !session?.user?.email) return

    try {
      // Research-backed UX tracking
      const userId = session.user.email!
      const timeSpent = Date.now() - profileViewStartTime
      
      setSwipeCount(prev => prev + 1)
      userExperience.incrementSwipeCount(userId)
      userExperience.trackRejection(userId)
      
      // Advanced analytics tracking
      AdvancedAnalytics.recordSwipe(sessionId, 'pass', timeSpent)

      // Check for wellness interventions
      const wellness = HealthyGamification.getWellnessReminder(swipeCount + 1)
      if (wellness) {
        setWellnessAlert(wellness)
        AdvancedAnalytics.recordWellnessIntervention(sessionId, 'wellness')
        setTimeout(() => setWellnessAlert(null), 6000)
      }

      // Check if should suggest quality focus
      const rejectionStreak = userExperience.userStates.get(userId)?.rejectionStreak || 0
      if (HealthyGamification.shouldSuggestQualityFocus(rejectionStreak)) {
        setShowQualityPrompt(true)
        AdvancedAnalytics.recordWellnessIntervention(sessionId, 'quality')
        setTimeout(() => setShowQualityPrompt(false), 8000)
      }

      // Record the pass
      await fetch('/api/passes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          passedUserEmail: currentUser.email
        })
      })

      // Move to next user
      setCurrentIndex(prev => prev + 1)
    } catch (error) {
      console.error('Error passing user:', error)
      // Still move to next user even if error
      setCurrentIndex(prev => prev + 1)
    }
  }

  // Touch/swipe handling functions
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    })
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStart) return
    
    const currentTouch = {
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    }
    
    const deltaX = currentTouch.x - touchStart.x
    setSwipeOffset(deltaX)
    setTouchEnd(currentTouch)
  }

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return

    const deltaX = touchEnd.x - touchStart.x
    const deltaY = touchEnd.y - touchStart.y
    const absDeltaX = Math.abs(deltaX)
    const absDeltaY = Math.abs(deltaY)

    // Only process horizontal swipes - made more sensitive
    if (absDeltaX > absDeltaY && absDeltaX > 30) {
      if (deltaX > 0) {
        // Right swipe - like
        handleLike()
      } else {
        // Left swipe - pass
        handlePass()
      }
    }

    // Reset swipe state
    setTouchStart(null)
    setTouchEnd(null)
    setSwipeOffset(0)
  }

  // Mouse drag handlers for desktop with global event listeners and delay
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    console.log('Mouse down detected')
    
    setMouseDown(true)
    const startPos = {
      x: e.clientX,
      y: e.clientY
    }
    setDragStart(startPos)
    setSwipeOffset(0)

    // Set a timeout to start dragging after 100ms (hold detection)
    const timeout = setTimeout(() => {
      setIsDragging(true)
      console.log('Drag mode activated after delay')
    }, 100)
    setDragTimeout(timeout)

    // Add global event listeners for mouse move and up
    const handleGlobalMouseMove = (globalE: MouseEvent) => {
      if (!startPos) return
      
      const deltaX = globalE.clientX - startPos.x
      const deltaY = globalE.clientY - startPos.y
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
      
      // If user moves more than 5px immediately, start dragging (fast swipe detection)
      if (distance > 5 && !isDragging) {
        clearTimeout(timeout)
        setIsDragging(true)
        console.log('Fast swipe detected, activating drag')
      }
      
      // Only update visual feedback if we're in drag mode
      if (isDragging || distance > 5) {
        console.log('Global mouse move delta:', deltaX)
        setSwipeOffset(deltaX)
      }
    }

    const handleGlobalMouseUp = (globalE: MouseEvent) => {
      if (!startPos) return
      
      clearTimeout(timeout)
      
      const deltaX = globalE.clientX - startPos.x
      const deltaY = globalE.clientY - startPos.y
      const absDeltaX = Math.abs(deltaX)
      const absDeltaY = Math.abs(deltaY)

      console.log('Global mouse up - deltaX:', deltaX, 'absDeltaX:', absDeltaX, 'isDragging:', isDragging)

      // Only process swipes if we were dragging or it's a fast swipe
      if ((isDragging || absDeltaX > 5) && absDeltaX > absDeltaY && absDeltaX > 15) {
        if (deltaX > 0) {
          // Right drag - like
          console.log('Right swipe - liking')
          handleLike()
        } else {
          // Left drag - pass
          console.log('Left swipe - passing')
          handlePass()
        }
      }

      // Reset all drag state
      setMouseDown(false)
      setDragStart(null)
      setSwipeOffset(0)
      setIsDragging(false)
      setDragTimeout(null)

      // Remove global event listeners
      document.removeEventListener('mousemove', handleGlobalMouseMove)
      document.removeEventListener('mouseup', handleGlobalMouseUp)
    }

    // Add global event listeners
    document.addEventListener('mousemove', handleGlobalMouseMove)
    document.addEventListener('mouseup', handleGlobalMouseUp)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    // This is now handled by global event listener
  }

  const handleMouseUp = (e: React.MouseEvent) => {
    // This is now handled by global event listener
  }

  const handleMouseLeave = () => {
    // Reset drag state when mouse leaves the card
    console.log('Mouse left the card')
    setMouseDown(false)
    setDragStart(null)
    setSwipeOffset(0)
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading amazing people...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-blue-50 flex items-center justify-center">
        <p className="text-gray-600">Please log in to see recommendations</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-blue-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-6xl mb-4">😕</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Oops!</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="space-y-2">
            <Button onClick={loadAvailableUsers} className="bg-blue-500 hover:bg-blue-600">
              Try Again
            </Button>
            <br />
            <Button 
              onClick={() => window.open('/admin', '_blank')} 
              variant="outline"
              className="text-sm"
            >
              🛠️ Go to Admin Panel
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (currentIndex >= availableUsers.length) {
    // Show "no more users" message but stay on feed
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-blue-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-md mx-auto px-4 py-4 text-center">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-blue-500 bg-clip-text text-transparent">
              Uz
            </h1>
            <p className="text-gray-600 text-sm mt-1">
              You've seen everyone available!
            </p>
          </div>
        </header>

        {/* No more users message */}
        <div className="flex items-center justify-center" style={{ height: 'calc(100vh - 80px - 80px)' }}>
          <div className="text-center max-w-sm mx-auto p-6">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              You've seen everyone!
            </h2>
            <p className="text-gray-600 mb-6">
              Check back later for new people, or try adjusting your preferences.
            </p>
            <Button 
              onClick={() => {
                setCurrentIndex(0)
                loadAvailableUsers()
              }}
              className="bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 mb-3"
            >
              Start Over
            </Button>
            <div className="text-sm text-gray-500">
              You can also check your <a href="/app/liked" className="text-pink-600 underline">Liked</a> profiles or <a href="/app/recycle-bin" className="text-pink-600 underline">Recycle Bin</a>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const currentUser = availableUsers[currentIndex]
  const interests = currentUser.profile?.interests 
    ? JSON.parse(currentUser.profile.interests) 
    : []

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-blue-50">
      {/* Match Notification Overlay */}
      {matchNotification?.show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full mx-auto text-center shadow-2xl">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">It's a Match!</h2>
            <p className="text-gray-600 mb-6">
              You and <span className="font-semibold text-pink-600">{matchNotification.userName}</span> liked each other!
            </p>
            <div className="space-y-3">
              <Button 
                onClick={() => {
                  setMatchNotification(null)
                  window.location.href = '/app/matches'
                }}
                className="w-full bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600"
              >
                💬 Send a Message
              </Button>
              <Button 
                onClick={() => setMatchNotification(null)}
                variant="outline"
                className="w-full"
              >
                Keep Swiping
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Wellness Alert Overlay - Research-backed intervention */}
      {wellnessAlert && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6 max-w-sm w-full mx-auto text-center shadow-2xl border border-blue-200">
            <div className="text-4xl mb-3">💝</div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Taking care of you</h3>
            <p className="text-gray-700 text-sm leading-relaxed mb-4">
              {wellnessAlert}
            </p>
            <div className="flex gap-2">
              <Button 
                onClick={() => setWellnessAlert(null)}
                variant="outline"
                size="sm"
                className="flex-1 text-xs"
              >
                Got it
              </Button>
              <Button 
                onClick={() => {
                  setWellnessAlert(null)
                  window.location.href = '/app/profile'
                }}
                size="sm"
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-xs"
              >
                Take a break
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Quality Focus Prompt - Research-backed suggestion */}
      {showQualityPrompt && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 max-w-sm w-full mx-auto text-center shadow-2xl border border-green-200">
            <div className="text-4xl mb-3">🎯</div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Quality over Quantity</h3>
            <p className="text-gray-700 text-sm leading-relaxed mb-4">
              You've been quick to pass lately. Research shows slowing down and looking deeper leads to better matches! 
            </p>
            <div className="flex gap-2">
              <Button 
                onClick={() => setShowQualityPrompt(false)}
                variant="outline"
                size="sm"
                className="flex-1 text-xs"
              >
                Continue
              </Button>
              <Button 
                onClick={() => {
                  setShowQualityPrompt(false)
                  // Could implement slow-down mode here
                }}
                size="sm"
                className="flex-1 bg-green-500 hover:bg-green-600 text-xs"
              >
                Slow down
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-md mx-auto px-4 py-4 text-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-blue-500 bg-clip-text text-transparent">
            Uz
          </h1>
          <p className="text-gray-600 text-sm mt-1">
            Click and drag to decide
          </p>
          
          {/* Research-backed session awareness */}
          {session?.user?.email && (
            <div className="flex justify-center items-center gap-4 mt-2 text-xs text-gray-500">
              <span className={`px-2 py-1 rounded-full ${
                swipeCount < 20 
                  ? 'bg-green-100 text-green-700' 
                  : swipeCount < 40 
                  ? 'bg-yellow-100 text-yellow-700' 
                  : 'bg-red-100 text-red-700'
              }`}>
                {swipeCount < 20 
                  ? `${swipeCount} views` 
                  : swipeCount < 40 
                  ? `${swipeCount} views - Consider quality` 
                  : `${swipeCount} views - Take a break?`
                }
              </span>
              <span className="text-gray-400">
                ⏱️ {Math.floor((Date.now() - sessionStartTime) / 60000)}min
              </span>
            </div>
          )}
        </div>
      </header>

      {/* Personalized Research-backed Insights */}
      {session?.user?.email && swipeCount > 10 && swipeCount % 8 === 0 && (
        <div className="max-w-md mx-auto px-4 py-2">
          <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-lg p-3 mb-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">📊</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-indigo-800">Personal Insight</p>
                <p className="text-xs text-indigo-600">
                  {(() => {
                    const userId = session.user.email!
                    const insight = AdvancedAnalytics.getWellnessInsight(userId)
                    const recommendation = AdvancedAnalytics.getPersonalizedRecommendation(userId)
                    
                    if (insight) return insight
                    if (recommendation) return `${recommendation.icon} ${recommendation.message}`
                    return "You're doing great! Quality connections take time to find. 💫"
                  })()}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-md mx-auto p-4" style={{ paddingBottom: '100px' }}>
        <div 
          className="bg-white rounded-2xl shadow-xl overflow-hidden cursor-pointer select-none"
          style={{
            transform: `translateX(${swipeOffset * 0.5}px) rotate(${swipeOffset * 0.1}deg)`,
            cursor: isDragging ? 'grabbing' : (mouseDown ? 'grab' : 'pointer'),
            transition: swipeOffset === 0 ? 'transform 0.3s ease-out' : 'none'
          }}
          draggable={false}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
        >
          {/* Photo */}
          <div className="relative h-96 bg-gray-200">
            {/* Swipe indicators - appear sooner */}
            {swipeOffset !== 0 && (
              <div className="absolute inset-0 flex items-center justify-center z-10">
                {swipeOffset > 20 && (
                  <div className="bg-green-500 text-white px-6 py-3 rounded-full font-bold text-lg shadow-lg transform rotate-12 animate-pulse">
                    LIKE 💚
                  </div>
                )}
                {swipeOffset < -20 && (
                  <div className="bg-red-500 text-white px-6 py-3 rounded-full font-bold text-lg shadow-lg transform -rotate-12 animate-pulse">
                    PASS ❌
                  </div>
                )}
              </div>
            )}

            {currentUser.photos && currentUser.photos[0] ? (
              <img 
                src={currentUser.photos[0].url} 
                alt={currentUser.name}
                className="w-full h-full object-cover"
                draggable={false}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
                <div className="text-6xl text-gray-400">
                  {currentUser.name?.charAt(0) || '?'}
                </div>
              </div>
            )}
            
            {/* Progress indicator */}
            <div className="absolute top-4 left-4 right-4">
              <div className="flex gap-1">
                {availableUsers.map((_, index) => (
                  <div
                    key={index}
                    className={`h-1 flex-1 rounded-full ${
                      index <= currentIndex ? 'bg-white' : 'bg-white/30'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* User Info */}
          <div className="p-6">
            <div className="flex items-center gap-2 mb-3">
              <h2 className="text-2xl font-bold text-gray-900">
                {currentUser.name}
              </h2>
              {currentUser.profile?.age && (
                <span className="text-xl text-gray-600">
                  {currentUser.profile.age}
                </span>
              )}
            </div>

            {currentUser.profile?.location && (
              <p className="text-gray-600 mb-3 flex items-center gap-1">
                📍 {currentUser.profile.location}
              </p>
            )}

            {currentUser.profile?.bio && (
              <p className="text-gray-700 mb-4 leading-relaxed">
                {currentUser.profile.bio}
              </p>
            )}

            {interests.length > 0 && (
              <div className="mb-6">
                <p className="text-sm font-semibold text-gray-700 mb-2">Interests</p>
                <div className="flex flex-wrap gap-2">
                  {interests.map((interest: string, index: number) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Research-backed Authenticity Features */}
            {Math.random() < 0.3 && (
              <div className="mb-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                <p className="text-sm font-medium text-purple-700 mb-2">💭 Conversation Starter</p>
                <p className="text-sm text-purple-600 italic">
                  {AuthenticityFeatures.getPromptSuggestions()[Math.floor(Math.random() * 10)]}
                </p>
                <p className="text-xs text-purple-500 mt-1">Research shows deeper questions lead to better connections</p>
              </div>
            )}

            {/* Slow-down reminder for quality focus */}
            {swipeCount > 15 && Math.random() < 0.2 && (
              <div className="mb-4 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                <p className="text-sm text-green-700 flex items-center gap-2">
                  <span className="text-base">🐌</span>
                  <span>Take a moment to really consider this person</span>
                </p>
                <p className="text-xs text-green-600 mt-1">Quality connections happen when we slow down</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4 justify-center" style={{ display: 'none' }}>
              <Button
                onClick={handlePass}
                variant="outline"
                size="lg"
                className="flex-1 border-2 border-red-300 hover:border-red-400 hover:bg-red-50 text-red-600 hover:text-red-700"
              >
                ❌ Pass
              </Button>
              <Button
                onClick={handleLike}
                size="lg"
                className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
              >
                � Like
              </Button>
            </div>

            {/* Swipe Instructions */}
            <div className="text-center mt-6 text-gray-600">
              <div className="text-lg font-medium mb-2">Click and drag to decide</div>
              <div className="flex justify-center items-center gap-6 text-sm">
                <div className="flex items-center gap-2 text-red-600">
                  <span className="text-lg">👈</span>
                  <span>Swipe left to pass</span>
                </div>
                <div className="flex items-center gap-2 text-green-600">
                  <span>Swipe right to like</span>
                  <span className="text-lg">👉</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Counter */}
        <div className="text-center mt-4 text-gray-600 text-sm">
          Showing {currentIndex + 1} of {availableUsers.length}
        </div>
        
        {/* Profile Quality Insights - Research-backed tips */}
        {profileInsights && (
          <div className="mt-6 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">📊</span>
              <h3 className="font-semibold text-blue-900">Your Profile Score: {profileInsights.score}/100</h3>
            </div>
            <p className="text-sm text-blue-700 mb-3">{profileInsights.insight}</p>
            {profileInsights.tips.length > 0 && (
              <div className="text-xs text-blue-600">
                <strong>Quick tip:</strong> {profileInsights.tips[0]}
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Profile Improvement Modal */}
      {showProfileTip && profileInsights && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full">
            <div className="text-center mb-4">
              <div className="text-4xl mb-2">🚀</div>
              <h2 className="text-xl font-bold text-gray-900">Boost Your Matches!</h2>
            </div>
            
            <div className="space-y-3 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {profileInsights.score}/100
                </div>
                <div className="text-sm text-gray-600">Profile Quality Score</div>
              </div>
              
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">{profileInsights.insight}</p>
              </div>
              
              {profileInsights.tips.slice(0, 2).map((tip, index) => (
                <div key={index} className="flex items-start gap-2 text-sm">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span className="text-gray-700">{tip}</span>
                </div>
              ))}
            </div>
            
            <div className="flex gap-3">
              <Button
                onClick={() => setShowProfileTip(false)}
                variant="outline"
                className="flex-1"
              >
                Later
              </Button>
              <Button
                onClick={() => {
                  setShowProfileTip(false)
                  // In a real app, would navigate to profile edit page
                  window.open('/app/profile', '_blank')
                }}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                Improve Now
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
