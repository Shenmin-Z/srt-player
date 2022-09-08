declare const document: any
declare const Element: any

export function isFullscreen() {
  return !!(document.fullscreenElement || document.mozFullScreenElement || document.webkitFullscreenElement)
}

export function toggleFullScreen() {
  if (isFullscreen()) {
    // exit fullscreen
    if (document.cancelFullScreen) {
      document.cancelFullScreen()
    } else {
      if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen()
      } else {
        if (document.webkitCancelFullScreen) {
          document.webkitCancelFullScreen()
        }
      }
    }
  } else {
    // enter fullscreen
    const element = document.body
    if (element.requestFullscreen) {
      element.requestFullscreen()
    } else {
      if (element.mozRequestFullScreen) {
        element.mozRequestFullScreen()
      } else {
        if (element.webkitRequestFullscreen) {
          element.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT)
        }
      }
    }
  }
}
