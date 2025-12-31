import bcrypt from 'bcryptjs'
import { db, users, profiles, photos, likes, matches, messages } from '@/lib/db'

async function main(){
  console.log('🌱 Starting Drizzle database seeding...')

  // Clear existing data (order matters for FK constraints)
  await db.delete(messages).where(true)
  await db.delete(matches).where(true)
  await db.delete(likes).where(true)
  await db.delete(photos).where(true)
  await db.delete(profiles).where(true)
  await db.delete(users).where(true)

  const usersData = [
    { email: 'alex@example.com', name: 'Alex Thompson', age: 28, bio: 'Love hiking and photography. Looking for someone who enjoys outdoor adventures and deep conversations.', interests: ['hiking','photography','travel','books'], location: 'Seattle, WA' },
    { email: 'sarah@example.com', name: 'Sarah Chen', age: 26, bio: 'Coffee enthusiast and yoga instructor. Passionate about mindfulness and sustainable living.', interests: ['yoga','coffee','meditation','sustainability'], location: 'Portland, OR' },
    { email: 'mike@example.com', name: 'Mike Rodriguez', age: 31, bio: 'Software engineer who loves cooking and playing guitar. Always up for trying new restaurants.', interests: ['cooking','music','technology','food'], location: 'San Francisco, CA' },
    { email: 'emma@example.com', name: 'Emma Wilson', age: 29, bio: 'Artist and dog lover. I paint landscapes and volunteer at the local animal shelter.', interests: ['art','dogs','volunteering','nature'], location: 'Austin, TX' },
    { email: 'david@example.com', name: 'David Kim', age: 27, bio: 'Fitness trainer and rock climbing enthusiast. Looking for an active partner to share adventures with.', interests: ['fitness','climbing','adventure','health'], location: 'Denver, CO' },
    { email: 'lily@example.com', name: 'Lily Patel', age: 25, bio: 'Medical student who loves to dance and explore new cultures. Fluent in three languages.', interests: ['dancing','culture','languages','medicine'], location: 'New York, NY' },
    { email: 'james@example.com', name: "James O'Connor", age: 30, bio: 'Teacher and weekend warrior. I coach little league and love board games.', interests: ['teaching','sports','games','kids'], location: 'Boston, MA' },
    { email: 'zoe@example.com', name: 'Zoe Martinez', age: 24, bio: 'Marine biologist and ocean conservationist. Scuba diving is my passion!', interests: ['ocean','diving','conservation','science'], location: 'San Diego, CA' },
    { email: 'ryan@example.com', name: 'Ryan Foster', age: 32, bio: 'Chef and wine enthusiast. I believe the best conversations happen over a good meal.', interests: ['cooking','wine','restaurants','travel'], location: 'Chicago, IL' },
    { email: 'ava@example.com', name: 'Ava Johnson', age: 26, bio: 'Graphic designer and vintage vinyl collector. Love indie films and weekend farmers markets.', interests: ['design','music','films','vintage'], location: 'Minneapolis, MN' }
  ]

  const hashed = await bcrypt.hash('password123', 10)
  const createdUsers: Array<{ id: string, name: string }> = []

  for(const u of usersData){
    const [inserted] = await db.insert(users).values({
      email: u.email,
      password: hashed,
      name: u.name,
    }).returning({ id: users.id, name: users.name })

    await db.insert(profiles).values({
      userId: inserted.id,
      bio: u.bio,
      interests: JSON.stringify(u.interests),
      location: u.location,
      age: u.age
    })

    await db.insert(photos).values([
      { userId: inserted.id, url: `https://picsum.photos/400/500?random=${Math.floor(Math.random()*1000)}` },
      { userId: inserted.id, url: `https://picsum.photos/400/500?random=${Math.floor(Math.random()*1000)}` },
      { userId: inserted.id, url: `https://picsum.photos/400/500?random=${Math.floor(Math.random()*1000)}` },
    ])

    console.log('✅ Created user:', u.name)
    createdUsers.push({ id: inserted.id, name: inserted.name })
  }

  // matches (mutual likes)
  const matchPairs = [ [0,1],[2,3],[4,5],[6,7] ]
  for(const [a,b] of matchPairs){
    const u1 = createdUsers[a]
    const u2 = createdUsers[b]
    await db.insert(likes).values({ fromId: u1.id, toId: u2.id }).onConflictDoNothing()
    await db.insert(likes).values({ fromId: u2.id, toId: u1.id }).onConflictDoNothing()
    const [m] = await db.insert(matches).values({ user1Id: u1.id < u2.id ? u1.id : u2.id, user2Id: u1.id < u2.id ? u2.id : u1.id }).returning({ id: matches.id })
    await db.insert(messages).values([
      { matchId: m.id, senderId: u1.id, content: `Hi ${u2.name}! Great to match with you 😊` },
      { matchId: m.id, senderId: u2.id, content: `Hey ${u1.name}! Thanks for the like, excited to chat!` }
    ])
    console.log(`💕 Created match between ${u1.name} and ${u2.name}`)
  }

  // one-way likes
  const oneWay = [ [8,0],[9,2],[1,4],[3,6],[5,8],[7,9] ]
  for(const [a,b] of oneWay){
    const liker = createdUsers[a]
    const liked = createdUsers[b]
    await db.insert(likes).values({ fromId: liker.id, toId: liked.id }).onConflictDoNothing()
    console.log(`👍 ${liker.name} liked ${liked.name}`)
  }

  console.log('🎉 Drizzle seeding completed')
}

main().then(()=> process.exit(0)).catch(e=>{ console.error(e); process.exit(1) })
