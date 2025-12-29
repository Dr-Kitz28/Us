'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar } from '@/components/ui/avatar'
import { ConversationAnalyzer } from '@/lib/conversationAnalyzer'

interface Message {
  id: string
  content: string
  senderId: string
  createdAt: string
  senderName: string
}

interface Match {
  id: string
  user1Id: string
  user2Id: string
  user1: {
    id: string
    name: string
    email: string
    photos: Array<{ url: string }>
    profile?: {
      bio?: string
      interests?: string
    }
  }
  user2: {
    id: string
    name: string
    email: string
    photos: Array<{ url: string }>
    profile?: {
      bio?: string
      interests?: string
    }
  }
  messages: Message[]
}

export default function MessagesPage() {
  const { data: session } = useSession()
  const [matches, setMatches] = useState<Match[]>([])
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [messageAnalysis, setMessageAnalysis] = useState<{
    score: number
    topSuggestion: string
    researchTip: string
  } | null>(null)
  const [conversationStarters, setConversationStarters] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Load user's matches
  useEffect(() => {
    if (session?.user?.email) {
      loadMatches()
    }
  }, [session])

  // Analyze message as user types
  useEffect(() => {
    if (newMessage.trim().length > 0 && selectedMatch) {
      const otherUser = selectedMatch.user1.email === session?.user?.email 
        ? selectedMatch.user2 
        : selectedMatch.user1

      const analysis = ConversationAnalyzer.analyzeMessage(
        newMessage,
        {
          bio: otherUser.profile?.bio || '',
          interests: otherUser.profile?.interests ? JSON.parse(otherUser.profile.interests) : [],
          photos: otherUser.photos
        }
      )

      setMessageAnalysis({
        score: analysis.overallScore,
        topSuggestion: analysis.topSuggestion,
        researchTip: analysis.researchTip
      })
    } else {
      setMessageAnalysis(null)
    }
  }, [newMessage, selectedMatch, session])

  // Generate conversation starters when match is selected
  useEffect(() => {
    if (selectedMatch && selectedMatch.messages.length === 0) {
      const otherUser = selectedMatch.user1.email === session?.user?.email 
        ? selectedMatch.user2 
        : selectedMatch.user1

      const starters = ConversationAnalyzer.getConversationStarters({
        bio: otherUser.profile?.bio || '',
        interests: otherUser.profile?.interests ? JSON.parse(otherUser.profile.interests) : [],
        photos: otherUser.photos
      })

      setConversationStarters(starters)
    }
  }, [selectedMatch, session])

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom()
  }, [selectedMatch?.messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Mark messages as seen when selecting a conversation (dev-bypass supported)
  useEffect(() => {
    if (!selectedMatch) return
    // fire-and-forget
    fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'markSeen', matchId: selectedMatch.id })
    }).catch(() => {})
  }, [selectedMatch])

  // Subscribe to server-sent events for realtime messages (dev only)
  useEffect(() => {
    if (!selectedMatch) return
    const matchId = selectedMatch.id
    const es = new EventSource(`/api/messages?stream=1&matchId=${matchId}&dev=1`)

    es.onmessage = (e) => {
      try {
        const payload = JSON.parse(e.data)
        if (payload.type === 'new_message') {
          const incoming = payload.message
          setMatches(prev => {
            let found = false
            const updated = prev.map(m => {
              if (m.id === payload.matchId) {
                // avoid duplicates
                if (m.messages.find(msg => msg.id === incoming.id)) {
                  found = true
                  return m
                }
                found = true
                return { ...m, messages: [...m.messages, { id: incoming.id, content: incoming.content, senderId: incoming.senderId, createdAt: new Date(incoming.createdAt).toISOString(), senderName: '' }] }
              }
              return m
            })
            return found ? updated : prev
          })

          // if message is for current user, mark seen
          const currentUserId = selectedMatch.user1.email === session?.user?.email ? selectedMatch.user1.id : selectedMatch.user2.id
          if (incoming.senderId !== currentUserId) {
            fetch('/api/messages', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ action: 'markSeen', matchId })
            }).catch(() => {})
          }
        } else if (payload.type === 'messages_seen') {
          // Optionally update UI (not tracking seenAt per message in UI currently)
        }
      } catch (err) {
        // ignore
      }
    }

    es.onerror = () => {
      es.close()
    }

    return () => {
      es.close()
    }
  }, [selectedMatch, session])

  const loadMatches = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/user-matches')
      const data = await response.json()

      if (data.success) {
        // Normalize matches shape returned by /api/user-matches to the shape this page expects (user1/user2)
        const normalized = (data.matches || []).map((m: any) => {
          const other = m.otherUser || {}
          const currentUserId = other.id === m.user1Id ? m.user2Id : m.user1Id
          const user1 = { id: currentUserId, name: session?.user?.name || 'You', email: session?.user?.email || '', photos: [], profile: {} }
          const user2 = {
            id: other.id,
            name: other.name,
            email: other.email,
            photos: other.photos || [],
            profile: other.profile || {}
          }
          return {
            id: m.id,
            user1Id: m.user1Id,
            user2Id: m.user2Id,
            createdAt: m.createdAt,
            user1,
            user2,
            messages: (m.messages || []).map((msg: any) => ({ id: msg.id, content: msg.content, senderId: msg.senderId, createdAt: new Date(msg.createdAt).toISOString(), senderName: msg.sender?.name || '' }))
          }
        })

        setMatches(normalized)
        // Auto-select match from query param if provided, otherwise first match
        let requestedMatchId = null
        try {
          requestedMatchId = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('matchId') : null
        } catch (e) {
          requestedMatchId = null
        }

        if (requestedMatchId) {
          const found = normalized.find(m => m.id === requestedMatchId)
          if (found) setSelectedMatch(found)
          else if (normalized.length > 0 && !selectedMatch) setSelectedMatch(normalized[0])
        } else {
          if (normalized.length > 0 && !selectedMatch) setSelectedMatch(normalized[0])
        }
      }
    } catch (error) {
      console.error('Error loading matches:', error)
    } finally {
      setLoading(false)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedMatch || !session?.user?.email) return

    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          matchId: selectedMatch.id,
          content: newMessage.trim()
        }),
      })

      const data = await response.json()

      if (data.success) {
        // Get current user ID from match data
        const currentUserId = selectedMatch.user1.email === session.user.email 
          ? selectedMatch.user1.id 
          : selectedMatch.user2.id

        // Add message to local state
        const updatedMatches = matches.map(match => {
          if (match.id === selectedMatch.id) {
            return {
              ...match,
              messages: [...match.messages, {
                id: data.message.id,
                content: newMessage.trim(),
                senderId: currentUserId,
                createdAt: new Date().toISOString(),
                senderName: session.user?.name || 'You'
              }]
            }
          }
          return match
        })

        setMatches(updatedMatches)
        setSelectedMatch(updatedMatches.find(m => m.id === selectedMatch.id) || null)
        setNewMessage('')
        setMessageAnalysis(null)
        setConversationStarters([])
      }
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  const useConversationStarter = (starter: string) => {
    setNewMessage(starter)
    setConversationStarters([])
  }

  const getOtherUser = (match: Match) => {
    return match.user1.email === session?.user?.email ? match.user2 : match.user1
  }

  const getCurrentUserId = (match: Match) => {
    return match.user1.email === session?.user?.email ? match.user1.id : match.user2.id
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.abs(now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 1) {
      return 'Just now'
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">💕</div>
          <div className="text-lg text-gray-600">Loading your matches...</div>
        </div>
      </div>
    )
  }

  if (matches.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-8xl mb-6">💬</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">No Matches Yet</h2>
          <p className="text-gray-600 mb-6">Keep swiping to find your perfect match!</p>
          <Button 
            onClick={() => window.location.href = '/app/feed'}
            className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
          >
            Start Swiping
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white flex">
      {/* Matches Sidebar */}
      <div className="w-80 bg-gray-50 border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-800">Messages</h1>
          <p className="text-sm text-gray-600">{matches.length} matches</p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {matches.map((match) => {
            const otherUser = getOtherUser(match)
            const lastMessage = match.messages[match.messages.length - 1]
            const isSelected = selectedMatch?.id === match.id

            return (
              <div
                key={match.id}
                onClick={() => setSelectedMatch(match)}
                className={`p-4 border-b border-gray-100 hover:bg-white cursor-pointer transition-colors ${
                  isSelected ? 'bg-white border-l-4 border-pink-500' : ''
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Avatar className="w-12 h-12">
                    {otherUser.photos[0] ? (
                      <img 
                        src={otherUser.photos[0].url} 
                        alt={otherUser.name}
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-pink-400 to-purple-400 text-white text-lg font-semibold">
                        {otherUser.name.charAt(0)}
                      </div>
                    )}
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {otherUser.name}
                    </p>
                    {lastMessage ? (
                      <p className="text-sm text-gray-500 truncate">
                        {lastMessage.senderId === getCurrentUserId(match) ? 'You: ' : ''}
                        {lastMessage.content}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-400">Start the conversation!</p>
                    )}
                  </div>
                  {lastMessage && (
                    <div className="text-xs text-gray-400">
                      {formatTime(lastMessage.createdAt)}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Conversation Area */}
      <div className="flex-1 flex flex-col">
        {selectedMatch ? (
          <>
            {/* Header */}
            <div className="p-4 border-b border-gray-200 bg-white">
              <div className="flex items-center space-x-3">
                <Avatar className="w-10 h-10">
                  {getOtherUser(selectedMatch).photos[0] ? (
                    <img 
                      src={getOtherUser(selectedMatch).photos[0].url} 
                      alt={getOtherUser(selectedMatch).name}
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-pink-400 to-purple-400 text-white font-semibold">
                      {getOtherUser(selectedMatch).name.charAt(0)}
                    </div>
                  )}
                </Avatar>
                <div>
                  <h2 className="font-semibold text-gray-900">
                    {getOtherUser(selectedMatch).name}
                  </h2>
                  <p className="text-sm text-gray-500">Online recently</p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {selectedMatch.messages.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🎉</div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    You matched with {getOtherUser(selectedMatch).name}!
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Start the conversation with a great first message
                  </p>
                  
                  {/* Research-backed conversation starters */}
                  {conversationStarters.length > 0 && (
                    <div className="max-w-md mx-auto space-y-2">
                      <p className="text-sm font-medium text-purple-700 mb-3">
                        🧠 Research-backed starters:
                      </p>
                      {conversationStarters.map((starter, index) => (
                        <button
                          key={index}
                          onClick={() => useConversationStarter(starter)}
                          className="w-full p-3 text-left text-sm bg-white rounded-lg hover:bg-purple-50 border border-purple-100 transition-colors"
                        >
                          "{starter}"
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {selectedMatch.messages.map((message, index) => {
                    const isFromCurrentUser = message.senderId === getCurrentUserId(selectedMatch)
                    
                    return (
                      <div
                        key={index}
                        className={`flex ${isFromCurrentUser ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                            isFromCurrentUser
                              ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white'
                              : 'bg-white text-gray-800 border border-gray-200'
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                          <p className={`text-xs mt-1 ${
                            isFromCurrentUser ? 'text-pink-100' : 'text-gray-500'
                          }`}>
                            {formatTime(message.createdAt)}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input with Research Analysis */}
            <div className="p-4 border-t border-gray-200 bg-white">
              {/* Real-time message analysis */}
              {messageAnalysis && newMessage.trim().length > 0 && (
                <div className="mb-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-blue-900">
                        Message Score: {messageAnalysis.score}/100
                      </span>
                      <span className="text-lg">
                        {messageAnalysis.score >= 80 ? '🔥' : 
                         messageAnalysis.score >= 60 ? '👍' : 
                         messageAnalysis.score >= 40 ? '⚠️' : '❌'}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-blue-700 mb-1">
                    💡 {messageAnalysis.topSuggestion}
                  </p>
                  <p className="text-xs text-blue-600">
                    {messageAnalysis.researchTip}
                  </p>
                </div>
              )}

              <div className="flex space-x-3">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      sendMessage()
                    }
                  }}
                  placeholder="Type a message..."
                  className="flex-1"
                />
                <Button 
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                  className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 disabled:opacity-50"
                >
                  Send
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <div className="text-6xl mb-4">💭</div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Select a match to start chatting
              </h3>
              <p className="text-gray-600">
                Choose someone from your matches to begin the conversation
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
