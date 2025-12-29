import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const name = formData.get('name') as string
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    if (!name || !email || !password) {
      return NextResponse.redirect(new URL('/register?error=missing-fields', request.url))
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.redirect(new URL('/register?error=user-exists', request.url))
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user with nested profile data if provided
    const phone = formData.get('phone') as string | null
    const ageRaw = formData.get('age') as string | null
    const age = ageRaw ? parseInt(ageRaw, 10) : null
    const gender = formData.get('gender') as string | null
    const location = formData.get('location') as string | null
    const bio = formData.get('bio') as string | null

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        profile: {
          create: {
            bio: bio ?? undefined,
            interests: null,
            gender: gender ?? undefined,
            location: location ?? undefined,
            age: age ?? undefined
          }
        }
      }
    })

    // Redirect to login with success message
    return NextResponse.redirect(new URL('/login?message=account-created', request.url))

  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.redirect(new URL('/register?error=server-error', request.url))
  }
}
