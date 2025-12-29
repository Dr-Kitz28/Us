import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const startTime = Date.now()

    // Test database connection
    const dbStart = Date.now()
    let dbConnected = false
    try {
      await prisma.user.findFirst()
      dbConnected = true
    } catch (error) {
      console.error('Database health check failed:', error)
    }
    const dbResponseTime = Date.now() - dbStart

    // Test cache connection (mock for now)
    const cacheStart = Date.now()
    const cacheConnected = false // Will be true once Redis is set up
    const cacheResponseTime = Date.now() - cacheStart

    // System metrics
    const memUsage = process.memoryUsage()
    const uptime = process.uptime()

    // Determine overall health
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy'
    if (!dbConnected) {
      status = 'unhealthy'
    } else if (!cacheConnected || dbResponseTime > 1000) {
      status = 'degraded'
    }

    return NextResponse.json({
      success: true,
      health: {
        status,
        database: {
          connected: dbConnected,
          responseTime: dbResponseTime
        },
        cache: {
          connected: cacheConnected,
          responseTime: cacheResponseTime
        },
        api: {
          responseTime: Date.now() - startTime,
          errors: 0
        },
        system: {
          uptime,
          memory: {
            used: memUsage.heapUsed,
            total: memUsage.heapTotal,
            percentage: (memUsage.heapUsed / memUsage.heapTotal) * 100
          }
        },
        metrics: {
          requestsPerMinute: Math.floor(Math.random() * 100), // Mock
          averageResponseTime: dbResponseTime,
          errorRate: 0
        }
      }
    })
  } catch (error) {
    console.error('Health check error:', error)
    return NextResponse.json({
      success: true,
      health: {
        status: 'unhealthy',
        database: { connected: false, responseTime: 0 },
        cache: { connected: false, responseTime: 0 },
        api: { responseTime: 0, errors: 1 },
        system: { uptime: 0, memory: { used: 0, total: 0, percentage: 0 } },
        metrics: { requestsPerMinute: 0, averageResponseTime: 0, errorRate: 1 }
      }
    })
  }
}
