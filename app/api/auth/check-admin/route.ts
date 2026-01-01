import { NextResponse } from 'next/server'
import { checkAdminAccess } from '@/lib/adminAuth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Check if the current user has admin access
 * GET /api/auth/check-admin
 */
export async function GET() {
  try {
    const adminUser = await checkAdminAccess()
    
    return NextResponse.json({
      isAdmin: adminUser !== null,
      user: adminUser ? {
        id: adminUser.id,
        email: adminUser.email,
        name: adminUser.name,
        role: adminUser.role
      } : null
    })
  } catch (error) {
    console.error('Error checking admin access:', error)
    return NextResponse.json(
      { isAdmin: false, error: 'Failed to check admin access' },
      { status: 500 }
    )
  }
}
