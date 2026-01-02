'use client'
import { signIn } from 'next-auth/react'
import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const res = await signIn('credentials', { email, password, redirect: false })
    setLoading(false)
    if (!res || res.error) {
      // Map NextAuth's generic CredentialsSignin to a friendlier, actionable message
      const friendly = res?.error === 'CredentialsSignin'
        ? 'Invalid email or password. Reset your password or use the debug page to verify your account.'
        : (res?.error ?? 'Login failed')
      setError(friendly)
    } else {
      window.location.href = '/app/feed'
    }
  }

  // Check whether current user is admin (used to show debug/test-user links)
  // This will typically be false for unauthenticated users; only show hints to admins.
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await fetch('/api/auth/check-admin')
        if (!mounted) return
        if (res.ok) {
          const j = await res.json()
          setIsAdmin(Boolean(j?.isAdmin))
        }
      } catch (e) {
        // ignore
      }
    })()
    return () => { mounted = false }
  }, [])

  return (
    <main className="mx-auto max-w-sm py-16">
      <h1 className="mb-6 text-2xl font-semibold">Login</h1>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <Input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <div className="relative">
          <Input
            placeholder="Password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="pr-10"
          />
          <button
            type="button"
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4 text-gray-400 hover:text-gray-600" />
            ) : (
              <Eye className="h-4 w-4 text-gray-400 hover:text-gray-600" />
            )}
          </button>
        </div>
        <Button disabled={loading} type="submit">
          {loading ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
      {error && (
        <div className="mt-3 text-sm text-red-600">
          <p>{error}</p>
          <p className="mt-2">
            <a href="/debug-auth" className="underline text-red-600 hover:text-red-800">Troubleshoot with debug page</a>
            <span className="mx-2">·</span>
            <a href="/register" className="underline text-red-600 hover:text-red-800">Create account / reset</a>
          </p>
        </div>
      )}
      
      {/* Test user hint - only visible to admins */}
      {isAdmin && (
        <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-sm font-semibold text-blue-800 mb-1">💡 Test Users Available</h3>
          <p className="text-xs text-blue-600 mb-2">
            If you need test users, try these credentials:
          </p>
          <div className="space-y-1 text-xs">
            <div className="bg-white px-2 py-1 rounded border font-mono">
              Email: alex@example.com<br/>
              Password: password123
            </div>
          </div>
          <p className="text-xs text-blue-500 mt-2">
            <a href="/debug-auth" className="underline hover:text-blue-700">
              🔧 Visit debug page to create more test users
            </a>
          </p>
        </div>
      )}
    </main>
  )
}
