'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'

interface Analytics {
  totalUsers: number
  totalMatches: number
  totalLikes: number
  averageMatchRate: number
  dailyActiveUsers: number
  weeklyActiveUsers: number
  monthlyActiveUsers: number
  topMatchedUsers: Array<{
    id: string
    name: string
    matchCount: number
  }>
  dailyStats: Array<{
    date: string
    users: number
    matches: number
    likes: number
  }>
}

export default function AnalyticsDashboardPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month'>('week')

  useEffect(() => {
    loadAnalytics()
  }, [timeRange])

  const loadAnalytics = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/analytics?range=${timeRange}`)
      const data = await response.json()
      if (data.success) {
        setAnalytics(data.analytics)
      }
    } catch (error) {
      console.error('Error loading analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !analytics) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
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
              <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
              <p className="text-gray-600 mt-1">View app usage statistics and user behavior</p>
            </div>
            <div className="flex gap-2">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as any)}
                className="px-4 py-2 border rounded-lg"
              >
                <option value="day">Last 24 Hours</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
              </select>
              <Button onClick={() => window.location.href = '/admin'} variant="outline">
                ← Back to Admin
              </Button>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 shadow">
            <div className="flex items-center justify-between mb-2">
              <div className="text-3xl">👥</div>
              <div className="text-sm text-gray-500">Total</div>
            </div>
            <div className="text-2xl font-bold text-blue-600">{analytics.totalUsers}</div>
            <div className="text-gray-600 text-sm">Users</div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow">
            <div className="flex items-center justify-between mb-2">
              <div className="text-3xl">💕</div>
              <div className="text-sm text-gray-500">Total</div>
            </div>
            <div className="text-2xl font-bold text-pink-600">{analytics.totalMatches}</div>
            <div className="text-gray-600 text-sm">Matches</div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow">
            <div className="flex items-center justify-between mb-2">
              <div className="text-3xl">👍</div>
              <div className="text-sm text-gray-500">Total</div>
            </div>
            <div className="text-2xl font-bold text-green-600">{analytics.totalLikes}</div>
            <div className="text-gray-600 text-sm">Likes</div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow">
            <div className="flex items-center justify-between mb-2">
              <div className="text-3xl">📈</div>
              <div className="text-sm text-gray-500">Average</div>
            </div>
            <div className="text-2xl font-bold text-purple-600">
              {(analytics.averageMatchRate * 100).toFixed(1)}%
            </div>
            <div className="text-gray-600 text-sm">Match Rate</div>
          </div>
        </div>

        {/* Active Users */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 shadow">
            <div className="text-sm text-gray-600 mb-2">Daily Active Users</div>
            <div className="text-3xl font-bold text-blue-600">{analytics.dailyActiveUsers}</div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow">
            <div className="text-sm text-gray-600 mb-2">Weekly Active Users</div>
            <div className="text-3xl font-bold text-indigo-600">{analytics.weeklyActiveUsers}</div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow">
            <div className="text-sm text-gray-600 mb-2">Monthly Active Users</div>
            <div className="text-3xl font-bold text-purple-600">{analytics.monthlyActiveUsers}</div>
          </div>
        </div>

        {/* Top Matched Users */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Top Matched Users</h2>
          <div className="space-y-3">
            {analytics.topMatchedUsers.map((user, index) => (
              <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                    #{index + 1}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{user.name}</div>
                    <div className="text-sm text-gray-500">{user.matchCount} matches</div>
                  </div>
                </div>
                <div className="text-2xl">🏆</div>
              </div>
            ))}
          </div>
        </div>

        {/* Daily Stats Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Daily Activity</h2>
          <div className="space-y-4">
            {analytics.dailyStats.map((stat) => (
              <div key={stat.date} className="border-b pb-4 last:border-b-0">
                <div className="text-sm font-semibold text-gray-700 mb-2">
                  {new Date(stat.date).toLocaleDateString()}
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-xs text-gray-500">Users</div>
                    <div className="text-lg font-semibold text-blue-600">{stat.users}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Matches</div>
                    <div className="text-lg font-semibold text-pink-600">{stat.matches}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Likes</div>
                    <div className="text-lg font-semibold text-green-600">{stat.likes}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
