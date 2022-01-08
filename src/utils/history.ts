import { get, set } from 'idb-keyval'
import { useSelector } from '../state'
import { doVideo } from './video'

export const KEY_HISTORY = 'SRT-HISTORY'

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
  waveform: EnableWaveForm
}

export interface WatchHistories {
  [s: string]: WatchHistory
}

function getSubtitleElm() {
  return document.getElementById('srt-player-subtitle') as HTMLDivElement | undefined
}

export const useRestoreSubtitle = (cb: { (): void }) => {
  const file = useSelector(s => s.files.selected)
  return async () => {
    if (!file) return
    const hs: WatchHistories = (await get(KEY_HISTORY)) || {}
    const subtitleTop = hs[file]?.subtitleTop ?? 0
    const subtitle = getSubtitleElm()
    if (subtitle) {
      subtitle.scrollTop = subtitleTop
      setTimeout(cb)
    }
  }
}

export const useRestoreVideo = () => {
  const file = useSelector(s => s.files.selected)
  return async () => {
    if (!file) return
    const hs: WatchHistories = (await get(KEY_HISTORY)) || {}
    const currentTime = hs[file]?.currentTime ?? 0
    doVideo(video => {
      video.currentTime = currentTime
    })
  }
}

export const getSubtitlePreference = async (f: string) => {
  const hs: WatchHistories = (await get(KEY_HISTORY)) || {}
  return { auto: hs[f]?.subtitleAuto ?? true, delay: hs[f]?.subtitleDelay || 0 }
}

export const getWaveFormPreference = async (f: string) => {
  const hs: WatchHistories = (await get(KEY_HISTORY)) || {}
  return hs[f]?.waveform ?? EnableWaveForm.disable
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

export const saveEnableWaveForm = async (f: string, enable: EnableWaveForm) => {
  return writeHelper(f, h => {
    h.waveform = enable
  })
}

export const useSaveHistory = () => {
  const file = useSelector(s => s.files.selected)
  return async () => {
    if (!file) return
    await writeHelper(file, h => {
      const subtitle = getSubtitleElm()
      if (subtitle) {
        h.subtitleTop = Math.floor(subtitle.scrollTop)
      }
      doVideo(video => {
        h.currentTime = Math.floor(video.currentTime)
        h.duration = video.duration
      })
    })
  }
}

const writeHelper = async (file: string, cb: (h: WatchHistory) => void) => {
  const hs: WatchHistories = (await get(KEY_HISTORY)) || {}
  const h = {
    subtitleTop: 0,
    currentTime: 0,
    duration: 0,
    subtitleAuto: true,
    subtitleDelay: 0,
    waveform: EnableWaveForm.disable,
    ...((hs[file] as WatchHistory | undefined) || {}),
  }
  cb(h)
  hs[file] = h
  await set(KEY_HISTORY, hs)
}

export async function getWatchHistory() {
  const hs: WatchHistories = (await get(KEY_HISTORY)) || {}
  return hs
}

export async function deleteHistory(f: string) {
  const hs: WatchHistories = (await get(KEY_HISTORY)) || {}
  delete hs[f]
  await set(KEY_HISTORY, hs)
}
