/**
 * Admin Authentication and Authorization Utilities
 * 
 * Provides role-based access control for admin routes
 */

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

/**
 * Check if the current user is an admin
 * Returns user object if admin, null otherwise
 */
export async function checkAdminAccess() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.email) {
    return null
  }

  const userResults = await db
    .select()
    .from(users)
    .where(eq(users.email, session.user.email))
    .limit(1)

  const user = userResults[0]
  
  if (!user || user.role !== 'admin') {
    return null
  }

  return user
}

/**
 * Check if a user ID has admin role
 */
export async function isUserAdmin(userId: string): Promise<boolean> {
  const userResults = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)

  const user = userResults[0]
  return user?.role === 'admin'
}

/**
 * Get all admin users
 */
export async function getAdminUsers() {
  return await db
    .select()
    .from(users)
    .where(eq(users.role, 'admin'))
}
