/// <reference lib="webworker" />

/**
 * Service Worker for Uz Dating App PWA
 * Provides offline support and caching strategies
 */

declare const self: ServiceWorkerGlobalScope

const CACHE_VERSION = 'uz-v1'
const STATIC_CACHE = `${CACHE_VERSION}-static`
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`
const IMAGE_CACHE = `${CACHE_VERSION}-images`

// Static assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/app/feed',
  '/app/matches',
  '/app/messages',
  '/app/profile',
  '/offline',
  '/manifest.json',
]

// Cache size limits
const CACHE_LIMITS = {
  dynamic: 50,
  images: 100,
}

// ============================================
// Install Event
// ============================================

self.addEventListener('install', (event: ExtendableEvent) => {
  console.log('[SW] Installing service worker...')
  
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[SW] Caching static assets')
      return cache.addAll(STATIC_ASSETS)
    })
  )
  
  // Activate immediately
  self.skipWaiting()
})

// ============================================
// Activate Event
// ============================================

self.addEventListener('activate', (event: ExtendableEvent) => {
  console.log('[SW] Activating service worker...')
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name.startsWith('uz-') && name !== STATIC_CACHE)
          .filter((name) => !name.startsWith(CACHE_VERSION))
          .map((name) => {
            console.log('[SW] Deleting old cache:', name)
            return caches.delete(name)
          })
      )
    })
  )
  
  // Take control of all pages immediately
  self.clients.claim()
})

// ============================================
// Fetch Event
// ============================================

self.addEventListener('fetch', (event: FetchEvent) => {
  const { request } = event
  const url = new URL(request.url)
  
  // Skip non-GET requests
  if (request.method !== 'GET') return
  
  // Skip cross-origin requests
  if (url.origin !== location.origin) return
  
  // API requests: network-first
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request, DYNAMIC_CACHE))
    return
  }
  
  // Images: cache-first with network fallback
  if (isImageRequest(request)) {
    event.respondWith(cacheFirst(request, IMAGE_CACHE))
    return
  }
  
  // Static assets: stale-while-revalidate
  if (isStaticAsset(url.pathname)) {
    event.respondWith(staleWhileRevalidate(request, STATIC_CACHE))
    return
  }
  
  // Pages: network-first with offline fallback
  event.respondWith(networkFirstWithOffline(request))
})

// ============================================
// Caching Strategies
// ============================================

async function networkFirst(request: Request, cacheName: string): Promise<Response> {
  try {
    const response = await fetch(request)
    
    if (response.ok) {
      const cache = await caches.open(cacheName)
      cache.put(request, response.clone())
      await trimCache(cacheName, CACHE_LIMITS.dynamic)
    }
    
    return response
  } catch (error) {
    const cached = await caches.match(request)
    if (cached) return cached
    
    throw error
  }
}

async function cacheFirst(request: Request, cacheName: string): Promise<Response> {
  const cached = await caches.match(request)
  if (cached) return cached
  
  try {
    const response = await fetch(request)
    
    if (response.ok) {
      const cache = await caches.open(cacheName)
      cache.put(request, response.clone())
      await trimCache(cacheName, CACHE_LIMITS.images)
    }
    
    return response
  } catch (error) {
    // Return placeholder for images
    return new Response(
      '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect fill="#f3f4f6" width="100" height="100"/></svg>',
      { headers: { 'Content-Type': 'image/svg+xml' } }
    )
  }
}

async function staleWhileRevalidate(request: Request, cacheName: string): Promise<Response> {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(request)
  
  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) {
      cache.put(request, response.clone())
    }
    return response
  })
  
  return cached || fetchPromise
}

async function networkFirstWithOffline(request: Request): Promise<Response> {
  try {
    const response = await fetch(request)
    
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE)
      cache.put(request, response.clone())
    }
    
    return response
  } catch (error) {
    const cached = await caches.match(request)
    if (cached) return cached
    
    // Return offline page
    const offlinePage = await caches.match('/offline')
    if (offlinePage) return offlinePage
    
    return new Response('Offline', { status: 503 })
  }
}

// ============================================
// Helpers
// ============================================

function isImageRequest(request: Request): boolean {
  const accept = request.headers.get('Accept') || ''
  return accept.includes('image') || /\.(jpg|jpeg|png|gif|webp|avif|svg)$/i.test(request.url)
}

function isStaticAsset(pathname: string): boolean {
  return /\.(js|css|woff2?|ttf|eot)$/i.test(pathname) ||
    pathname.startsWith('/_next/static/')
}

async function trimCache(cacheName: string, maxItems: number): Promise<void> {
  const cache = await caches.open(cacheName)
  const keys = await cache.keys()
  
  if (keys.length > maxItems) {
    const toDelete = keys.slice(0, keys.length - maxItems)
    await Promise.all(toDelete.map((key) => cache.delete(key)))
  }
}

// ============================================
// Push Notifications
// ============================================

self.addEventListener('push', (event: PushEvent) => {
  if (!event.data) return
  
  try {
    const data = event.data.json()
    
    const options: NotificationOptions = {
      body: data.body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      vibrate: [100, 50, 100],
      data: {
        url: data.url || '/app/feed',
      },
      actions: data.actions || [],
    }
    
    event.waitUntil(
      self.registration.showNotification(data.title || 'Uz', options)
    )
  } catch (error) {
    console.error('[SW] Push notification error:', error)
  }
})

self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close()
  
  const url = event.notification.data?.url || '/app/feed'
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clientList) => {
      // Focus existing window if available
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) {
          return client.focus()
        }
      }
      // Open new window
      return self.clients.openWindow(url)
    })
  )
})

// ============================================
// Background Sync
// ============================================

self.addEventListener('sync', (event: SyncEvent) => {
  if (event.tag === 'sync-likes') {
    event.waitUntil(syncLikes())
  }
  
  if (event.tag === 'sync-messages') {
    event.waitUntil(syncMessages())
  }
})

async function syncLikes(): Promise<void> {
  // Sync queued likes when back online
  const cache = await caches.open('uz-offline-actions')
  const requests = await cache.keys()
  
  for (const request of requests) {
    if (request.url.includes('/api/likes')) {
      try {
        const cached = await cache.match(request)
        if (cached) {
          const body = await cached.json()
          await fetch('/api/likes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          })
          await cache.delete(request)
        }
      } catch (error) {
        console.error('[SW] Sync like failed:', error)
      }
    }
  }
}

async function syncMessages(): Promise<void> {
  // Sync queued messages when back online
  console.log('[SW] Syncing messages...')
}

export {}
