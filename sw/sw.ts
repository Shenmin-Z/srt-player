declare var self: ServiceWorkerGlobalScope

const PATH = '/srt-player/' // should be the same as base in vite config
const CACHE_STATIC = 'static-cache'
const CACHE_DYNAMIC = 'dynamic-cache'
const STATIC_URLS = [
  'favicon.ico',
  'fonts/MaterialIcons-Regular.woff',
  'fonts/MaterialIcons-Regular.woff2',
  'fonts/RobotoMono-Regular.ttf',
].map(i => PATH + i)
const DYNAMIC_URLS = ['', 'index.js', 'index.css', 'version.txt']
  .map(i => PATH + i)
  .concat(PATH.substring(0, PATH.length - 1))

const cacheStatic = async () => {
  const cache = await caches.open(CACHE_STATIC)
  await cache.addAll(STATIC_URLS)
}
const cacheDynamic = async () => {
  const cache = await caches.open(CACHE_DYNAMIC)
  const requests = DYNAMIC_URLS.map(url => new Request(url, { cache: 'reload' }))
  await cache.addAll(requests)
}

self.addEventListener('install', event => {
  event.waitUntil(
    cacheStatic().then(() => {
      // it's ok for dynamic to fail
      cacheDynamic()
    }),
  )
})

self.addEventListener('fetch', event => {
  event.respondWith(
    (async () => {
      const response = await caches.match(event.request)
      const url = event.request.url
      const bypassCache = new URL(url).search.includes('bypassCache')
      if (response && !bypassCache) {
        return response
      } else {
        const response = await fetch(event.request, { cache: 'reload' })

        if (!bypassCache && response.status === 200 && url.startsWith('http')) {
          const responseToCache = response.clone()
          const cache = await caches.open(CACHE_DYNAMIC)
          cache.put(event.request, responseToCache)
        }

        return response
      }
    })(),
  )
})

self.addEventListener('activate', event => {
  // TODO
  event.waitUntil(Promise.resolve())
})

self.addEventListener('message', async event => {
  if (event.data.type === 'UPDATE') {
    const port = event.ports[0]
    await clearAndUpate()
    port.postMessage('updated')
  }
})

async function clearAndUpate() {
  await caches.delete(CACHE_DYNAMIC)
  await cacheDynamic()
}

export {}
