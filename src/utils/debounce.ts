export function debounce(fn: () => void, t: number) {
  let id: number
  let locked = false
  return () => {
    if (!locked) {
      locked = true
    } else {
      clearTimeout(id)
    }
    id = setTimeout(() => {
      fn()
      locked = false
    }, t)
  }
}
