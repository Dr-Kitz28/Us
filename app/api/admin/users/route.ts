import { NextRequest, NextResponse } from 'next/server'
export const runtime = 'nodejs'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      include: {
        profile: true,
        _count: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Normalize counts to the shape the admin UI expects
    const normalized = users.map((u: any) => {
      const counts = u._count || {}
      const likes = (counts.likesGiven || 0) + (counts.likesReceived || 0)
      const matches = (counts.matches1 || 0) + (counts.matches2 || 0)
      const photos = counts.photos || 0

      return {
        ...u,
        _count: {
          likes,
          matches,
          photos
        }
      }
    })

    return NextResponse.json({
      success: true,
      users: normalized,
      count: normalized.length
    })
  } catch (error) {
    console.error('Get users error:', error)
    const msg = (error instanceof Error) ? error.message : String(error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch users', details: msg },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('id')

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID required' },
        { status: 400 }
      )
    }

    // Delete user and cascade delete related data
    await prisma.user.delete({
      where: { id: userId }
    })

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully'
    })
  } catch (error) {
    console.error('Delete user error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete user' },
      { status: 500 }
    )
  }
}
