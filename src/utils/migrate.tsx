import { FC, useEffect, useState } from 'react'
import { set, get } from 'idb-keyval'

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

export async function getLatestVersion() {
  return (await (await fetch(`${BASE}version.txt`)).text()).trim()
}

async function checkAndMigrate() {
  const currentVersion = await getCurrentVersion()
  const latestVersion = await getLatestVersion()
  if (currentVersion !== latestVersion) {
    await set(KEY_VERSION, latestVersion)
  }
}
