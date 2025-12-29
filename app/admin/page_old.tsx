'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

interface User {
  id: string
  name: string
  email: string
  profile?: {
    age?: number
    bio?: string
    location?: string
  }
  photoCount: number
  stats: {
    likesGiven: number
    likesReceived: number
    matches1: number
    matches2: number
  }
}

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const seedDatabase = async () => {
    setLoading(true)
    setMessage('')
    
    try {
      const response = await fetch('/api/seed', { method: 'POST' })
      const data = await response.json()
      
      if (data.success) {
        setMessage(`✅ ${data.message}`)
        loadUsers() // Refresh the user list
      } else {
        setMessage(`❌ Error: ${data.error}`)
      }
    } catch (error) {
      setMessage(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const loadUsers = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/seed')
      const data = await response.json()
      
      if (data.success) {
        setUsers(data.users)
        setMessage(`📊 Found ${data.count} users in database`)
      } else {
        setMessage(`❌ Error: ${data.error}`)
      }
    } catch (error) {
      setMessage(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            🛠️ Dating App Admin
          </h1>

          <div className="space-y-4 mb-8">
            <div className="flex gap-4">
              <Button 
                onClick={seedDatabase} 
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {loading ? '⏳ Seeding...' : '🌱 Seed Database'}
              </Button>
              
              <Button 
                onClick={loadUsers} 
                disabled={loading}
                variant="outline"
              >
                {loading ? '⏳ Loading...' : '🔍 Load Users'}
              </Button>
            </div>

            {message && (
              <div className="p-4 rounded-lg bg-gray-100 font-mono text-sm">
                {message}
              </div>
            )}
          </div>

          {users.length > 0 && (
            <div>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                👥 Users ({users.length})
              </h2>
              
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {users.map((user) => (
                  <div key={user.id} className="bg-gray-50 rounded-lg p-4 border">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                        {user.name?.charAt(0) || '?'}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{user.name}</h3>
                        <p className="text-sm text-gray-600">{user.email}</p>
                      </div>
                    </div>
                    
                    {user.profile && (
                      <div className="space-y-1 text-sm text-gray-600 mb-3">
                        {user.profile.age && <p>Age: {user.profile.age}</p>}
                        {user.profile.location && <p>📍 {user.profile.location}</p>}
                        {user.profile.bio && (
                          <p className="text-xs bg-white p-2 rounded border">
                            {user.profile.bio.substring(0, 100)}
                            {user.profile.bio.length > 100 ? '...' : ''}
                          </p>
                        )}
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                      <div>📸 {user.photoCount} photos</div>
                      <div>👍 {user.stats.likesGiven} given</div>
                      <div>💖 {user.stats.likesReceived} received</div>
                      <div>🤝 {user.stats.matches1 + user.stats.matches2} matches</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="font-semibold text-yellow-800 mb-2">ℹ️ Instructions</h3>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• Click "Seed Database" to create test users with profiles and photos</li>
              <li>• Click "Load Users" to view current users in the database</li>
              <li>• Test users have the password: <code className="bg-yellow-200 px-1 rounded">password123</code></li>
              <li>• You can login with any test user email and the password above</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
