import './globals.css'
// Initialize cache singleton (safe no-op if Redis not present)
import '@/lib/cache/initCache'
import type { Metadata, Viewport } from 'next'
import { PWAServiceWorkerRegistration } from '@/components/pwa/pwa-provider'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Sparks - Find Your Match',
  description: 'Where meaningful connections bloom naturally with research-backed matching',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Sparks',
  },
  icons: {
    icon: '/icons/icon-192.svg',
    apple: '/icons/icon-192.svg',
  },
  openGraph: {
    type: 'website',
    title: 'Sparks - Find Your Match',
    description: 'Where meaningful connections bloom naturally',
    siteName: 'Sparks',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sparks - Find Your Match',
    description: 'Where meaningful connections bloom naturally',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#e11d48',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* PWA Meta Tags */}
        <meta name="application-name" content="Sparks" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Sparks" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#e11d48" />
        <meta name="msapplication-tap-highlight" content="no" />
        
        {/* iOS Splash Screens */}
        <link rel="apple-touch-icon" href="/icons/icon-192.svg" />
        <link rel="apple-touch-startup-image" href="/icons/icon-512.svg" />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased">
        {children}
        <PWAServiceWorkerRegistration />
      </body>
    </html>
  )
}
