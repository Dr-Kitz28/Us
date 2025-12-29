'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

export default function DatabaseToolsPage() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const runBackup = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/database/backup', { method: 'POST' })
      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({ error: 'Failed to backup database' })
    } finally {
      setLoading(false)
    }
  }

  const runMigrations = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/database/migrate', { method: 'POST' })
      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({ error: 'Failed to run migrations' })
    } finally {
      setLoading(false)
    }
  }

  const seedDatabase = async () => {
    if (!confirm('This will add test data to the database. Continue?')) return
    
    try {
      setLoading(true)
      const response = await fetch('/api/seed', { method: 'POST' })
      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({ error: 'Failed to seed database' })
    } finally {
      setLoading(false)
    }
  }

  const resetDatabase = async () => {
    if (!confirm('⚠️ This will DELETE ALL DATA! Are you absolutely sure?')) return
    if (!confirm('Last chance! This action CANNOT be undone!')) return
    
    try {
      setLoading(true)
      const response = await fetch('/api/admin/database/reset', { method: 'POST' })
      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({ error: 'Failed to reset database' })
    } finally {
      setLoading(false)
    }
  }

  const getStats = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/database/stats')
      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({ error: 'Failed to get database stats' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Database Tools</h1>
              <p className="text-gray-600 mt-1">Database management, backups, and data migration</p>
            </div>
            <Button onClick={() => window.location.href = '/admin'} variant="outline">
              ← Back to Admin
            </Button>
          </div>
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Database Stats */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl mb-2">📊</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Database Statistics</h3>
            <p className="text-gray-600 text-sm mb-4">
              View table sizes, record counts, and database health
            </p>
            <Button 
              onClick={getStats} 
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Loading...' : 'Get Statistics'}
            </Button>
          </div>

          {/* Backup */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl mb-2">💾</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Backup Database</h3>
            <p className="text-gray-600 text-sm mb-4">
              Create a backup of the current database state
            </p>
            <Button 
              onClick={runBackup} 
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {loading ? 'Creating...' : 'Create Backup'}
            </Button>
          </div>

          {/* Migrations */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl mb-2">🔄</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Run Migrations</h3>
            <p className="text-gray-600 text-sm mb-4">
              Apply pending database schema migrations
            </p>
            <Button 
              onClick={runMigrations} 
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {loading ? 'Running...' : 'Run Migrations'}
            </Button>
          </div>

          {/* Seed Data */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl mb-2">🌱</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Seed Test Data</h3>
            <p className="text-gray-600 text-sm mb-4">
              Add test users, matches, and sample data
            </p>
            <Button 
              onClick={seedDatabase} 
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {loading ? 'Seeding...' : 'Seed Database'}
            </Button>
          </div>

          {/* Reset Database */}
          <div className="bg-white rounded-lg shadow p-6 border-2 border-red-200">
            <div className="text-2xl mb-2">⚠️</div>
            <h3 className="text-lg font-semibold text-red-700 mb-2">Reset Database</h3>
            <p className="text-gray-600 text-sm mb-4">
              Delete all data and reset to empty state (DANGER!)
            </p>
            <Button 
              onClick={resetDatabase} 
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-700"
            >
              {loading ? 'Resetting...' : 'Reset Database'}
            </Button>
          </div>
        </div>

        {/* Result Display */}
        {result && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Result</h3>
              <Button onClick={() => setResult(null)} variant="outline" className="text-sm">
                Clear
              </Button>
            </div>
            <pre className="bg-gray-50 p-4 rounded-lg overflow-auto text-sm">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}
