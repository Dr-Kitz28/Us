'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'

interface FeatureFlag {
  key: string
  name: string
  description: string
  enabled: boolean
  category: string
}

export default function FeatureFlagsPage() {
  const [flags, setFlags] = useState<FeatureFlag[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadFlags()
  }, [])

  const loadFlags = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/feature-flags')
      const data = await response.json()
      if (data.success) {
        setFlags(data.flags || [])
      }
    } catch (error) {
      console.error('Error loading flags:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleFlag = async (key: string) => {
    try {
      const response = await fetch('/api/admin/feature-flags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key })
      })
      const data = await response.json()
      if (data.success) {
        loadFlags()
      }
    } catch (error) {
      console.error('Error toggling flag:', error)
    }
  }

  const categories = Array.from(new Set(flags.map(f => f.category)))

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Feature Flags</h1>
              <p className="text-gray-600 mt-1">Enable/disable features and experiments</p>
            </div>
            <Button onClick={() => window.location.href = '/admin'} variant="outline">
              ← Back to Admin
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 shadow">
            <div className="text-2xl font-bold text-gray-900">{flags.length}</div>
            <div className="text-gray-600 text-sm">Total Features</div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow">
            <div className="text-2xl font-bold text-green-600">
              {flags.filter(f => f.enabled).length}
            </div>
            <div className="text-gray-600 text-sm">Enabled</div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow">
            <div className="text-2xl font-bold text-gray-400">
              {flags.filter(f => !f.enabled).length}
            </div>
            <div className="text-gray-600 text-sm">Disabled</div>
          </div>
        </div>

        {/* Feature Flags by Category */}
        {categories.map(category => (
          <div key={category} className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">{category}</h2>
            <div className="bg-white rounded-lg shadow divide-y">
              {flags
                .filter(f => f.category === category)
                .map(flag => (
                  <div key={flag.key} className="p-6 flex items-center justify-between hover:bg-gray-50">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{flag.name}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          flag.enabled 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {flag.enabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm">{flag.description}</p>
                      <div className="text-xs text-gray-500 mt-2 font-mono">{flag.key}</div>
                    </div>
                    <div className="ml-6">
                      <button
                        onClick={() => toggleFlag(flag.key)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          flag.enabled ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            flag.enabled ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
