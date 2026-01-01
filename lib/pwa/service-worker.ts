'use client'

import { useEffect } from 'react'

/**
 * Register service worker for PWA functionality
 */
export function useServiceWorker() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator)) return

    const registerSW = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        })

        console.log('[PWA] Service worker registered:', registration.scope)

        // Check for updates periodically
        setInterval(() => {
          registration.update()
        }, 60 * 60 * 1000) // Every hour

        // Handle updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing
          if (!newWorker) return

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New content available
              console.log('[PWA] New content available')
              // Could show a toast to prompt user to refresh
            }
          })
        })
      } catch (error) {
        console.error('[PWA] Service worker registration failed:', error)
      }
    }

    // Register after page load
    if (document.readyState === 'complete') {
      registerSW()
    } else {
      window.addEventListener('load', registerSW)
      return () => window.removeEventListener('load', registerSW)
    }
  }, [])
}

/**
 * Request notification permission
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    return 'denied'
  }

  if (Notification.permission === 'granted') {
    return 'granted'
  }

  if (Notification.permission !== 'denied') {
    return await Notification.requestPermission()
  }

  return 'denied'
}

/**
 * Subscribe to push notifications
 */
export async function subscribeToPush(): Promise<PushSubscription | null> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return null
  }

  try {
    const registration = await navigator.serviceWorker.ready
    
    // Get VAPID public key from server
    const response = await fetch('/api/push/vapid-key')
    const { publicKey } = await response.json()

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    })

    // Send subscription to server
    await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subscription),
    })

    return subscription
  } catch (error) {
    console.error('[PWA] Push subscription failed:', error)
    return null
  }
}

/**
 * Queue an action for background sync
 */
export async function queueAction(tag: string, data: unknown): Promise<void> {
  if (!('serviceWorker' in navigator) || !('SyncManager' in window)) {
    // Fallback: try immediately
    return
  }

  try {
    // Store action data for sync
    const cache = await caches.open('uz-offline-actions')
    const request = new Request(`/offline-action/${tag}/${Date.now()}`)
    const response = new Response(JSON.stringify(data))
    await cache.put(request, response)

    // Request background sync
    const registration = await navigator.serviceWorker.ready
    await (registration as ServiceWorkerRegistration & { sync: { register: (tag: string) => Promise<void> } }).sync.register(tag)
  } catch (error) {
    console.error('[PWA] Background sync registration failed:', error)
  }
}

/**
 * Check if app can be installed
 */
export function useInstallPrompt() {
  useEffect(() => {
    let deferredPrompt: BeforeInstallPromptEvent | null = null

    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent default prompt
      e.preventDefault()
      deferredPrompt = e as BeforeInstallPromptEvent
      
      // Could store this and show custom install button
      console.log('[PWA] App can be installed')
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])
}

// Helper to convert VAPID key
function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray.buffer
}

// Type for install prompt event
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}
