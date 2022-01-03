declare var self: ServiceWorkerGlobalScope

const PATH = '/srt-player/' // should be the same as base in vite config
const SRT_CACHE = 'srt-cache'
const CACHE_URLS = [
  '',
  'index.js',
  'index.css',
  'version.txt',
  'srt-player.svg',
  'fonts/MaterialIcons-Regular.ttf',
  'fonts/MaterialIconsOutlined-Regular.otf',
  'fonts/RobotoMono-Regular.ttf',
]
  .map(i => PATH + i)
  .concat(PATH.substring(0, PATH.length - 1))

const cacheAll = async () => {
  const cache = await caches.open(SRT_CACHE)
  const requests = CACHE_URLS.map(url => new Request(url, { cache: 'reload' }))
  await cache.addAll(requests)
}

self.addEventListener('install', event => {
  cacheAll()
  event.waitUntil(Promise.resolve())
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
          const cache = await caches.open(SRT_CACHE)
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
  await caches.delete(SRT_CACHE)
  await cacheAll()
}

export {}
