import { prisma } from '../lib/prisma'

async function main(){
  const users = await prisma.user.findMany({ include: { profile: true, photos: true } })
  console.log(JSON.stringify(users, null, 2))
}

main()
  .catch(e=>{ console.error(e); process.exit(1) })
  .finally(()=>prisma.$disconnect())
