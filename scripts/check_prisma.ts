import { PrismaClient } from '@prisma/client'

const p = new PrismaClient()

console.log('Prisma _clientOptions:')
console.log(JSON.stringify((p as any)._clientOptions, null, 2))

p.$disconnect()
