'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'

interface PassedUser {
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
  passedAt: string
}

export default function RecycleBinPage() {
  const { data: session, status } = useSession()
  const [passedUsers, setPassedUsers] = useState<PassedUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (session?.user?.email) {
      loadPassedUsers()
    }
  }, [session])

  const loadPassedUsers = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/passes')
      const data = await response.json()
      
      if (data.success) {
        setPassedUsers(data.users)
      } else {
        setError(data.error || 'Failed to load passed users')
      }
    } catch (err) {
      console.error('Error loading passed users:', err)
      setError('Failed to connect to server')
    } finally {
      setLoading(false)
    }
  }

  const handleSecondChance = async (userEmail: string) => {
    try {
      const response = await fetch(`/api/passes?userEmail=${encodeURIComponent(userEmail)}`, {
        method: 'DELETE'
      })
      
      const data = await response.json()
      if (data.success) {
        // Remove the user from the list
        setPassedUsers(prev => prev.filter(user => user.email !== userEmail))
      } else {
        console.error('Failed to give second chance:', data.error)
      }
    } catch (error) {
      console.error('Error giving second chance:', error)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading recycle bin...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-blue-50 flex items-center justify-center">
        <p className="text-gray-600">Please log in to see your recycle bin</p>
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
          <Button onClick={loadPassedUsers} className="bg-blue-500 hover:bg-blue-600">
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
            🗑️ Recycle Bin
          </h1>
          <p className="text-gray-600 text-center text-sm mt-1">
            {passedUsers.length} profiles you passed on
          </p>
          <p className="text-gray-500 text-center text-xs mt-1">
            Give someone a second chance by removing them from here
          </p>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-md mx-auto p-4">
        {passedUsers.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">✨</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Empty recycle bin</h2>
            <p className="text-gray-600 mb-6">
              You haven't passed on anyone yet, or you've given everyone second chances!
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
            {passedUsers.map((user) => {
              const interests = user.profile?.interests 
                ? JSON.parse(user.profile.interests) 
                : []
              
              return (
                <div 
                  key={user.id} 
                  className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200"
                >
                  <div className="flex">
                    {/* Photo */}
                    <div className="w-24 h-24 bg-gray-200 flex-shrink-0 relative">
                      {user.photos && user.photos[0] ? (
                        <>
                          <img 
                            src={user.photos[0].url} 
                            alt={user.name}
                            className="w-full h-full object-cover opacity-60"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center">
                            <div className="text-white text-xl">❌</div>
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-300 to-gray-400">
                          <div className="text-2xl text-gray-500">
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
                                  className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs"
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

                          <p className="text-gray-500 text-xs mb-3">
                            Passed {new Date(user.passedAt).toLocaleDateString()}
                          </p>

                          <Button 
                            onClick={() => handleSecondChance(user.email)}
                            size="sm"
                            variant="outline"
                            className="w-full border-green-500 text-green-600 hover:bg-green-50 hover:border-green-600"
                          >
                            ↻ Give Second Chance
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}

            {passedUsers.length > 0 && (
              <div className="bg-white rounded-xl p-4 border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-2">💡 Pro Tip</h3>
                <p className="text-gray-600 text-sm">
                  When you give someone a second chance, they'll appear in your discovery feed again. 
                  This removes them from your recycle bin permanently.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
