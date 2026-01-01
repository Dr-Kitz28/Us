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

        const email = credentials.email
        const password = credentials.password

        const user = await prisma.user.findUnique({ where: { email } })
        if (!user) {
          console.warn('[auth] authorize: user not found', { email })
          try {
            metrics.incrementCounter('auth.signin_failure', 1, { env: process.env.NODE_ENV || 'development', email, reason: 'user_not_found' })
          } catch (e) {
            // ignore metrics failures
          }
          return null
        }

          // Log stored hash length for debugging (helps detect truncation issues)
          try {
            console.info('[auth] authorize: stored hash length', { email, storedHashLength: user.password?.length ?? 0 })
          } catch (e) {
            // ignore logging failure
          }

          let ok = false
          try {
            ok = await bcrypt.compare(password, user.password)
          } catch (err) {
            console.error('[auth] authorize: bcrypt.compare error', { email, err })
            try {
              metrics.incrementCounter('auth.signin_failure', 1, { env: process.env.NODE_ENV || 'development', email, reason: 'bcrypt_error' })
            } catch (e) {
              // ignore metrics failures
            }
            return null
          }

          if (!ok) {
            console.warn('[auth] authorize: invalid credentials', { email })
            try {
              metrics.incrementCounter('auth.signin_failure', 1, { env: process.env.NODE_ENV || 'development', email, reason: 'bad_password' })
            } catch (e) {
              // ignore metrics failures
            }
            return null
          }

        try {
          metrics.incrementCounter('auth.signin_success', 1, { env: process.env.NODE_ENV || 'development', userId: user.id })
        } catch (e) {
          // ignore metrics failures
        }

        console.info('[auth] authorize: signin success', { email, userId: user.id })
        return { id: user.id, email: user.email, name: user.name ?? undefined }
      },
    }),
  ],
  pages: {
    signIn: '/login',
  },
}
