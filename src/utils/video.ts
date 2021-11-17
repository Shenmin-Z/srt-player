export const VIDEO_ID = 'srt-player-video'

export function doVideo(cb: (v: HTMLVideoElement) => void) {
  const videoElement = document.getElementById(VIDEO_ID) as HTMLVideoElement | null
  if (!videoElement) return
  return cb(videoElement)
}
