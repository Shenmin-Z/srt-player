import { FC, useEffect, useState } from 'react'
import { getSampling, doVideo, doVideoWithDefault, PIXELS_PER_SECOND } from '../utils'
import { useSelector } from '../state'
import styles from './WaveForm.module.less'

interface Props {}

const WAVEFORM_ID = 'srt-player-waveform'

export const WaveForm: FC<Props> = () => {
  const file = useSelector(s => s.files.selected)
  const [offset, setOffset] = useState<number | undefined>(undefined)
  const [replayPos, setReplayPos] = useState<number>(-1)
  const [images, setImages] = useState<string[]>([])

  useEffect(() => {
    let cb = () => {}
    getSampling(file as string).then(blobs => {
      if (!blobs) return
      const urls = blobs.map(b => URL.createObjectURL(b))
      setImages(urls)
      setTimeout(() => {
        updatePosition(setOffset, true)
        // wait for 2 seconds to avoid conflict with seekListener
      }, 2000)
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
  }, [])

  useEffect(() => {
    function keyListener(e: KeyboardEvent) {
      if (!window.enableShortcuts) return
      if (e.code === 'KeyR' && !e.repeat) {
        doVideo(video => {
          if (replayPos > 0) {
            video.currentTime = replayPos / PIXELS_PER_SECOND
          }
        })
      }
    }
    window.addEventListener('keydown', keyListener)
    return () => {
      window.removeEventListener('keydown', keyListener)
    }
  }, [replayPos])

  return (
    <div className={styles['waveform']}>
      <div
        id={WAVEFORM_ID}
        className={styles['waveform-container']}
        style={{ display: offset === undefined ? 'none' : undefined }}
        onClick={e => {
          const { left } = (e.target as HTMLDivElement).getBoundingClientRect()
          setReplayPos(e.clientX - left)
        }}
      >
        {images.map(url => (
          <img key={url} src={url} />
        ))}
        <div className={styles['replay-indicator']} style={{ left: replayPos }} />
        <div className={styles['current-time-indicator']} style={{ left: offset }} />
      </div>
    </div>
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
