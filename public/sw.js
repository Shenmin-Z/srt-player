const PATH = '/srt-player/' // shoudl be the same as base in vite config
const CACHE_STATIC = 'static-cache'
const CACHE_DYNAMIC = 'dynamic-cache'
const urlsToCache = [
  'favicon.ico',
  'fonts/MaterialIcons-Regular.woff',
  'fonts/MaterialIcons-Regular.woff2',
  'fonts/RobotoMono-Regular.ttf',
].map(i => PATH + i)

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_STATIC).then(cache => cache.addAll(urlsToCache)))
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
  const currentVersion = await new Promise(resolve => {
    const request = indexedDB.open('keyval-store', 1)
    request.onsuccess = event => {
      try {
        const db = event.target.result
        const request = db.transaction('keyval').objectStore('keyval').get('SRT-VERSION')
        request.onsuccess = event => {
          resolve(event.target.result)
        }
        request.onerror = () => {
          resolve(null)
        }
      } catch {
        resolve(null)
      }
    }
  })
  return fetch('/srt-player/version.txt')
    .then(response => response.text())
    .then(text => {
      text = text.trim()
      if (text !== currentVersion && currentVersion !== null) {
        console.log(`Current: ${currentVersion}, latest: ${text}\nDeleting cache in 5 seconds.`)
        setTimeout(clearCache, 5000)
      } else {
        console.log('Already latest.')
      }
    })
}

async function clearCache() {
  await caches.delete(CACHE_DYNAMIC)
  console.log('Cache cleared.')
}
