const CACHE_VERSION = 'osteotab-v1'
const STATIC_CACHE = `${CACHE_VERSION}-static`
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`
const APP_SHELL = ['/', '/manifest.json', '/icons/icon-192x192.jpg', '/icons/icon-512x512.jpg']
const MAX_RUNTIME_ENTRIES = 80

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => !key.startsWith(CACHE_VERSION)).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event

  if (request.method !== 'GET') {
    return
  }

  const url = new URL(request.url)

  if (url.origin !== self.location.origin) {
    return
  }

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request))
    return
  }

  if (url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/icons/') || url.pathname === '/manifest.json') {
    event.respondWith(cacheFirst(request))
    return
  }

  event.respondWith(staleWhileRevalidate(request))
})

async function networkFirst(request) {
  const cache = await caches.open(RUNTIME_CACHE)

  try {
    const response = await fetch(request)

    if (response.ok) {
      await cache.put(request, response.clone())
      await trimCache(RUNTIME_CACHE)
    }

    return response
  } catch {
    const cachedResponse = await cache.match(request)
    const cachedShell = await caches.match('/')

    return cachedResponse || cachedShell || Response.error()
  }
}

async function cacheFirst(request) {
  const cachedResponse = await caches.match(request)

  if (cachedResponse) {
    return cachedResponse
  }

  const response = await fetch(request)

  if (response.ok) {
    const cache = await caches.open(STATIC_CACHE)
    await cache.put(request, response.clone())
  }

  return response
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME_CACHE)
  const cachedResponse = await cache.match(request)

  if (cachedResponse) {
    fetch(request)
      .then(async (response) => {
        if (response.ok) {
          await cache.put(request, response.clone())
          await trimCache(RUNTIME_CACHE)
        }
      })
      .catch(() => undefined)

    return cachedResponse
  }

  try {
    const response = await fetch(request)

    if (response.ok) {
      await cache.put(request, response.clone())
      await trimCache(RUNTIME_CACHE)
    }

    return response
  } catch {
    return Response.error()
  }
}

async function trimCache(cacheName) {
  const cache = await caches.open(cacheName)
  const keys = await cache.keys()

  if (keys.length <= MAX_RUNTIME_ENTRIES) {
    return
  }

  await cache.delete(keys[0])
  await trimCache(cacheName)
}
