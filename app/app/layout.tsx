'use client'

import { SessionProvider } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useState, useEffect } from 'react'

interface TabCounts {
  matches: number
  liked: number
  recycled: number
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [tabCounts, setTabCounts] = useState<TabCounts>({ matches: 0, liked: 0, recycled: 0 })

  // Load tab counts
  useEffect(() => {
    const loadCounts = async () => {
      try {
        // Load matches count
        const matchesRes = await fetch('/api/user-matches')
        const matchesData = await matchesRes.json()
        
        // Load liked users count
        const likedRes = await fetch('/api/liked-users')
        const likedData = await likedRes.json()
        
        // Load recycled users count
        const recycledRes = await fetch('/api/passes')
        const recycledData = await recycledRes.json()

        setTabCounts({
          matches: matchesData.success ? matchesData.count : 0,
          liked: likedData.success ? likedData.count : 0,
          recycled: recycledData.success ? recycledData.count : 0
        })
      } catch (error) {
        console.error('Error loading tab counts:', error)
      }
    }

    loadCounts()
    // Refresh counts every 30 seconds
    const interval = setInterval(loadCounts, 30000)
    return () => clearInterval(interval)
  }, [])

  const isActive = (path: string) => pathname === path

  return (
    <SessionProvider>
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-blue-50">
        {children}
        
        {/* Bottom Navigation */}
        {pathname.startsWith('/app/') && !pathname.startsWith('/app/messages') && (
          <nav className="fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t">
            <div className="max-w-md mx-auto px-4 py-2">
              <div className="flex justify-around">
                <Link 
                  href="/app/feed"
                  className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${
                    isActive('/app/feed') 
                      ? 'bg-pink-100 text-pink-600' 
                      : 'text-gray-600 hover:text-pink-600 hover:bg-pink-50'
                  }`}
                >
                  <div className="text-2xl mb-1">🔥</div>
                  <span className="text-xs font-medium">Discover</span>
                </Link>

                <Link 
                  href="/app/liked"
                  className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors relative ${
                    isActive('/app/liked') 
                      ? 'bg-pink-100 text-pink-600' 
                      : 'text-gray-600 hover:text-pink-600 hover:bg-pink-50'
                  }`}
                >
                  <div className="text-2xl mb-1">👍</div>
                  <span className="text-xs font-medium">Liked</span>
                  {tabCounts.liked > 0 && (
                    <span className="absolute -top-1 -right-1 bg-pink-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center font-bold">
                      {tabCounts.liked}
                    </span>
                  )}
                </Link>

                <Link 
                  href="/app/matches"
                  className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors relative ${
                    isActive('/app/matches') 
                      ? 'bg-pink-100 text-pink-600' 
                      : 'text-gray-600 hover:text-pink-600 hover:bg-pink-50'
                  }`}
                >
                  <div className="text-2xl mb-1">💕</div>
                  <span className="text-xs font-medium">Matches</span>
                  {tabCounts.matches > 0 && (
                    <span className="absolute -top-1 -right-1 bg-pink-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center font-bold">
                      {tabCounts.matches}
                    </span>
                  )}
                </Link>

                <Link 
                  href="/app/recycle-bin"
                  className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors relative ${
                    isActive('/app/recycle-bin') 
                      ? 'bg-pink-100 text-pink-600' 
                      : 'text-gray-600 hover:text-pink-600 hover:bg-pink-50'
                  }`}
                >
                  <div className="text-2xl mb-1">🗑️</div>
                  <span className="text-xs font-medium">Recycle</span>
                  {tabCounts.recycled > 0 && (
                    <span className="absolute -top-1 -right-1 bg-gray-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center font-bold">
                      {tabCounts.recycled}
                    </span>
                  )}
                </Link>
              </div>
            </div>
          </nav>
        )}
      </div>
    </SessionProvider>
  )
}
