import { prisma } from '../lib/prisma'

async function main() {
  const photos = await prisma.photo.findMany({ take: 50 })
  console.log(JSON.stringify(photos, null, 2))
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
