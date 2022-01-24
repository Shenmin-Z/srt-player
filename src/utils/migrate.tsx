import { FC, useEffect, useState } from 'react'
import { set, get, setMany, createStore, del } from 'idb-keyval'

const BASE = '/srt-player/'
const KEY_VERSION = 'SRT-VERSION'

export const migrate =
  (FC: FC): FC =>
  props => {
    const [migrated, setMigrated] = useState(false)

    useEffect(() => {
      checkAndMigrate().then(() => {
        setMigrated(true)
      })
    }, [])

    return migrated ? <FC {...props} /> : null
  }

export const getCurrentVersion = async () => await get(KEY_VERSION)

export async function getLatestVersion(bypassCache = false) {
  let url = `${BASE}version.txt`
  if (bypassCache) url += '?bypassCache=true'
  return (await (await fetch(url)).text()).trim()
}

async function checkAndMigrate() {
  const currentVersion = await getCurrentVersion()
  const latestVersion = await getLatestVersion()
  if (currentVersion !== latestVersion) {
    migrateHistory(currentVersion)
    await set(KEY_VERSION, latestVersion)
  }
}

async function migrateHistory(currentVersion: string) {
  if (currentVersion.startsWith('1.1')) {
    const HistoryStore = createStore('history', 'keyval')
    const hs = await get('SRT-HISTORY')
    await setMany(
      Object.keys(hs).map(k => [k, hs[k]]),
      HistoryStore,
    )
    await del('SRT-HISTORY')
  }
}
