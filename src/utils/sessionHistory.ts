export const GO_BACK_ID = 'go-back-to-list'
export const OPEN_PREVIOUS_ID = 'open-previoius'

enum SessionState {
  list = 1,
  video,
}

history.replaceState({ type: SessionState.list }, '')

export function pushHistory() {
  history.pushState({ type: SessionState.video }, '')
}

window.addEventListener('popstate', ({ state }) => {
  switch (state.type) {
    case SessionState.list: {
      // assusme in video page
      const goBackElm = document.getElementById(GO_BACK_ID)
      if (goBackElm) {
        goBackElm.click()
      }
      break
    }
    case SessionState.video: {
      // assusme in list page
      const previousElm = document.getElementById(OPEN_PREVIOUS_ID)
      if (previousElm) {
        previousElm.click()
      }
      break
    }
  }
})
