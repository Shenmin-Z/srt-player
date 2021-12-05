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
