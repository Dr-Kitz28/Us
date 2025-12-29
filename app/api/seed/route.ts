import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST() {
  try {
    console.log('🌱 Starting quick seed...')

    // Clear existing data
    await prisma.message.deleteMany()
    await prisma.match.deleteMany()
    await prisma.like.deleteMany()
    // await prisma.pass.deleteMany()  // Will add when Pass model is ready
    await prisma.photo.deleteMany()
    await prisma.profile.deleteMany()
    await prisma.user.deleteMany()

    const hashedPassword = await bcrypt.hash('password123', 10)

    // Create test users
    const users = [
      {
        email: 'alex@example.com',
        name: 'Alex Thompson',
        age: 28,
        bio: 'Love hiking and photography. Looking for someone who enjoys outdoor adventures and deep conversations.',
        interests: ['hiking', 'photography', 'travel', 'books'],
        location: 'Seattle, WA'
      },
      {
        email: 'sarah@example.com',
        name: 'Sarah Chen',
        age: 26,
        bio: 'Coffee enthusiast and yoga instructor. Passionate about mindfulness and sustainable living.',
        interests: ['yoga', 'coffee', 'meditation', 'sustainability'],
        location: 'Portland, OR'
      },
      {
        email: 'mike@example.com',
        name: 'Mike Rodriguez',
        age: 31,
        bio: 'Software engineer who loves cooking and playing guitar. Always up for trying new restaurants.',
        interests: ['cooking', 'music', 'technology', 'food'],
        location: 'San Francisco, CA'
      },
      {
        email: 'emma@example.com',
        name: 'Emma Wilson',
        age: 29,
        bio: 'Artist and dog lover. I paint landscapes and volunteer at the local animal shelter.',
        interests: ['art', 'dogs', 'volunteering', 'nature'],
        location: 'Austin, TX'
      },
      {
        email: 'david@example.com',
        name: 'David Kim',
        age: 27,
        bio: 'Fitness trainer and rock climbing enthusiast. Looking for an active partner to share adventures with.',
        interests: ['fitness', 'climbing', 'adventure', 'health'],
        location: 'Denver, CO'
      }
    ]

    const createdUsers = []

    for (const userData of users) {
      const user = await prisma.user.create({
        data: {
          email: userData.email,
          name: userData.name,
          password: hashedPassword,
          profile: {
            create: {
              age: userData.age,
              bio: userData.bio,
              interests: JSON.stringify(userData.interests),
              location: userData.location
            }
          }
        },
        include: { profile: true }
      })

      // Create photos for each user
      await prisma.photo.createMany({
        data: [
          { userId: user.id, url: `https://picsum.photos/400/500?random=${Math.floor(Math.random() * 1000)}` },
          { userId: user.id, url: `https://picsum.photos/400/500?random=${Math.floor(Math.random() * 1000)}` },
          { userId: user.id, url: `https://picsum.photos/400/500?random=${Math.floor(Math.random() * 1000)}` }
        ]
      })

      createdUsers.push(user)
      console.log(`✅ Created user: ${user.name}`)
    }

    // Create some likes
    if (createdUsers.length >= 2) {
      await prisma.like.create({
        data: {
          fromId: createdUsers[0].id,
          toId: createdUsers[1].id
        }
      })

      await prisma.like.create({
        data: {
          fromId: createdUsers[1].id,
          toId: createdUsers[0].id
        }
      })

      // Create match
      await prisma.match.create({
        data: {
          user1Id: createdUsers[0].id,
          user2Id: createdUsers[1].id
        }
      })
      
      console.log(`💕 Created match between ${createdUsers[0].name} and ${createdUsers[1].name}`)
    }

    return NextResponse.json({ 
      success: true, 
      message: `Successfully seeded database with ${createdUsers.length} users`,
      users: createdUsers.map(u => ({ id: u.id, name: u.name, email: u.email }))
    })

  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      include: { 
        profile: true,
        photos: true,
        _count: {
          select: {
            likesGiven: true,
            likesReceived: true,
            matches1: true,
            matches2: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      count: users.length,
      users: users.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        profile: user.profile,
        photoCount: user.photos.length,
        stats: user._count
      }))
    })

  } catch (error) {
    console.error('Get users error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}
