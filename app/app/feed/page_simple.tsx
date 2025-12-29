'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'

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

  useEffect(() => {
    if (session?.user?.email) {
      loadAvailableUsers()
    }
  }, [session])

  const loadAvailableUsers = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Get all users except the current user
      const response = await fetch('/api/recommendations')
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
      // Record the like
      await fetch('/api/likes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          likedUserEmail: currentUser.email
        })
      })

      // Move to next user
      setCurrentIndex(prev => prev + 1)
    } catch (error) {
      console.error('Error liking user:', error)
    }
  }

  const handlePass = () => {
    setCurrentIndex(prev => prev + 1)
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
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
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
            className="bg-blue-500 hover:bg-blue-600"
          >
            Start Over
          </Button>
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
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-blue-500 bg-clip-text text-transparent">
            Uz
          </h1>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span>Hi, {session.user?.name?.split(' ')[0] || 'there'}!</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-md mx-auto p-4">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Photo */}
          <div className="relative h-96 bg-gray-200">
            {currentUser.photos && currentUser.photos[0] ? (
              <img 
                src={currentUser.photos[0].url} 
                alt={currentUser.name}
                className="w-full h-full object-cover"
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

            {/* Action Buttons */}
            <div className="flex gap-4 justify-center">
              <Button
                onClick={handlePass}
                variant="outline"
                size="lg"
                className="flex-1 border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50"
              >
                Pass
              </Button>
              <Button
                onClick={handleLike}
                size="lg"
                className="flex-1 bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 text-white"
              >
                💖 Like
              </Button>
            </div>
          </div>
        </div>

        {/* Counter */}
        <div className="text-center mt-4 text-gray-600 text-sm">
          Showing {currentIndex + 1} of {availableUsers.length}
        </div>
      </div>
    </div>
  )
}
