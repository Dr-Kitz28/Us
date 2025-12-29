#!/usr/bin/env tsx
import { prisma } from '../lib/prisma'

async function main() {
  const email = 'upload_test@example.com'
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    console.error('Test user not found. Run: npx tsx scripts/setup_two_users.ts')
    process.exit(1)
  }

  const matches = await prisma.match.findMany({
    where: { OR: [{ user1Id: user.id }, { user2Id: user.id }] },
    include: {
      user1: { select: { id: true, name: true, email: true } },
      user2: { select: { id: true, name: true, email: true } },
      messages: { orderBy: { createdAt: 'asc' }, include: { sender: { select: { id: true, name: true, email: true } } } }
    }
  })

  console.log(JSON.stringify(matches, null, 2))
  await prisma.$disconnect()
}

main().catch(e => { console.error(e); process.exit(1) })
