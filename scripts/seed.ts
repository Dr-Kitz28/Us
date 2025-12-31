import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// Safety: require an admin token to run production seeding so only an
// authorized admin can populate demo data. Set `SEED_ADMIN_TOKEN` in your
// environment before running the seed script. This prevents accidental
// seeding in production by regular users or CI.
if (process.env.NODE_ENV === 'production' && !process.env.SEED_ADMIN_TOKEN) {
  console.error('Refusing to run seed in production without SEED_ADMIN_TOKEN set')
  process.exit(1)
}

async function main() {
  console.log('🌱 Starting database seeding...')

  // Require the admin token to be present for manual runs (even in non-prod)
  // when the repository owner wants to ensure only admin can run the demo seed.
  if (!process.env.SEED_ADMIN_TOKEN) {
    console.warn('SEED_ADMIN_TOKEN not set. Aborting seed to prevent accidental demo data insertion.')
    process.exit(1)
  }

  // Clear existing data
  await prisma.message.deleteMany()
  await prisma.match.deleteMany()
  await prisma.like.deleteMany()
  await prisma.photo.deleteMany()
  await prisma.profile.deleteMany()
  await prisma.user.deleteMany()

  // Create test users with profiles
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
    },
    {
      email: 'lily@example.com',
      name: 'Lily Patel',
      age: 25,
      bio: 'Medical student who loves to dance and explore new cultures. Fluent in three languages.',
      interests: ['dancing', 'culture', 'languages', 'medicine'],
      location: 'New York, NY'
    },
    {
      email: 'james@example.com',
      name: 'James O\'Connor',
      age: 30,
      bio: 'Teacher and weekend warrior. I coach little league and love board games.',
      interests: ['teaching', 'sports', 'games', 'kids'],
      location: 'Boston, MA'
    },
    {
      email: 'zoe@example.com',
      name: 'Zoe Martinez',
      age: 24,
      bio: 'Marine biologist and ocean conservationist. Scuba diving is my passion!',
      interests: ['ocean', 'diving', 'conservation', 'science'],
      location: 'San Diego, CA'
    },
    {
      email: 'ryan@example.com',
      name: 'Ryan Foster',
      age: 32,
      bio: 'Chef and wine enthusiast. I believe the best conversations happen over a good meal.',
      interests: ['cooking', 'wine', 'restaurants', 'travel'],
      location: 'Chicago, IL'
    },
    {
      email: 'ava@example.com',
      name: 'Ava Johnson',
      age: 26,
      bio: 'Graphic designer and vintage vinyl collector. Love indie films and weekend farmers markets.',
      interests: ['design', 'music', 'films', 'vintage'],
      location: 'Minneapolis, MN'
    }
  ]

  const hashedPassword = await bcrypt.hash('password123', 10)

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
    
    console.log(`✅ Created user: ${user.name}`)
  }

  // Create some likes and matches to make it interesting
  const allUsers = await prisma.user.findMany({ include: { profile: true } })
  
  // Create some mutual likes (matches)
  const matches = [
    [0, 1], // Alex likes Sarah, Sarah likes Alex
    [2, 3], // Mike likes Emma, Emma likes Mike
    [4, 5], // David likes Lily, Lily likes David
    [6, 7], // James likes Zoe, Zoe likes James
  ]

  for (const [userIndex1, userIndex2] of matches) {
    const user1 = allUsers[userIndex1]
    const user2 = allUsers[userIndex2]

    // User1 likes User2
    await prisma.like.create({
      data: {
        fromId: user1.id,
        toId: user2.id
      }
    })

    // User2 likes User1 (mutual like = match)
    await prisma.like.create({
      data: {
        fromId: user2.id,
        toId: user1.id
      }
    })

    // Create match
    const match = await prisma.match.create({
      data: {
        user1Id: user1.id,
        user2Id: user2.id
      }
    })

    // Add some messages to the match
    await prisma.message.createMany({
      data: [
        {
          matchId: match.id,
          senderId: user1.id,
          content: `Hi ${user2.name}! Great to match with you 😊`
        },
        {
          matchId: match.id,
          senderId: user2.id,
          content: `Hey ${user1.name}! Thanks for the like, excited to chat!`
        }
      ]
    })

    console.log(`💕 Created match between ${user1.name} and ${user2.name}`)
  }

  // Create some one-way likes
  const oneWayLikes = [
    [8, 0], // Ryan likes Alex
    [9, 2], // Ava likes Mike
    [1, 4], // Sarah likes David
    [3, 6], // Emma likes James
    [5, 8], // Lily likes Ryan
    [7, 9], // Zoe likes Ava
  ]

  for (const [likerIndex, likedIndex] of oneWayLikes) {
    const liker = allUsers[likerIndex]
    const liked = allUsers[likedIndex]

    await prisma.like.create({
      data: {
        fromId: liker.id,
        toId: liked.id
      }
    })

    console.log(`👍 ${liker.name} liked ${liked.name}`)
  }

  console.log('🎉 Database seeding completed!')
  console.log(`📊 Created ${users.length} users, ${matches.length} matches, and ${oneWayLikes.length} one-way likes`)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
