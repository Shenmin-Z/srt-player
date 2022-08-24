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

export function isAudioOnly(fileName: string, cb: (r: boolean) => void) {
  if (/\.(m4a|flac|alac|mp3|wav|wma|aac|ogg)$/i.test(fileName)) {
    cb(true)
    return
  }
  setTimeout(() => {
    const audioOnly = doVideoWithDefault(v => {
      const video = v as any
      if (video.webkitVideoDecodedByteCount === 0) return true
      if (video.mozDecodedFrames === 0) return true
      return false
    }, false)
    cb(audioOnly)
  }, 1000)
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
        if (!video.paused && !video.ended) cbs.play()
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
