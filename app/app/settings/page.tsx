'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { savePreferences, getPreferences, saveBiodata, getBiodata, type UserPreferences } from '@/lib/storage'

export default function SettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  // Profile settings
  const [name, setName] = useState('')
  const [bio, setBio] = useState('')
  const [location, setLocation] = useState('')
  const [age, setAge] = useState('')
  
  // Preference settings
  const [ageMin, setAgeMin] = useState(18)
  const [ageMax, setAgeMax] = useState(100)
  const [distance, setDistance] = useState(50)
  const [genderPreference, setGenderPreference] = useState<string[]>([])
  
  // Notification settings
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [pushNotifications, setPushNotifications] = useState(true)
  const [matchNotifications, setMatchNotifications] = useState(true)
  const [messageNotifications, setMessageNotifications] = useState(true)
  
  // UI state
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [activeTab, setActiveTab] = useState<'profile' | 'preferences' | 'notifications' | 'privacy'>('profile')

  useEffect(() => {
    if (session?.user) {
      loadUserData()
    }
  }, [session])

  const loadUserData = async () => {
    try {
      setLoading(true)
      
      // Load from localStorage
      const savedBiodata = getBiodata()
      const savedPreferences = getPreferences()
      
      if (savedBiodata) {
        setName(savedBiodata.name || '')
        setBio(savedBiodata.bio || '')
        setLocation(savedBiodata.location || '')
        setAge(savedBiodata.age?.toString() || '')
      }
      
      if (savedPreferences) {
        setAgeMin(savedPreferences.ageRange?.min || 18)
        setAgeMax(savedPreferences.ageRange?.max || 100)
        setDistance(savedPreferences.distance || 50)
        setGenderPreference(savedPreferences.genderPreference || [])
        
        if (savedPreferences.notifications) {
          setEmailNotifications(savedPreferences.notifications.email)
          setPushNotifications(savedPreferences.notifications.push)
          setMatchNotifications(savedPreferences.notifications.matches)
          setMessageNotifications(savedPreferences.notifications.messages)
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveProfile = async () => {
    try {
      setSaving(true)
      
      // Save to localStorage
      saveBiodata({
        name,
        bio,
        location,
        age: age ? parseInt(age) : undefined,
        email: session?.user?.email || ''
      })
      
      setMessage({ type: 'success', text: 'Profile updated successfully!' })
      setTimeout(() => setMessage(null), 3000)
    } catch (error) {
      console.error('Error saving profile:', error)
      setMessage({ type: 'error', text: 'Failed to save profile. Please try again.' })
    } finally {
      setSaving(false)
    }
  }

  const handleSavePreferences = async () => {
    try {
      setSaving(true)
      
      const preferences: UserPreferences = {
        ageRange: { min: ageMin, max: ageMax },
        distance,
        genderPreference,
        notifications: {
          email: emailNotifications,
          push: pushNotifications,
          matches: matchNotifications,
          messages: messageNotifications
        }
      }
      
      // Save to localStorage
      savePreferences(preferences)
      
      setMessage({ type: 'success', text: 'Preferences updated successfully!' })
      setTimeout(() => setMessage(null), 3000)
    } catch (error) {
      console.error('Error saving preferences:', error)
      setMessage({ type: 'error', text: 'Failed to save preferences. Please try again.' })
    } finally {
      setSaving(false)
    }
  }

  const toggleGenderPreference = (gender: string) => {
    setGenderPreference(prev => 
      prev.includes(gender) 
        ? prev.filter(g => g !== gender)
        : [...prev, gender]
    )
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    router.push('/login')
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="text-gray-600 hover:text-pink-600"
              >
                ← Back
              </button>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-blue-500 bg-clip-text text-transparent">
                Settings
              </h1>
            </div>
            <nav className="flex items-center gap-4 text-sm text-gray-600">
              <a href="/app/feed" className="hover:text-pink-600">Feed</a>
              <a href="/app/matches" className="hover:text-pink-600">Matches</a>
              <a href="/app/profile" className="hover:text-pink-600">Profile</a>
            </nav>
          </div>
        </div>
      </header>

      {/* Message Banner */}
      {message && (
        <div className={`max-w-4xl mx-auto px-4 py-2`}>
          <div className={`rounded-lg p-4 ${
            message.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-800' 
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            {message.text}
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
          {[
            { id: 'profile', label: '👤 Profile' },
            { id: 'preferences', label: '⚙️ Preferences' },
            { id: 'notifications', label: '🔔 Notifications' },
            { id: 'privacy', label: '🔒 Privacy' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-pink-500 to-blue-500 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="bg-white rounded-2xl shadow-lg p-6 space-y-6">
            <h2 className="text-xl font-bold text-gray-900">Profile Information</h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                placeholder="Your name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Age
              </label>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                placeholder="Your age"
                min="18"
                max="100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                placeholder="City, Country"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bio
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                placeholder="Tell us about yourself..."
                maxLength={500}
              />
              <p className="text-sm text-gray-500 mt-1">{bio.length}/500 characters</p>
            </div>

            <Button
              onClick={handleSaveProfile}
              disabled={saving}
              className="w-full bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600"
            >
              {saving ? 'Saving...' : 'Save Profile'}
            </Button>
          </div>
        )}

        {/* Preferences Tab */}
        {activeTab === 'preferences' && (
          <div className="bg-white rounded-2xl shadow-lg p-6 space-y-6">
            <h2 className="text-xl font-bold text-gray-900">Matching Preferences</h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Age Range: {ageMin} - {ageMax}
              </label>
              <div className="flex gap-4">
                <div className="flex-1">
                  <input
                    type="range"
                    min="18"
                    max="100"
                    value={ageMin}
                    onChange={(e) => setAgeMin(parseInt(e.target.value))}
                    className="w-full"
                  />
                  <p className="text-sm text-gray-600 mt-1">Min: {ageMin}</p>
                </div>
                <div className="flex-1">
                  <input
                    type="range"
                    min="18"
                    max="100"
                    value={ageMax}
                    onChange={(e) => setAgeMax(parseInt(e.target.value))}
                    className="w-full"
                  />
                  <p className="text-sm text-gray-600 mt-1">Max: {ageMax}</p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Distance: {distance} km
              </label>
              <input
                type="range"
                min="1"
                max="500"
                value={distance}
                onChange={(e) => setDistance(parseInt(e.target.value))}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Show me
              </label>
              <div className="space-y-2">
                {['Men', 'Women', 'Everyone'].map(gender => (
                  <button
                    key={gender}
                    onClick={() => toggleGenderPreference(gender)}
                    className={`w-full px-4 py-2 rounded-lg border transition-colors ${
                      genderPreference.includes(gender)
                        ? 'bg-pink-100 border-pink-500 text-pink-700'
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {genderPreference.includes(gender) && '✓ '}{gender}
                  </button>
                ))}
              </div>
            </div>

            <Button
              onClick={handleSavePreferences}
              disabled={saving}
              className="w-full bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600"
            >
              {saving ? 'Saving...' : 'Save Preferences'}
            </Button>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="bg-white rounded-2xl shadow-lg p-6 space-y-6">
            <h2 className="text-xl font-bold text-gray-900">Notification Settings</h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Email Notifications</p>
                  <p className="text-sm text-gray-600">Receive updates via email</p>
                </div>
                <button
                  onClick={() => setEmailNotifications(!emailNotifications)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    emailNotifications ? 'bg-pink-500' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      emailNotifications ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Push Notifications</p>
                  <p className="text-sm text-gray-600">Receive push notifications</p>
                </div>
                <button
                  onClick={() => setPushNotifications(!pushNotifications)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    pushNotifications ? 'bg-pink-500' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      pushNotifications ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">New Matches</p>
                  <p className="text-sm text-gray-600">Get notified of new matches</p>
                </div>
                <button
                  onClick={() => setMatchNotifications(!matchNotifications)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    matchNotifications ? 'bg-pink-500' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      matchNotifications ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">New Messages</p>
                  <p className="text-sm text-gray-600">Get notified of new messages</p>
                </div>
                <button
                  onClick={() => setMessageNotifications(!messageNotifications)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    messageNotifications ? 'bg-pink-500' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      messageNotifications ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            <Button
              onClick={handleSavePreferences}
              disabled={saving}
              className="w-full bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600"
            >
              {saving ? 'Saving...' : 'Save Notifications'}
            </Button>
          </div>
        )}

        {/* Privacy Tab */}
        {activeTab === 'privacy' && (
          <div className="bg-white rounded-2xl shadow-lg p-6 space-y-6">
            <h2 className="text-xl font-bold text-gray-900">Privacy & Security</h2>
            
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-2">Data Protection</h3>
                <p className="text-sm text-blue-700">
                  Your data is encrypted and stored securely. We never share your personal information with third parties without your consent.
                </p>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 mb-2">Account Actions</h3>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start">
                    🔒 Change Password
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    📥 Download My Data
                  </Button>
                  <Button variant="outline" className="w-full justify-start text-red-600 hover:text-red-700">
                    🗑️ Delete Account
                  </Button>
                </div>
              </div>

              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">Your Rights</h3>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• Right to access your data</li>
                  <li>• Right to data portability</li>
                  <li>• Right to deletion</li>
                  <li>• Right to opt-out of data processing</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
