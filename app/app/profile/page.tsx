'use client'

import { useSession, signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar } from '@/components/ui/avatar'

export default function ProfilePage() {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>
  }

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Button onClick={() => window.location.href = '/login'}>Go to Login</Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-white sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-bold text-primary">Profile</h1>
          <nav className="flex items-center gap-4">
            <a href="/app/feed" className="text-sm hover:text-primary">Feed</a>
            <a href="/app/matches" className="text-sm hover:text-primary">Matches</a>
            <Button variant="ghost" size="sm" onClick={() => signOut({ callbackUrl: '/' })}>
              Sign Out
            </Button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto space-y-8">
          {/* Profile Header */}
          <div className="text-center">
            <Avatar src={null} fallback={session.user?.name?.[0] ?? '👤'} size={80} />
            <h2 className="text-xl font-bold mt-4">{session.user?.name}</h2>
            <p className="text-muted-foreground">{session.user?.email}</p>
          </div>

          {/* Profile Form */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Edit Profile</h3>
              <div className="space-y-4">
                <div>
                  <label htmlFor="bio" className="block text-sm font-medium mb-2">
                    Bio
                  </label>
                  <textarea
                    id="bio"
                    rows={4}
                    className="w-full px-3 py-2 border border-input rounded-md bg-transparent"
                    placeholder="Tell others about yourself..."
                    defaultValue="Love hiking, coffee, and good conversations. Looking for someone genuine to explore the city with! 🌟"
                  />
                </div>

                <div>
                  <label htmlFor="age" className="block text-sm font-medium mb-2">
                    Age
                  </label>
                  <Input
                    id="age"
                    type="number"
                    placeholder="25"
                  />
                </div>

                <div>
                  <label htmlFor="location" className="block text-sm font-medium mb-2">
                    Location
                  </label>
                  <Input
                    id="location"
                    type="text"
                    placeholder="New York, NY"
                  />
                </div>

                <div>
                  <label htmlFor="interests" className="block text-sm font-medium mb-2">
                    Interests
                  </label>
                  <Input
                    id="interests"
                    type="text"
                    placeholder="hiking, coffee, movies, travel"
                  />
                </div>

                <Button className="w-full">
                  Save Changes
                </Button>
              </div>
            </div>

            {/* Settings */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">Settings</h3>
              <div className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  🔒 Privacy Settings
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  🔔 Notifications
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  ❓ Help & Support
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start text-red-600 hover:text-red-700"
                >
                  🗑️ Delete Account
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
