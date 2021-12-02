import { get, set } from 'idb-keyval'

declare var self: ServiceWorkerGlobalScope

const PATH = '/srt-player/' // should be the same as base in vite config
const VERSION_KEY = 'SRT-VERSION'
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

const cacheStatic = () => caches.open(CACHE_STATIC).then(cache => cache.addAll(STATIC_URLS))
const cacheDynamic = () => caches.open(CACHE_DYNAMIC).then(cache => cache.addAll(DYNAMIC_URLS))

self.addEventListener('install', event => {
  event.waitUntil(Promise.all([cacheStatic(), cacheDynamic()]))
})

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      const url = event.request.url
      if (url.endsWith(PATH + 'version.txt')) {
        checkUpdate()
      }
      if (response) {
        return response
      }
      return fetch(event.request).then(response => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response
        }

        const responseToCache = response.clone()

        if (url.startsWith('http')) {
          caches.open(CACHE_DYNAMIC).then(cache => {
            cache.put(event.request, responseToCache)
          })
        }

        return response
      })
    }),
  )
})

self.addEventListener('activate', event => {
  // TODO
  event.waitUntil(Promise.resolve())
})

async function checkUpdate() {
  const currentVersion = await get(VERSION_KEY)
  try {
    let version = await fetch('/srt-player/version.txt').then(response => response.text())
    version = version.trim()
    if (version !== currentVersion && currentVersion !== undefined) {
      console.log(`Current: ${currentVersion}, latest: ${version}\nUpdating cache in 5 seconds.`)
      setTimeout(clearAndUpate, 5000)
    } else {
      console.log(`Already latest. (${version})`)
    }
    await set(VERSION_KEY, version)
  } catch {}
}

async function clearAndUpate() {
  await caches.delete(CACHE_DYNAMIC)
  await cacheDynamic()
  console.log('Cache updated.')
}

export {}
