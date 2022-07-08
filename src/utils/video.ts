import { useEffect } from 'react'
import { useSelector } from '../state'

export const VIDEO_ID = 'srt-player-video'

export function doVideo<T>(cb: (v: HTMLVideoElement) => T): T | undefined {
  const videoElement = document.getElementById(VIDEO_ID) as HTMLVideoElement | null
  if (!videoElement) return undefined
  return cb(videoElement)
}

export function doVideoWithDefault<T>(cb: (v: HTMLVideoElement) => T, defaultValue: T): T {
  const videoElement = document.getElementById(VIDEO_ID) as HTMLVideoElement | null
  if (!videoElement) return defaultValue
  return cb(videoElement)
}

interface VideoEvents {
  play?(): void
  pause?(): void
  seeked?(): void
}

export const useVideoEvents = (cbs: VideoEvents) => {
  const { status, seeked } = useSelector(s => s.video)
  useEffect(() => {
    if (status === 'playing' && cbs.play) {
      cbs.play()
    }
    if (status === 'paused' && cbs.pause) {
      cbs.pause()
    }
  }, [status])
  useEffect(() => {
    if (seeked === -1) return
    if (cbs.seeked) {
      cbs.seeked()
    }
  }, [seeked])
}
