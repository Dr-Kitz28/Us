#!/usr/bin/env tsx
import { prisma } from '../lib/prisma'

async function main() {
  const [, , matchId, ...rest] = process.argv
  if (!matchId || rest.length === 0) {
    console.error('Usage: npx tsx scripts/insert_message.ts <matchId> "<message content>" [asUser=1|2]')
    process.exit(1)
  }

  const asUserArg = rest.length > 1 ? rest[rest.length - 1] : '1'
  const contentParts = rest.length > 1 ? rest.slice(0, -1) : [rest[0]]
  const content = contentParts.join(' ')
  const asUser = asUserArg === '2' ? 2 : 1

  try {
    const match = await prisma.match.findUnique({ where: { id: matchId } })
    if (!match) {
      console.error('Match not found:', matchId)
      process.exit(1)
    }

    const senderId = asUser === 1 ? match.user1Id : match.user2Id

    const msg = await prisma.message.create({
      data: {
        matchId: match.id,
        senderId,
        content
      }
    })

    console.log('Inserted message:', JSON.stringify({ id: msg.id, content: msg.content, senderId: msg.senderId, createdAt: msg.createdAt }, null, 2))
  } catch (err) {
    console.error('Error inserting message:', err)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
