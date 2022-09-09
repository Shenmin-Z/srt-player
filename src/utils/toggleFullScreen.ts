declare const document: any

export function isFullscreen() {
  return !!(document.fullscreenElement || document.mozFullScreenElement || document.webkitFullscreenElement)
}

export const FULLSCREEN_ENABLED = !!(
  document.documentElement.requestFullscreen ||
  document.documentElement.mozRequestFullScreen ||
  document.documentElement.webkitRequestFullscreen
)

export function toggleFullScreen() {
  if (isFullscreen()) {
    // exit fullscreen
    if (document.cancelFullScreen) {
      document.cancelFullScreen()
    } else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen()
    } else if (document.webkitCancelFullScreen) {
      document.webkitCancelFullScreen()
    }
  } else {
    // enter fullscreen
    const element = document.body
    if (element.requestFullscreen) {
      element.requestFullscreen()
    } else if (element.mozRequestFullScreen) {
      element.mozRequestFullScreen()
    } else if (element.webkitRequestFullscreen) {
      element.webkitRequestFullscreen()
    }
  }
}
