export class Subject<T> {
  listeners: ((v: T) => void)[]
  constructor() {
    this.listeners = []
  }
  next(v: T) {
    this.listeners.forEach(f => {
      f(v)
    })
  }
  subscribe(f: (v: T) => void) {
    this.listeners.push(f)
    return () => {
      this.listeners = this.listeners.filter(i => i !== f)
    }
  }
}
