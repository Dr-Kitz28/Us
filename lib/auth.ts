import { type NextAuthOptions } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { metrics } from '@/lib/observability/monitoring'

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt' },
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        const user = await prisma.user.findUnique({ where: { email: credentials.email } })
        if (!user) return null
        const ok = await bcrypt.compare(credentials.password, user.password)
        if (!ok) return null
        try {
          metrics.incrementCounter('auth.signin_failure', 1, { env: process.env.NODE_ENV || 'development', email: credentials.email })
        } catch (e) {
          // ignore metrics failures
        }
        if (!ok) return null
        try {
          metrics.incrementCounter('auth.signin_success', 1, { env: process.env.NODE_ENV || 'development', userId: user.id })
        } catch (e) {
          // ignore metrics failures
        }
        return { id: user.id, email: user.email, name: user.name ?? undefined }
      },
    }),
  ],
  pages: {
    signIn: '/login',
  },
}
