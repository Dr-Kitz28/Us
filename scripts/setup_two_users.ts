import { prisma } from '../lib/prisma'

async function main() {
  // Ensure user A exists (we created upload_test@example.com earlier)
  const emailA = 'upload_test@example.com'
  let userA = await prisma.user.findUnique({ where: { email: emailA } })
  if (!userA) {
    userA = await prisma.user.create({ data: { email: emailA, password: 'password', name: 'User A' } })
    console.log('Created userA', userA.id)
  } else {
    console.log('Found userA', userA.id)
  }

  // Create user B
  const emailB = 'upload_test2@example.com'
  let userB = await prisma.user.findUnique({ where: { email: emailB } })
  if (!userB) {
    userB = await prisma.user.create({ data: { email: emailB, password: 'password', name: 'User B' } })
    console.log('Created userB', userB.id)
  } else {
    console.log('Found userB', userB.id)
  }

  // Reassign Woman1.jpg photo to userB
  const womanPhoto = await prisma.photo.findFirst({ where: { url: '/uploads/Woman1.jpg' } })
  if (womanPhoto) {
    await prisma.photo.update({ where: { id: womanPhoto.id }, data: { userId: userB.id } })
    console.log('Reassigned Woman1.jpg to userB')
  } else {
    // Create photo if missing
    await prisma.photo.create({ data: { userId: userB.id, url: '/uploads/Woman1.jpg' } })
    console.log('Created Woman1.jpg photo for userB')
  }

  // Ensure Man1.jpg is assigned to userA
  const manPhoto = await prisma.photo.findFirst({ where: { url: '/uploads/Man1.jpg' } })
  if (manPhoto) {
    await prisma.photo.update({ where: { id: manPhoto.id }, data: { userId: userA.id } })
    console.log('Assigned Man1.jpg to userA')
  } else {
    await prisma.photo.create({ data: { userId: userA.id, url: '/uploads/Man1.jpg' } })
    console.log('Created Man1.jpg photo for userA')
  }

  // Create likes: A -> B and B -> A
  const likeAB = await prisma.like.upsert({
    where: { fromId_toId: { fromId: userA.id, toId: userB.id } },
    update: {},
    create: { fromId: userA.id, toId: userB.id }
  })
  const likeBA = await prisma.like.upsert({
    where: { fromId_toId: { fromId: userB.id, toId: userA.id } },
    update: {},
    create: { fromId: userB.id, toId: userA.id }
  })
  console.log('Created mutual likes')

  // Create match if not exists (ensure user1Id < user2Id ordering for uniqueness)
  const [u1, u2] = userA.id < userB.id ? [userA.id, userB.id] : [userB.id, userA.id]
  const existingMatch = await prisma.match.findUnique({ where: { user1Id_user2Id: { user1Id: u1, user2Id: u2 } } }).catch(() => null)
  if (!existingMatch) {
    const match = await prisma.match.create({ data: { user1Id: u1, user2Id: u2 } })
    console.log('Created match', match.id)
  } else {
    console.log('Match already exists')
  }

  // Print summary
  const photos = await prisma.photo.findMany({ where: { url: { in: ['/uploads/Man1.jpg', '/uploads/Woman1.jpg'] } } })
  const matches = await prisma.match.findMany()
  console.log('Photos:', photos)
  console.log('Matches:', matches)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
