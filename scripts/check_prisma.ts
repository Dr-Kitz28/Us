import { prisma } from '../lib/prisma'

console.log('Prisma shim present (delegates to Drizzle).')
console.log(typeof prisma)

await prisma.$disconnect?.()
