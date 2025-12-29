import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const range = searchParams.get('range') || 'week'

    // Calculate date range
    const now = new Date()
    let startDate = new Date()
    if (range === 'day') {
      startDate.setDate(now.getDate() - 1)
    } else if (range === 'week') {
      startDate.setDate(now.getDate() - 7)
    } else {
      startDate.setDate(now.getDate() - 30)
    }

    // Total users
    const totalUsers = await prisma.user.count()

    // Total matches
    const totalMatches = await prisma.match.count()

    // Total likes
    const totalLikes = await prisma.like.count()

    // Average match rate
    const averageMatchRate = totalUsers > 0 ? totalMatches / (totalUsers / 2) : 0

    // Active users
    const dailyActiveUsers = await prisma.user.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      }
    })

    const weeklyActiveUsers = await prisma.user.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      }
    })

    const monthlyActiveUsers = await prisma.user.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
      }
    })

    // Top matched users
    const matchCounts = await prisma.match.groupBy({
      by: ['user1Id'],
      _count: true,
      orderBy: {
        _count: {
          user1Id: 'desc'
        }
      },
      take: 5
    })

    const topMatchedUsers = await Promise.all(
      matchCounts.map(async (mc) => {
        const user = await prisma.user.findUnique({
          where: { id: mc.user1Id }
        })
        return {
          id: mc.user1Id,
          name: user?.name || 'Unknown',
          matchCount: mc._count
        }
      })
    )

    // Daily stats
    const days = range === 'day' ? 1 : range === 'week' ? 7 : 30
    const dailyStats = []
    
    for (let i = 0; i < days; i++) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dayStart = new Date(date.setHours(0, 0, 0, 0))
      const dayEnd = new Date(date.setHours(23, 59, 59, 999))

      const users = await prisma.user.count({
        where: {
          createdAt: {
            gte: dayStart,
            lte: dayEnd
          }
        }
      })

      const matches = await prisma.match.count({
        where: {
          createdAt: {
            gte: dayStart,
            lte: dayEnd
          }
        }
      })

      const likes = await prisma.like.count({
        where: {
          createdAt: {
            gte: dayStart,
            lte: dayEnd
          }
        }
      })

      dailyStats.unshift({
        date: dayStart.toISOString(),
        users,
        matches,
        likes
      })
    }

    return NextResponse.json({
      success: true,
      analytics: {
        totalUsers,
        totalMatches,
        totalLikes,
        averageMatchRate,
        dailyActiveUsers,
        weeklyActiveUsers,
        monthlyActiveUsers,
        topMatchedUsers,
        dailyStats
      }
    })
  } catch (error) {
    console.error('Get analytics error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}
