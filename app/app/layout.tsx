'use client'

import { SessionProvider } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { BottomNav } from '@/components/navigation/bottom-nav'
import { WatercolorBackground } from '@/components/ui/watercolor-background'

interface TabCounts {
  matches: number
  liked: number
  recycled: number
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [, setTabCounts] = useState<TabCounts>({ matches: 0, liked: 0, recycled: 0 })

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

  // Determine if we should show bottom nav
  const showBottomNav = pathname?.startsWith('/app/') && !pathname?.startsWith('/app/messages/')

  return (
    <SessionProvider>
      <div className="relative min-h-screen">
        {/* Art-forward watercolor background */}
        <WatercolorBackground variant="warm" intensity="subtle" animated />
        
        {/* Main content */}
        <div className="relative z-10">
          {children}
        </div>
        
        {/* Bottom Navigation with new design */}
        {showBottomNav && <BottomNav />}
      </div>
    </SessionProvider>
  )
}
