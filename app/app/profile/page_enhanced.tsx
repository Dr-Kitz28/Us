'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar } from '@/components/ui/avatar'
import { isFeatureEnabled } from '@/lib/featureFlags'
import { AuthenticityFeatures } from '@/lib/userExperience'

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const [editing, setEditing] = useState(false)
  const [profileData, setProfileData] = useState({
    name: '',
    bio: '',
    age: '',
    interests: [] as string[]
  })
  const [authenticityPrompts, setAuthenticityPrompts] = useState<Array<{question: string, answer: string}>>([])

  // Research-backed features
  const authenticityEnabled = isFeatureEnabled('authenticityPrompts')
  const wellnessEnabled = isFeatureEnabled('burnoutPrevention')

  useEffect(() => {
    if (session?.user) {
      setProfileData({
        name: session.user.name || '',
        bio: 'Tell people about yourself...',
        age: '',
        interests: []
      })

      // Load authenticity prompts if enabled
      if (authenticityEnabled) {
        const prompts = AuthenticityFeatures.getPromptSuggestions()
        setAuthenticityPrompts(prompts.slice(0, 3).map((q: string) => ({ question: q, answer: '' })))
      }
    }
  }, [session, authenticityEnabled])

  const handleSave = () => {
    // In real app, would save to database
    console.log('Saving profile:', profileData, authenticityPrompts)
    setEditing(false)
  }

  const addInterest = (interest: string) => {
    if (interest.trim() && !profileData.interests.includes(interest.trim())) {
      setProfileData(prev => ({
        ...prev,
        interests: [...prev.interests, interest.trim()]
      }))
    }
  }

  const removeInterest = (interest: string) => {
    setProfileData(prev => ({
      ...prev,
      interests: prev.interests.filter(i => i !== interest)
    }))
  }

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading...</p>
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
            <a href="/app/feed" className="text-sm hover:text-primary">Feed</a>
            <a href="/app/matches" className="text-sm hover:text-primary">Matches</a>
            <Avatar src={null} fallback={session.user?.name?.[0] ?? '👤'} size={32} />
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Wellness Reminder */}
          {wellnessEnabled && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="font-medium text-green-800 mb-2">💚 Wellness Tip</h3>
              <p className="text-green-700 text-sm">
                Remember, quality connections matter more than quantity. Take breaks when dating feels overwhelming!
              </p>
            </div>
          )}

          {/* Profile Header */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <div className="flex items-center gap-6 mb-6">
              <Avatar src={null} fallback={session.user?.name?.[0] ?? '👤'} size={80} />
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl font-bold">{profileData.name}</h2>
                  {!editing && (
                    <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                      Edit
                    </Button>
                  )}
                </div>
                <p className="text-gray-600">{session.user?.email}</p>
              </div>
            </div>

            {editing ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Name</label>
                  <Input
                    value={profileData.name}
                    onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Age</label>
                  <Input
                    type="number"
                    value={profileData.age}
                    onChange={(e) => setProfileData(prev => ({ ...prev, age: e.target.value }))}
                    placeholder="Age"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Bio</label>
                  <textarea
                    className="w-full p-3 border rounded-lg resize-none"
                    rows={4}
                    value={profileData.bio}
                    onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                    placeholder="Tell people about yourself..."
                  />
                </div>
                <div className="flex gap-3">
                  <Button onClick={handleSave}>Save Changes</Button>
                  <Button variant="outline" onClick={() => setEditing(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-600 mb-1">Bio</h3>
                  <p className="text-gray-900">{profileData.bio}</p>
                </div>
                {profileData.age && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-600 mb-1">Age</h3>
                    <p className="text-gray-900">{profileData.age}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Authenticity Prompts (Research-backed) */}
          {authenticityEnabled && (
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <h3 className="text-lg font-semibold">Authenticity Prompts</h3>
                <span className="text-sm text-blue-600 bg-blue-100 px-2 py-1 rounded">Research-backed</span>
              </div>
              <p className="text-gray-600 text-sm mb-4">
                These prompts help you show your authentic personality, which research shows leads to better matches.
              </p>
              
              <div className="space-y-4">
                {authenticityPrompts.map((prompt, idx) => (
                  <div key={idx} className="border rounded-lg p-4">
                    <h4 className="font-medium text-gray-800 mb-2">{prompt.question}</h4>
                    {editing ? (
                      <Input
                        value={prompt.answer}
                        onChange={(e) => {
                          const updated = [...authenticityPrompts]
                          updated[idx].answer = e.target.value
                          setAuthenticityPrompts(updated)
                        }}
                        placeholder="Your authentic answer..."
                      />
                    ) : (
                      <p className="text-gray-700">{prompt.answer || "Not answered yet"}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Interests */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">Interests</h3>
            <div className="flex flex-wrap gap-2 mb-4">
              {profileData.interests.map((interest, idx) => (
                <span 
                  key={idx} 
                  className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center gap-2"
                >
                  {interest}
                  {editing && (
                    <button
                      onClick={() => removeInterest(interest)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  )}
                </span>
              ))}
            </div>
            {editing && (
              <div className="flex gap-2">
                <Input
                  placeholder="Add interest (press Enter)"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      addInterest(e.currentTarget.value)
                      e.currentTarget.value = ''
                    }
                  }}
                />
              </div>
            )}
          </div>

          {/* Privacy & Wellness Settings */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Privacy & Wellness</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Choice Overload Protection</p>
                  <p className="text-sm text-gray-600">Limit daily profiles to prevent decision fatigue</p>
                </div>
                <div className="w-12 h-6 bg-blue-500 rounded-full p-1">
                  <div className="w-4 h-4 bg-white rounded-full ml-auto"></div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Burnout Prevention</p>
                  <p className="text-sm text-gray-600">Get wellness reminders and break suggestions</p>
                </div>
                <div className="w-12 h-6 bg-blue-500 rounded-full p-1">
                  <div className="w-4 h-4 bg-white rounded-full ml-auto"></div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Quality Over Quantity</p>
                  <p className="text-sm text-gray-600">Show fewer, more compatible matches</p>
                </div>
                <div className="w-12 h-6 bg-blue-500 rounded-full p-1">
                  <div className="w-4 h-4 bg-white rounded-full ml-auto"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
