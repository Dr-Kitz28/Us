import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST() {
  try {
    // Delete all data in order (respecting foreign key constraints)
    await prisma.message.deleteMany()
    await prisma.match.deleteMany()
    await prisma.like.deleteMany()
    await prisma.pass.deleteMany()
    await prisma.photo.deleteMany()
    await prisma.profile.deleteMany()
    await prisma.user.deleteMany()

    return NextResponse.json({
      success: true,
      message: 'Database reset successfully - all data deleted'
    })
  } catch (error) {
    console.error('Database reset error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to reset database' },
      { status: 500 }
    )
  }
}
