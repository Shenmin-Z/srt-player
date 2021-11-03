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

export let useRestoreSubtitle = () => {
  let file = useSelector(s => s.files.selected)
  return async () => {
    if (!file) return
    let hs: WatchHistories = (await get(KEY_HISTORY)) || {}
    let subtitleTop = hs[file]?.subtitleTop ?? 0
    let subtitle = getSubtitleElm()
    if (subtitle) {
      subtitle.scroll({ top: subtitleTop, behavior: 'auto' })
    }
  }
}

export let useRestoreVideo = () => {
  let file = useSelector(s => s.files.selected)
  return async () => {
    if (!file) return
    let hs: WatchHistories = (await get(KEY_HISTORY)) || {}
    let videoTime = hs[file]?.videoTime ?? 0
    let video = getVideoElm()
    if (video) {
      video.currentTime = videoTime
    }
  }
}

export let useSaveHistory = () => {
  let file = useSelector(s => s.files.selected)
  return async () => {
    if (!file) return
    let hs: WatchHistories = (await get(KEY_HISTORY)) || {}
    let h = { subtitleTop: 0, videoTime: 0, ...((hs[file] as WatchHistory | undefined) || {}) }
    let subtitle = getSubtitleElm()
    if (subtitle) {
      h.subtitleTop = Math.floor(subtitle.scrollTop)
    }
    let video = getVideoElm()
    if (video) {
      h.videoTime = Math.floor(video.currentTime)
    }
    hs[file] = h
    await set(KEY_HISTORY, hs)
  }
}

export async function getWatchHistory() {
  let hs: WatchHistories = (await get(KEY_HISTORY)) || {}
  return hs
}
