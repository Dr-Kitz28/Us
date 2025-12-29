'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'

interface Match {
  id: string
  user1Id: string
  user2Id: string
  createdAt: string
  otherUser: {
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
}

export default function MatchesPage() {
  const { data: session, status } = useSession()
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (session?.user?.email) {
      loadMatches()
    }
  }, [session])

  const loadMatches = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/user-matches')
      const data = await response.json()
      
      if (data.success) {
        setMatches(data.matches || [])
      } else {
        setError(data.error || 'Failed to load matches')
      }
    } catch (err) {
      console.error('Error loading matches:', err)
      setError('Failed to connect to server')
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p>Loading your matches...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Button onClick={() => window.location.href = '/login'}>Go to Login</Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-blue-500 bg-clip-text text-transparent">
            Your Matches
          </h1>
          <nav className="flex items-center gap-4 text-sm text-gray-600">
            <a href="/app/feed" className="hover:text-pink-600">Feed</a>
            <a href="/app/profile" className="hover:text-pink-600">Profile</a>
            <span>Hi, {session.user?.name?.split(' ')[0]}!</span>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold mb-2 text-gray-900">Your Matches ({matches.length})</h2>
          <p className="text-gray-600">Start conversations with people who liked you back</p>
        </div>

        {error && (
          <div className="text-center mb-8">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-md mx-auto">
              <p className="text-red-600">{error}</p>
              <Button onClick={loadMatches} className="mt-2" variant="outline">
                Try Again
              </Button>
            </div>
          </div>
        )}

        {matches.length === 0 && !error && !loading && (
          <div className="text-center py-16">
            <div className="text-6xl mb-6">💕</div>
            <h3 className="text-xl font-semibold mb-2 text-gray-900">No matches yet</h3>
            <p className="text-gray-600 mb-6">Start swiping to find people who like you back!</p>
            <Button onClick={() => window.location.href = '/app/feed'}>
              Go to Feed
            </Button>
          </div>
        )}

        {matches.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {matches.map((match) => {
              const otherUser = match.otherUser

              // Defensive guards: some match records may be incomplete
              if (!otherUser) {
                return (
                  <div key={match.id} className="bg-white rounded-2xl shadow-lg overflow-hidden p-4">
                    <div className="text-gray-600">Unknown user (data missing)</div>
                  </div>
                )
              }

              let interests: string[] = []
              try {
                if (otherUser.profile?.interests) {
                  const parsed = JSON.parse(otherUser.profile.interests)
                  if (Array.isArray(parsed)) interests = parsed
                }
              } catch (e) {
                // malformed interests JSON, ignore and keep empty list
                console.warn('Failed to parse interests for user', otherUser.id)
              }

              return (
                <div key={match.id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                  {/* Profile Image */}
                  <div className="relative h-64 bg-gray-200">
                    {otherUser.photos && otherUser.photos[0] ? (
                      <img 
                        src={otherUser.photos[0].url} 
                        alt={otherUser.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
                        <div className="text-4xl text-gray-400">
                          {otherUser.name?.charAt(0) || '?'}
                        </div>
                      </div>
                    )}
                    {/* Match indicator */}
                    <div className="absolute top-4 right-4 bg-pink-500 text-white rounded-full px-2 py-1 text-xs font-semibold">
                      ✨ Match
                    </div>
                  </div>

                  {/* User Info */}
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-xl font-bold text-gray-900">
                        {otherUser.name}
                      </h3>
                      {otherUser.profile?.age && (
                        <span className="text-lg text-gray-600">
                          {otherUser.profile.age}
                        </span>
                      )}
                    </div>

                    {otherUser.profile?.location && (
                      <p className="text-gray-600 text-sm mb-3 flex items-center gap-1">
                        📍 {otherUser.profile.location}
                      </p>
                    )}

                    {otherUser.profile?.bio && (
                      <p className="text-gray-700 text-sm mb-3 line-clamp-2">
                        {otherUser.profile.bio}
                      </p>
                    )}

                    {interests.length > 0 && (
                      <div className="mb-4">
                        <div className="flex flex-wrap gap-1">
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
                      </div>
                    )}

                    <div className="text-xs text-gray-500 mb-3">
                      Matched {new Date(match.createdAt).toLocaleDateString()}
                    </div>

                    <Button 
                      className="w-full bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600"
                      onClick={() => window.location.href = `/app/messages?matchId=${match.id}`}
                    >
                      💬 Send Message
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
