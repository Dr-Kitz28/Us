import { prisma } from '../lib/prisma'

async function main() {
  const email = 'upload_test@example.com'
  // create or return existing
  let user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    user = await prisma.user.create({
      data: {
        email,
        password: 'password',
        name: 'Upload Test User',
      },
    })
    console.log('created', user.id)
  } else {
    console.log('exists', user.id)
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
