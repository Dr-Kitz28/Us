export const dynamic = 'force-dynamic'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Create Account</h1>
          <p className="text-muted-foreground">Join Uz</p>
        </div>
        
        <form action="/api/auth/register" method="POST" className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-2">
              Name
            </label>
            <Input
              id="name"
              name="name"
              type="text"
              required
              placeholder="Enter your name"
            />
          </div>
          
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2">
              Email
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              placeholder="Enter your email"
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-2">
              Password
            </label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              placeholder="Create a password"
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium mb-2">Phone</label>
            <Input id="phone" name="phone" type="tel" placeholder="Optional phone number" />
          </div>

          <div>
            <label htmlFor="age" className="block text-sm font-medium mb-2">Age</label>
            <Input id="age" name="age" type="number" min={18} placeholder="Optional age" />
          </div>

          <div>
            <label htmlFor="gender" className="block text-sm font-medium mb-2">Gender</label>
            <Input id="gender" name="gender" type="text" placeholder="Optional gender" />
          </div>

          <div>
            <label htmlFor="location" className="block text-sm font-medium mb-2">Location</label>
            <Input id="location" name="location" type="text" placeholder="City, Country" />
          </div>

          <div>
            <label htmlFor="bio" className="block text-sm font-medium mb-2">Bio</label>
            <textarea id="bio" name="bio" rows={4} className="w-full rounded-md border p-2" placeholder="Write a short bio (optional)"></textarea>
          </div>
          
          <Button type="submit" className="w-full">
            Create Account
          </Button>
        </form>
        
        <div className="text-center text-sm">
          Already have an account?{' '}
          <a href="/login" className="text-primary hover:underline">
            Sign in
          </a>
        </div>
      </div>
    </main>
  )
}
