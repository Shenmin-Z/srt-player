import { useSelector } from '../state'
import { doVideo } from './video'
import { db, WatchHistory, EnableWaveForm } from './idb'
import { previousHighlighted } from './subtitle'

export interface WatchHistories {
  [s: string]: WatchHistory
}

function getSubtitleElm() {
  return document.getElementById('srt-player-subtitle') as HTMLDivElement | undefined
}

export const useRestoreSubtitle = () => {
  const file = useSelector(s => s.files.selected!)
  return async (): Promise<number | null> => {
    const h = await getHistoryByFileName(file)
    const subtitleTop = h?.subtitleTop ?? 0
    const subtitle = getSubtitleElm()
    if (subtitle) {
      subtitle.scrollTop = subtitleTop
    }
    return h?.subtitleLastActive === undefined ? null : h.subtitleLastActive
  }
}

export const useRestoreVideo = () => {
  const file = useSelector(s => s.files.selected!)
  return async () => {
    const h = await getHistoryByFileName(file)
    const currentTime = h?.currentTime ?? 0
    doVideo(video => {
      video.currentTime = currentTime
    })
  }
}

export const getSubtitlePreference = async (f: string) => {
  const h = await getHistoryByFileName(f)
  return {
    auto: h?.subtitleAuto ?? true,
    delay: h?.subtitleDelay || 0,
    listeningMode: h?.subtitleListeningMode ?? false,
  }
}

export const getWaveFormPreference = async (f: string) => {
  const h = await getHistoryByFileName(f)
  return h?.waveform ?? EnableWaveForm.disable
}

export const saveSubtitleAuto = async (f: string, auto: boolean) => {
  return writeHelper(f, h => {
    h.subtitleAuto = auto
  })
}

export const saveSubtitleDelay = async (f: string, delay: number) => {
  return writeHelper(f, h => {
    h.subtitleDelay = delay
  })
}

export const saveSubtitleListeningMode = async (f: string, listeningMode: boolean) => {
  return writeHelper(f, h => {
    h.subtitleListeningMode = listeningMode
  })
}

export const saveSubtitleLastActive = async (f: string, lastActive: number) => {
  return writeHelper(f, h => {
    h.subtitleLastActive = lastActive
  })
}

export const saveEnableWaveForm = async (f: string, enable: EnableWaveForm) => {
  return writeHelper(f, h => {
    h.waveform = enable
  })
}

export const useSaveHistory = (cooldown?: number) => {
  const file = useSelector(s => s.files.selected)
  let skip = false
  return async () => {
    if (!file || skip) return
    await writeHelper(file, h => {
      const subtitle = getSubtitleElm()
      if (subtitle) {
        h.subtitleTop = subtitle.scrollTop
      }
      doVideo(video => {
        h.currentTime = video.currentTime
        h.duration = video.duration
      })
      h.subtitleLastActive = previousHighlighted
    })
    if (cooldown) {
      skip = true
      setTimeout(() => {
        skip = false
      }, cooldown)
    }
  }
}

function getHistoryByFileName(file: string) {
  return db.get('history', file)
}

async function writeHelper(file: string, cb: (h: WatchHistory) => void) {
  const h = await getHistoryByFileName(file)
  const t = {
    subtitleTop: 0,
    currentTime: 0,
    duration: 0,
    subtitleAuto: true,
    subtitleDelay: 0,
    subtitleListeningMode: false,
    subtitleLastActive: null,
    waveform: EnableWaveForm.disable,
    ...(h || {}),
  }
  cb(t)
  return db.put('history', t, file)
}

export async function getWatchHistory() {
  const hs: WatchHistories = {}
  let cursor = await db.transaction('history').store.openCursor()
  while (cursor) {
    hs[cursor.key] = cursor.value
    cursor = await cursor.continue()
  }
  return hs
}

export async function deleteHistory(f: string) {
  return db.delete('history', f)
}
