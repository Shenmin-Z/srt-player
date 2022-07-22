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
  const hasVideo = useSelector(s => s.video.hasVideo)
  useEffect(() => {
    if (!hasVideo) return
    return doVideo(video => {
      if (cbs.play) {
        video.addEventListener('play', cbs.play)
      }
      if (cbs.pause) {
        video.addEventListener('pause', cbs.pause)
      }
      if (cbs.seeked) {
        video.addEventListener('seeked', cbs.seeked)
      }
      return () => {
        if (cbs.play) {
          video.removeEventListener('play', cbs.play)
        }
        if (cbs.pause) {
          video.removeEventListener('pause', cbs.pause)
        }
        if (cbs.seeked) {
          video.removeEventListener('seeked', cbs.seeked)
        }
      }
    })
  }, [hasVideo])
}
