'use client'

import { useEffect } from 'react'

/**
 * PWA Service Worker Registration Component
 * 
 * This component handles service worker registration on the client side.
 * It's a client component that should be included in the root layout.
 */
export function PWAServiceWorkerRegistration() {
  useEffect(() => {
    // Only register in production and on HTTPS
    if (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      process.env.NODE_ENV === 'production'
    ) {
      // Wait for the page to fully load
      window.addEventListener('load', async () => {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js', {
            scope: '/',
          })

          console.log('Service Worker registered:', registration.scope)

          // Check for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New content available
                  console.log('New content available, refresh to update')
                  
                  // Optionally show a toast or notification to the user
                  if (window.confirm('New version available! Refresh to update?')) {
                    window.location.reload()
                  }
                }
              })
            }
          })
        } catch (error) {
          console.error('Service Worker registration failed:', error)
        }
      })
    }
  }, [])

  // This component doesn't render anything visible
  return null
}

/**
 * Hook to check if the app is running in standalone mode (PWA)
 */
export function useIsPWA(): boolean {
  if (typeof window === 'undefined') return false
  
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

/**
 * Hook to check if the app is online
 */
export function useIsOnline(): boolean {
  if (typeof window === 'undefined') return true
  return navigator.onLine
}

export default PWAServiceWorkerRegistration
