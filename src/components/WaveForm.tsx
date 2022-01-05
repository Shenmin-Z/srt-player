import { FC, useEffect, useState, useRef } from 'react'
import { getSampling, doVideo, doVideoWithDefault, PIXELS_PER_SECOND } from '../utils'
import { useSelector } from '../state'
import cn from 'classnames'
import styles from './WaveForm.module.less'

interface Props {}

const WAVEFORM_ID = 'srt-player-waveform'

export const WaveForm: FC<Props> = () => {
  const file = useSelector(s => s.files.selected) as string
  const [ready, setReady] = useState(false)
  const [offset, setOffset] = useState<number | undefined>(undefined)
  const [replayPos, setReplayPos] = useState<number>(-1)

  const images = useImages(file, setOffset, () => setReady(true))
  useEffect(() => {
    if (ready) {
      return listenToVideoEvents(setOffset)
    }
  }, [ready])

  useEffect(() => {
    function keyListener(e: KeyboardEvent) {
      if (!window.enableShortcuts) return
      if (e.code === 'KeyR' && !e.repeat) {
        doVideo(video => {
          if (replayPos > 0) {
            video.currentTime = replayPos / PIXELS_PER_SECOND
            video.play()
          }
        })
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
  }, [replayPos])

  return (
    <div className={cn(styles['waveform'], { [styles['ready']]: ready })}>
      <div
        id={WAVEFORM_ID}
        className={styles['waveform-container']}
        onClick={e => {
          const { left } = (e.target as HTMLDivElement).getBoundingClientRect()
          setReplayPos(e.clientX - left)
        }}
      >
        {images}
        <div
          className={styles['replay-indicator']}
          style={{ transform: `translate3d(${Math.floor(replayPos)}px,0,0)` }}
        />
        <div
          className={styles['current-time-indicator']}
          style={{ transform: `translate3d(${Math.floor(offset || -1)}px,0,0)` }}
        />
      </div>
    </div>
  )
}

const useImages = (file: string, setOffset: { (x: number): void }, onReady: { (): void }) => {
  const [images, setImages] = useState<string[]>([])
  const [loaded, setLoaded] = useState(false)
  const loadedCount = useRef(0)

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
    if (loaded) {
      updatePosition(setOffset, true)
      setTimeout(onReady)
    }
  }, [loaded])

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
  return doVideoWithDefault(
    video => {
      let enable = true
      const move = () => {
        if (!enable) return
        updatePosition(setOffset)
        requestAnimationFrame(move)
      }
      const playListener = () => {
        enable = true
        move()
      }
      const stopListener = () => {
        enable = false
      }
      const seekListener = () => {
        updatePosition(setOffset, true)
      }
      if (!video.paused && !video.ended) playListener()
      video.addEventListener('play', playListener)
      video.addEventListener('pause', stopListener)
      video.addEventListener('seeked', seekListener)
      return () => {
        video.removeEventListener('play', playListener)
        video.removeEventListener('pause', stopListener)
        video.removeEventListener('seeked', seekListener)
      }
    },
    () => {},
  )
}

const updatePosition = (() => {
  let locked = false
  return (setOffset: (x: number) => void, center = false) => {
    doVideo(video => {
      const offset = Math.floor(video.currentTime * PIXELS_PER_SECOND)
      setOffset(offset)

      if (locked) return
      const canvasContainer = document.getElementById(WAVEFORM_ID) as HTMLDivElement
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
