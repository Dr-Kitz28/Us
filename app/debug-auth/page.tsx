'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Eye, EyeOff } from 'lucide-react'

export default function AuthDebugPage() {
  const [email, setEmail] = useState('alex@example.com') // Default to test user
  const [password, setPassword] = useState('password123') // Default test password
  const [showPassword, setShowPassword] = useState(false) // Password visibility toggle
  const [users, setUsers] = useState<any[]>([])
  const [debugResult, setDebugResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const loadUsers = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/debug-auth')
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      setUsers(data.users || [])
    } catch (error) {
      console.error('Error loading users:', error)
      alert(`❌ Error loading users: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const testAuth = async () => {
    setLoading(true)
    setDebugResult(null)
    
    try {
      const response = await fetch('/api/debug-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      
      const data = await response.json()
      setDebugResult(data)
    } catch (error) {
      setDebugResult({ 
        success: false, 
        error: `Network error: ${error instanceof Error ? error.message : 'Unknown'}` 
      })
    } finally {
      setLoading(false)
    }
  }

  const seedAndTest = async () => {
    setLoading(true)
    try {
      // First seed the database
      const seedResponse = await fetch('/api/seed', { method: 'POST' })
      
      if (!seedResponse.ok) {
        throw new Error(`HTTP ${seedResponse.status}: ${seedResponse.statusText}`)
      }
      
      const seedData = await seedResponse.json()
      
      if (seedData.success) {
        alert('✅ Database seeded successfully!')
        await loadUsers()
      } else {
        alert(`❌ Seeding failed: ${seedData.error}`)
      }
    } catch (error) {
      console.error('Seeding error:', error)
      alert(`❌ Network error while seeding: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            🔐 Authentication Debug Tool
          </h1>

          {/* Seed Database Section */}
          <div className="mb-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h2 className="text-xl font-semibold mb-2">1. Setup Database</h2>
            <p className="text-sm text-gray-600 mb-4">
              First, make sure you have test users in the database.
            </p>
            <div className="flex gap-4">
              <Button onClick={seedAndTest} className="bg-blue-600 hover:bg-blue-700">
                🌱 Seed Database
              </Button>
              <Button onClick={loadUsers} variant="outline">
                👥 Load Users
              </Button>
            </div>
          </div>

          {/* Users List */}
          {users.length > 0 && (
            <div className="mb-8 p-4 bg-green-50 rounded-lg border border-green-200">
              <h2 className="text-xl font-semibold mb-2">Available Users ({users.length})</h2>
              <div className="grid gap-2">
                {users.map((user) => (
                  <div key={user.id} className="bg-white p-3 rounded border">
                    <div className="font-semibold">{user.name}</div>
                    <div className="text-sm text-gray-600">{user.email}</div>
                    <div className="text-xs text-gray-500">
                      Created: {new Date(user.createdAt).toLocaleDateString()}
                      {user.hasProfile && ' • Has Profile'}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-2 text-xs"
                      onClick={() => {
                        setEmail(user.email)
                        setPassword('password123')
                      }}
                    >
                      Use This User
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Test Authentication */}
          <div className="mb-8 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <h2 className="text-xl font-semibold mb-2">2. Test Authentication</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Email:</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email to test"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Password:</label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password to test"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  👁️ Click the eye icon to show/hide password. Default test password is: <code>password123</code>
                </div>
              </div>
              <Button 
                onClick={testAuth} 
                disabled={loading || !email || !password}
                className="bg-yellow-600 hover:bg-yellow-700"
              >
                {loading ? '⏳ Testing...' : '🔍 Test Login'}
              </Button>
            </div>
          </div>

          {/* Debug Results */}
          {debugResult && (
            <div className="p-4 rounded-lg border">
              <h2 className="text-xl font-semibold mb-2">
                {debugResult.success ? '✅ Debug Results' : '❌ Debug Results'}
              </h2>
              
              <div className={`p-4 rounded ${
                debugResult.success 
                  ? 'bg-green-100 border-green-300' 
                  : 'bg-red-100 border-red-300'
              }`}>
                <div className="font-mono text-sm whitespace-pre-wrap">
                  {JSON.stringify(debugResult, null, 2)}
                </div>
              </div>

              {debugResult.success && (
                <div className="mt-4 p-3 bg-blue-100 rounded">
                  <p className="text-sm font-semibold text-blue-800">
                    ✅ Authentication should work! Try logging in with these credentials.
                  </p>
                </div>
              )}

              {!debugResult.success && debugResult.error && (
                <div className="mt-4 p-3 bg-red-100 rounded">
                  <p className="text-sm font-semibold text-red-800">
                    Error: {debugResult.error}
                  </p>
                  {debugResult.debug && (
                    <div className="mt-2 text-xs text-red-600">
                      Debug info: {JSON.stringify(debugResult.debug)}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Instructions */}
          <div className="mt-8 p-4 bg-gray-100 rounded-lg">
            <h3 className="font-semibold mb-2">🛠️ How to use this tool:</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Click "Seed Database" to create test users (password is always <code>password123</code>)</li>
              <li>Select a user from the list or enter credentials manually</li>
              <li>Click "Test Login" to see if authentication works</li>
              <li>If successful, try logging in through the normal login page</li>
              <li>If it fails, check the debug information for clues</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}
