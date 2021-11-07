import { get, set } from 'idb-keyval'
import { useSelector } from '../state'

const KEY_HISTORY = 'SRT-HISTORY'

export interface WatchHistory {
  videoTime: number
  subtitleTop: number
}

export interface WatchHistories {
  [s: string]: WatchHistory
}

function getSubtitleElm() {
  return document.getElementById('srt-player-subtitle') as HTMLDivElement | undefined
}

function getVideoElm() {
  return document.getElementById('srt-player-video') as HTMLVideoElement | undefined
}

export const useRestoreSubtitle = () => {
  const file = useSelector(s => s.files.selected)
  return async () => {
    if (!file) return
    const hs: WatchHistories = (await get(KEY_HISTORY)) || {}
    const subtitleTop = hs[file]?.subtitleTop ?? 0
    const subtitle = getSubtitleElm()
    if (subtitle) {
      subtitle.scrollTop = subtitleTop
    }
  }
}

export const useRestoreVideo = () => {
  const file = useSelector(s => s.files.selected)
  return async () => {
    if (!file) return
    const hs: WatchHistories = (await get(KEY_HISTORY)) || {}
    const videoTime = hs[file]?.videoTime ?? 0
    const video = getVideoElm()
    if (video) {
      video.currentTime = videoTime
    }
  }
}

export const useSaveHistory = () => {
  const file = useSelector(s => s.files.selected)
  return async () => {
    if (!file) return
    const hs: WatchHistories = (await get(KEY_HISTORY)) || {}
    const h = { subtitleTop: 0, videoTime: 0, ...((hs[file] as WatchHistory | undefined) || {}) }
    const subtitle = getSubtitleElm()
    if (subtitle) {
      h.subtitleTop = Math.floor(subtitle.scrollTop)
    }
    const video = getVideoElm()
    if (video) {
      h.videoTime = Math.floor(video.currentTime)
    }
    hs[file] = h
    await set(KEY_HISTORY, hs)
  }
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
