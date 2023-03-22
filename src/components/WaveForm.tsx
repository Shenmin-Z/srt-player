import { FC, useEffect, useState, useRef } from 'react'
import { getSampling, doVideo, doVideoWithDefault, useVideoEvents, PIXELS_PER_SECOND } from '../utils'
import { useSelector } from '../state'
import { TouchEmitterListener, TouchEmitValue } from '../utils'
import cn from 'classnames'
import styles from './WaveForm.module.less'

interface Props {
  replayEmitter: { subscribe: (fn: TouchEmitterListener) => void }
  scrollEmitter: { subscribe: (fn: TouchEmitterListener) => void }
}

const WAVEFORM_ID = 'srt-player-waveform'

export const WaveForm: FC<Props> = ({ replayEmitter, scrollEmitter }) => {
  const file = useSelector(s => s.files.selected) as string
  const waveformDivRef = useRef<HTMLDivElement>(null)
  const [ready, setReady] = useState(false)
  const [offset, setOffset] = useState<number | undefined>(undefined)
  const [replayPos, setReplayPos] = useState<number>(-1)
  const replayPosRef = useRef(replayPos)

  useEffect(() => {
    replayPosRef.current = replayPos
  }, [replayPos])

  const images = useImages(file, setOffset, () => setReady(true))
  useEffect(() => {
    if (ready) {
      setReplayPos(doVideoWithDefault(v => v.currentTime, 0) * PIXELS_PER_SECOND)
    }
  }, [ready])
  listenToVideoEvents(setOffset)

  const replay = (pos: number, play = false) => {
    doVideo(video => {
      if (pos >= 0) {
        video.currentTime = pos / PIXELS_PER_SECOND
        if (play) {
          video.play()
        }
      }
    })
  }

  useEffect(() => {
    function keyListener(e: KeyboardEvent) {
      if (!window.__SRT_ENABLE_SHORTCUTS__) return
      if (e.code === 'KeyR' && !e.repeat) {
        replay(replayPosRef.current, true)
      } else if (e.code == 'Comma') {
        const step = e.shiftKey ? 3 : 1
        setReplayPos(p => p - step)
      } else if (e.code == 'Period') {
        const step = e.shiftKey ? 3 : 1
        setReplayPos(p => p + step)
      } else if (e.code == 'Slash' && !e.repeat) {
        doVideo(video => {
          setReplayPos(video.currentTime * PIXELS_PER_SECOND)
        })
      }
    }
    window.addEventListener('keydown', keyListener)
    return () => {
      window.removeEventListener('keydown', keyListener)
    }
  }, [])

  useEffect(() => {
    replayEmitter.subscribe(deltaX =>
      setReplayPos(p => {
        if (deltaX === 'start' || deltaX === 'end') {
          return p
        } else {
          return p + deltaX
        }
      }),
    )
    scrollEmitter.subscribe(setScrollPosition)
  }, [])

  return (
    <div
      className={cn(styles['waveform'], { [styles['ready']]: ready })}
      onWheel={e => {
        const container = e.currentTarget
        const halfWidth = container.clientWidth / 2
        const left = (e.deltaY < 0 ? -1 : 1) * halfWidth
        container.scrollBy({ left })
      }}
    >
      <div
        id={WAVEFORM_ID}
        ref={waveformDivRef}
        className={styles['waveform-container']}
        onClick={e => {
          if (!waveformDivRef.current) return
          const { left } = waveformDivRef.current.getBoundingClientRect()
          const newReplayPos = e.clientX - left
          setReplayPos(newReplayPos)
          replay(newReplayPos)
        }}
      >
        {images}
        <div
          className={styles['replay-indicator']}
          style={{ transform: `translate3d(${Math.floor(replayPos)}px,0,0)` }}
        />
        <div
          className={styles['current-time-indicator']}
          style={{ transform: `translate3d(${Math.floor(offset || 1)}px,0,0)` }}
        />
      </div>
    </div>
  )
}

const useImages = (file: string, setOffset: { (x: number): void }, onReady: { (): void }) => {
  const [images, setImages] = useState<string[]>([])
  const [loaded, setLoaded] = useState(false)
  const loadedCount = useRef(0)
  const hasVideo = useSelector(s => s.video.hasVideo)

  useEffect(() => {
    let cb = () => {}
    getSampling(file).then(blobs => {
      if (!blobs) return
      const urls = blobs.map(b => URL.createObjectURL(b))
      setImages(urls)
      cb = () => {
        urls.forEach(url => {
          URL.revokeObjectURL(url)
        })
      }
    })
    return () => {
      cb()
    }
  }, [])

  useEffect(() => {
    if (loaded && hasVideo) {
      updatePosition(setOffset, true)
      onReady()
    }
  }, [loaded, hasVideo])

  return (
    <>
      {images.map(url => (
        <img
          key={url}
          src={url}
          onLoad={() => {
            loadedCount.current++
            if (loadedCount.current === images.length) {
              setLoaded(true)
            }
          }}
        />
      ))}
    </>
  )
}

const listenToVideoEvents = (setOffset: (x: number) => void) => {
  const enabled = useRef(true)
  const tick = () => {
    if (!enabled.current) return
    updatePosition(setOffset)
    requestAnimationFrame(tick)
  }
  useVideoEvents({
    play() {
      enabled.current = true
      tick()
    },
    pause() {
      enabled.current = false
    },
    seeked() {
      updatePosition(setOffset, true)
    },
  })
}

const updatePosition = (() => {
  let locked = false
  return (setOffset: (x: number) => void, center = false) => {
    doVideo(video => {
      const offset = Math.floor(video.currentTime * PIXELS_PER_SECOND)
      setOffset(offset)

      if (locked) return
      const canvasContainer = document.getElementById(WAVEFORM_ID) as HTMLDivElement
      if (!canvasContainer) return
      const parent = canvasContainer.parentElement as HTMLDivElement
      const { width } = parent.getBoundingClientRect()
      const left = parent.scrollLeft
      if (offset - left < 0 || offset - left > width) {
        locked = true
        setTimeout(() => {
          locked = false
        }, 1000)
        parent.scrollLeft = offset - (center ? width / 2 : 0)
      }
    })
  }
})()

const setScrollPosition = (() => {
  let lastScrollLeft = -1
  return (deltaX: TouchEmitValue) => {
    const canvasContainer = document.getElementById(WAVEFORM_ID) as HTMLDivElement
    if (!canvasContainer) return
    const parent = canvasContainer.parentElement as HTMLDivElement
    if (deltaX === 'start') {
      lastScrollLeft = parent.scrollLeft
      parent.classList.add(styles['instant-scroll'])
      return
    }
    if (deltaX === 'end') {
      parent.classList.remove(styles['instant-scroll'])
      return
    }
    console.log(lastScrollLeft)
    const newScrollLeft = lastScrollLeft - deltaX
    if (newScrollLeft < 0) {
      return
    }
    parent.scrollLeft = newScrollLeft
    lastScrollLeft = newScrollLeft
  }
})()
