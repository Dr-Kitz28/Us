import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ 
        success: false, 
        error: 'Email and password required' 
      }, { status: 400 })
    }

    // Find user
    const user = await prisma.user.findUnique({ 
      where: { email },
      include: { profile: true }
    })

    if (!user) {
      return NextResponse.json({ 
        success: false, 
        error: 'User not found',
        debug: {
          searchedEmail: email,
          userExists: false
        }
      }, { status: 404 })
    }

    // Check password
    const passwordMatch = await bcrypt.compare(password, user.password)

    return NextResponse.json({
      success: passwordMatch,
      error: passwordMatch ? null : 'Invalid password',
      debug: {
        userId: user.id,
        email: user.email,
        name: user.name,
        hasProfile: !!user.profile,
        passwordLength: password.length,
        storedHashLength: user.password.length,
        passwordMatch
      }
    })

  } catch (error) {
    console.error('Debug auth error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    // List all users with basic info (no passwords)
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        profile: {
          select: {
            age: true,
            location: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      userCount: users.length,
      users: users.map(user => ({
        id: user.id,
        email: user.email,
        name: user.name,
        hasProfile: !!user.profile,
        createdAt: user.createdAt
      }))
    })

  } catch (error) {
    console.error('Debug users error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}
