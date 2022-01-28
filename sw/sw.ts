declare var self: ServiceWorkerGlobalScope

const PATH = '/srt-player/' // should be the same as base in vite config
const SRT_CACHE = 'srt-cache'
const CACHE_URLS = [
  '',
  'index.js',
  'index.css',
  'version.js',
  'srt-player.svg',
  'github.png',
  'fonts/MaterialIcons-Regular.ttf',
  'fonts/MaterialIconsOutlined-Regular.otf',
  'fonts/RobotoMono-Regular.ttf',
]
  .map(i => PATH + i)
  .concat(PATH.substring(0, PATH.length - 1))

const cacheAll = async () => {
  const cache = await caches.open(SRT_CACHE)
  const requests = CACHE_URLS.map(url => new Request(url, { cache: 'reload' }))
  return await cache.addAll(requests)
}

self.addEventListener('install', event => {
  event.waitUntil(Promise.resolve(cacheAll()))
})

self.addEventListener('fetch', event => {
  event.respondWith(
    (async () => {
      const cachedResponse = await caches.match(event.request)
      if (cachedResponse) {
        return cachedResponse
      } else {
        return await fetch(event.request)
      }
    })(),
  )
})

self.addEventListener('message', async event => {
  if (event.data.type === 'UPDATE') {
    const port = event.ports[0]
    await clearAndUpate()
    port.postMessage('updated')
  }
})

async function clearAndUpate() {
  const keys = await caches.keys()
  await Promise.all(
    keys.map(key => {
      if (key.startsWith('srt-')) {
        return caches.delete(key)
      } else {
        return Promise.resolve(true)
      }
    }),
  )
  await cacheAll()
}

export {}
