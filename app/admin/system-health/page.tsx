'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy'
  database: {
    connected: boolean
    responseTime: number
  }
  cache: {
    connected: boolean
    responseTime: number
  }
  api: {
    responseTime: number
    errors: number
  }
  system: {
    uptime: number
    memory: {
      used: number
      total: number
      percentage: number
    }
  }
  metrics: {
    requestsPerMinute: number
    averageResponseTime: number
    errorRate: number
  }
}

export default function SystemHealthPage() {
  const [health, setHealth] = useState<HealthStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)

  useEffect(() => {
    loadHealth()
    
    if (autoRefresh) {
      const interval = setInterval(loadHealth, 5000) // Refresh every 5 seconds
      return () => clearInterval(interval)
    }
  }, [autoRefresh])

  const loadHealth = async () => {
    try {
      const response = await fetch('/api/admin/health')
      const data = await response.json()
      if (data.success) {
        setHealth(data.health)
      }
    } catch (error) {
      console.error('Error loading health:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-500'
      case 'degraded': return 'bg-yellow-500'
      case 'unhealthy': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'healthy': return '✓ Healthy'
      case 'degraded': return '⚠ Degraded'
      case 'unhealthy': return '✗ Unhealthy'
      default: return 'Unknown'
    }
  }

  if (loading || !health) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
      </div>
    )
  }

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${days}d ${hours}h ${minutes}m`
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">System Health</h1>
              <p className="text-gray-600 mt-1">Monitor system performance, API health, and error logs</p>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={() => setAutoRefresh(!autoRefresh)}
                variant={autoRefresh ? 'default' : 'outline'}
              >
                {autoRefresh ? '🔄 Auto-refresh ON' : '⏸ Auto-refresh OFF'}
              </Button>
              <Button onClick={() => window.location.href = '/admin'} variant="outline">
                ← Back to Admin
              </Button>
            </div>
          </div>
        </div>

        {/* Overall Status */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-full ${getStatusColor(health.status)} flex items-center justify-center text-white text-2xl`}>
              {health.status === 'healthy' ? '✓' : health.status === 'degraded' ? '⚠' : '✗'}
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{getStatusText(health.status)}</div>
              <div className="text-gray-600">All systems operational</div>
            </div>
          </div>
        </div>

        {/* Services Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Database */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="text-3xl">🗄️</div>
                <h3 className="text-lg font-semibold text-gray-900">Database</h3>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                health.database.connected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {health.database.connected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            <div className="text-sm text-gray-600">
              Response Time: <span className="font-semibold">{health.database.responseTime}ms</span>
            </div>
          </div>

          {/* Cache */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="text-3xl">⚡</div>
                <h3 className="text-lg font-semibold text-gray-900">Cache (Redis)</h3>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                health.cache.connected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {health.cache.connected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            <div className="text-sm text-gray-600">
              Response Time: <span className="font-semibold">{health.cache.responseTime}ms</span>
            </div>
          </div>

          {/* API */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="text-3xl">🌐</div>
                <h3 className="text-lg font-semibold text-gray-900">API</h3>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Response Time:</span>
                <span className="font-semibold">{health.api.responseTime}ms</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Errors:</span>
                <span className="font-semibold text-red-600">{health.api.errors}</span>
              </div>
            </div>
          </div>

          {/* System Resources */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="text-3xl">💻</div>
                <h3 className="text-lg font-semibold text-gray-900">System</h3>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Uptime:</span>
                <span className="font-semibold">{formatUptime(health.system.uptime)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Memory:</span>
                <span className="font-semibold">{health.system.memory.percentage.toFixed(1)}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Metrics */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Performance Metrics</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="text-sm text-gray-600 mb-1">Requests Per Minute</div>
              <div className="text-3xl font-bold text-blue-600">{health.metrics.requestsPerMinute}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">Average Response Time</div>
              <div className="text-3xl font-bold text-purple-600">{health.metrics.averageResponseTime}ms</div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">Error Rate</div>
              <div className="text-3xl font-bold text-red-600">{(health.metrics.errorRate * 100).toFixed(2)}%</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
