declare const document: any
declare const Element: any

export function toggleFullScreen() {
  if (document.fullscreenElement || document.mozFullScreenElement || document.webkitFullscreenElement) {
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
    document.body.classList.remove('is-fullscreen')
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
    document.body.classList.add('is-fullscreen')
  }
}
