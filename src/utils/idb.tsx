import { FC, useEffect, useState } from 'react'
import { openDB, DBSchema, IDBPDatabase } from 'idb'
import { Node } from './subtitle'

export interface VideoSubPair {
  video: FileSystemFileHandle | File
  subtitle: string | Node[]
}

export enum EnableWaveForm {
  disable,
  video,
  audio,
}

export interface WatchHistory {
  currentTime: number
  duration: number
  subtitleTop: number // scroll position
  subtitleAuto: boolean
  subtitleDelay: number
  subtitleListeningMode: boolean
  subtitleLastActive: number | null
  waveform: EnableWaveForm
}

interface SRTPlayerDB extends DBSchema {
  'audio-sampling': {
    key: string
    value: Blob[]
  }
  files: {
    key: string
    value: VideoSubPair
  }
  history: {
    key: string
    value: WatchHistory
  }
  global: {
    key: string
    value: string | number
  }
}

export let db: IDBPDatabase<SRTPlayerDB>

export const getDB = async () => {
  const _db = await openDB<SRTPlayerDB>('srt-player', 1, {
    upgrade(db, oldVersion) {
      if (oldVersion === 0) {
        db.createObjectStore('audio-sampling')
        db.createObjectStore('files')
        db.createObjectStore('history')
        db.createObjectStore('global')
      }
    },
    blocking() {
      _db.close()
      location.reload()
    },
  })
  return _db
}

export const migrate = (FC: FC): FC => {
  return props => {
    const [migrated, setMigrated] = useState(false)

    useEffect(() => {
      ;(async () => {
        db = await getDB()
        setMigrated(true)
      })()
    }, [])

    return migrated ? <FC {...props} /> : null
  }
}
