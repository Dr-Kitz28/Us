import { prisma } from '../lib/prisma'
import bcrypt from 'bcryptjs'

async function main() {
  const email = process.argv[2] || 'alex@example.com'
  const password = process.argv[3] || 'password123'

  console.log('Checking user:', email)

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    console.log(JSON.stringify({ success: false, error: 'User not found' }))
    return
  }

  const storedLen = user.password ? user.password.length : 0
  const match = await bcrypt.compare(password, user.password)

  console.log(JSON.stringify({
    success: true,
    userId: user.id,
    email: user.email,
    name: user.name,
    storedHashLength: storedLen,
    passwordMatch: match
  }, null, 2))
}

main().catch((e) => {
  console.error('Error running check_debug:', e)
  process.exit(1)
})
