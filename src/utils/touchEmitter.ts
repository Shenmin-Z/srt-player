import { useRef, useState, useEffect } from 'react'

export type TouchEmitValue = number | 'start' | 'end'
export interface TouchEmitterListener {
  (deltaX: TouchEmitValue): void
}

export const useTouchEmitter = (deps: any[]) => {
  const divRef = useRef<HTMLDivElement>(null)
  const [emitter] = useState(() => {
    let listener: TouchEmitterListener = () => {}
    return {
      broadcast(deltaX: TouchEmitValue) {
        listener(deltaX)
      },
      subscribe(fn: TouchEmitterListener) {
        listener = fn
      },
    }
  })

  useEffect(() => {
    const div = divRef.current
    if (!div) return
    let lastX: number
    const onTouchStart = (e: TouchEvent) => {
      emitter.broadcast('start')
      lastX = e.touches[0].clientX
      div.addEventListener('touchmove', onTouchMove)
      div.addEventListener('touchend', onTouchFinish)
      div.addEventListener('touchcancel', onTouchFinish)
    }
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault()
      const x = e.touches[0].clientX
      if (Math.abs(x - lastX) > 1) {
        emitter.broadcast(x - lastX)
        lastX = x
      }
    }
    const onTouchFinish = () => {
      emitter.broadcast('end')
      div.removeEventListener('touchmove', onTouchMove)
      div.removeEventListener('touchend', onTouchFinish)
      div.removeEventListener('touchcancel', onTouchFinish)
    }
    div.addEventListener('touchstart', onTouchStart)
    return () => {
      div.removeEventListener('touchstart', onTouchStart)
    }
  }, deps)

  return { divRef, emitter }
}
