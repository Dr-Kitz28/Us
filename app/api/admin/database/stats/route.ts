import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Get counts for all main tables
    const [users, matches, likes, messages, photos, profiles] = await Promise.all([
      prisma.user.count(),
      prisma.match.count(),
      prisma.like.count(),
      prisma.message.count(),
      prisma.photo.count(),
      prisma.profile.count()
    ])

    return NextResponse.json({
      success: true,
      stats: {
        users,
        matches,
        likes,
        messages,
        photos,
        profiles,
        totalRecords: users + matches + likes + messages + photos + profiles
      }
    })
  } catch (error) {
    console.error('Get database stats error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get database stats' },
      { status: 500 }
    )
  }
}
