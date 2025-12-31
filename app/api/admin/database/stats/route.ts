import { NextResponse } from 'next/server'
export const runtime = 'nodejs'

export async function GET() {
  // Lazy-import prisma to avoid triggering DB setup at module-import time
  // If DATABASE_URL is SQLite in a production-like environment, skip DB calls
  const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1'
  const dbUrl = process.env.DATABASE_URL || ''
  if (isProduction && (dbUrl.startsWith('file:') || dbUrl.includes('sqlite'))) {
    return NextResponse.json({
      success: false,
      error: 'SQLite is not supported in production. Configure a PostgreSQL DATABASE_URL.'
    })
  }

  let prisma
  try {
    prisma = (await import('@/lib/prisma')).prisma
  } catch (impErr) {
    console.error('Prisma import error in stats route:', impErr)
    return NextResponse.json({ success: false, error: 'Database not configured' }, { status: 500 })
  }

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
  } catch (error: any) {
    console.error('Get database stats error:', error)

    if (String(error?.message || '').includes('SQLite is not supported in production')) {
      return NextResponse.json({
        success: false,
        error: 'SQLite is not supported in production. Configure a PostgreSQL DATABASE_URL.'
      })
    }

    return NextResponse.json({ success: false, error: 'Failed to get database stats' }, { status: 500 })
  }
}
