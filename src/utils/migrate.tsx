import { FC, useEffect, useState } from 'react'
import { set, get } from 'idb-keyval'

const BASE = '/srt-player/'
export const KEY_VERSION = 'SRT-VERSION'

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

async function checkAndMigrate() {
  const currentVersion = await get(KEY_VERSION)
  const latestVersion = (await (await fetch(`${BASE}version.txt`)).text()).trim()
  if (currentVersion !== latestVersion) {
    await set(KEY_VERSION, latestVersion)
  }
}
