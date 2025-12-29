import { prisma } from "../lib/prisma";
import bcrypt from "bcryptjs";

async function main() {
  const users = await prisma.user.findMany();
  let updated = 0;
  for (const u of users) {
    const pw = u.password || "";
    if (!pw.startsWith("$2a$") && !pw.startsWith("$2b$") && !pw.startsWith("$2y$")) {
      const hashed = await bcrypt.hash(pw, 12);
      await prisma.user.update({ where: { id: u.id }, data: { password: hashed } });
      console.log("Hashed:", u.email);
      updated++;
    }
  }
  console.log("Updated passwords:", updated);
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
