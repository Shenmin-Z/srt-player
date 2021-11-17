import { FC, useEffect, useState } from 'react'
import { set, get } from 'idb-keyval'

const VERSION = '1.0.1'
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

async function checkAndMigrate() {
  const version = await get(KEY_VERSION)
  if (version !== VERSION) {
    await historyM()
    await set(KEY_VERSION, VERSION)
  }
}

import { KEY_HISTORY } from './history'
async function historyM() {
  const hs = await get(KEY_HISTORY)
  for (const k of Object.keys(hs)) {
    if (hs[k].videoTime !== undefined) {
      hs[k] = {
        currentTime: hs[k].videoTime,
        duration: 0,
        subtitleTop: hs[k].subtitleTop,
        subtitleAuto: false,
        subtitleDelay: 0,
      }
    }
  }
  await set(KEY_HISTORY, hs)
}
