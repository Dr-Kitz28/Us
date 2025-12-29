import './globals.css'
// Initialize cache singleton (safe no-op if Redis not present)
import '@/lib/cache/initCache'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Uz',
  description: 'Find your perfect match with Uz',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  )
}
