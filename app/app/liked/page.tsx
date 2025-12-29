'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'

interface LikedUser {
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
  likedAt: string
  isMatch: boolean
  matchedAt?: string | null
  matchId?: string | null
}

export default function LikedPage() {
  const { data: session, status } = useSession()
  const [likedUsers, setLikedUsers] = useState<LikedUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (session?.user?.email) {
      loadLikedUsers()
    }
  }, [session])

  const loadLikedUsers = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/liked-users')
      const data = await response.json()
      
      if (data.success) {
        setLikedUsers(data.users)
      } else {
        setError(data.error || 'Failed to load liked users')
      }
    } catch (err) {
      console.error('Error loading liked users:', err)
      setError('Failed to connect to server')
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your liked profiles...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-blue-50 flex items-center justify-center">
        <p className="text-gray-600">Please log in to see your liked profiles</p>
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
          <Button onClick={loadLikedUsers} className="bg-blue-500 hover:bg-blue-600">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-blue-50" style={{ paddingBottom: '100px' }}>
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-md mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900 text-center">
            👍 People You've Liked
          </h1>
          <p className="text-gray-600 text-center text-sm mt-1">
            {likedUsers.length} profiles • {likedUsers.filter(u => u.isMatch).length} matches
          </p>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-md mx-auto p-4">
        {likedUsers.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">💔</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No likes yet</h2>
            <p className="text-gray-600 mb-6">
              Start swiping to find people you like!
            </p>
            <Button 
              onClick={() => window.location.href = '/app/feed'}
              className="bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600"
            >
              Start Swiping
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {likedUsers.map((user) => {
              const interests = user.profile?.interests 
                ? JSON.parse(user.profile.interests) 
                : []
              
              return (
                <div 
                  key={user.id} 
                  className={`bg-white rounded-xl shadow-lg overflow-hidden border-2 ${
                    user.isMatch ? 'border-pink-500' : 'border-transparent'
                  }`}
                >
                  <div className="flex">
                    {/* Photo */}
                    <div className="w-24 h-24 bg-gray-200 flex-shrink-0">
                      {user.photos && user.photos[0] ? (
                        <img 
                          src={user.photos[0].url} 
                          alt={user.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
                          <div className="text-2xl text-gray-400">
                            {user.name?.charAt(0) || '?'}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900">
                              {user.name}
                            </h3>
                            {user.profile?.age && (
                              <span className="text-gray-600">
                                {user.profile.age}
                              </span>
                            )}
                            {user.isMatch && (
                              <span className="bg-pink-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                                MATCH!
                              </span>
                            )}
                          </div>

                          {user.profile?.location && (
                            <p className="text-gray-600 text-sm mb-2">
                              📍 {user.profile.location}
                            </p>
                          )}

                          {user.profile?.bio && (
                            <p className="text-gray-700 text-sm mb-2 line-clamp-2">
                              {user.profile.bio}
                            </p>
                          )}

                          {interests.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-2">
                              {interests.slice(0, 3).map((interest: string, index: number) => (
                                <span
                                  key={index}
                                  className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs"
                                >
                                  {interest}
                                </span>
                              ))}
                              {interests.length > 3 && (
                                <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                                  +{interests.length - 3} more
                                </span>
                              )}
                            </div>
                          )}

                          <p className="text-gray-500 text-xs">
                            Liked {new Date(user.likedAt).toLocaleDateString()}
                            {user.isMatch && user.matchedAt && (
                              <span> • Matched {new Date(user.matchedAt).toLocaleDateString()}</span>
                            )}
                          </p>
                        </div>
                      </div>

                      {user.isMatch && (
                        <div className="mt-3">
                          <Button 
                            onClick={() => window.location.href = user.matchId ? `/app/messages?matchId=${user.matchId}` : '/app/messages'}
                            size="sm"
                            className="w-full bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600"
                          >
                            💬 Send Message
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
