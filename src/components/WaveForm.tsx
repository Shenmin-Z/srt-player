import { FC, useEffect, useState } from 'react'
import CanvasRenderingWorker from '../web-workers/canvasRender?worker&inline'
import { Task } from '../web-workers/canvasRender'
import { getSampling, doVideo, doVideoWithDefault } from '../utils'
import { useSelector } from '../state'
import styles from './WaveForm.module.less'

interface Props {}

const WAVEFORM_ID = 'srt-player-waveform'

const PIXELS_PER_SECOND = 30
const SLICE_WIDTH = 1002 // canvas cannot be too wide

export const WaveForm: FC<Props> = () => {
  const file = useSelector(s => s.files.selected)
  const [offset, setOffset] = useState<number | undefined>(undefined)
  const [replayPos, setReplayPos] = useState<number>(-1)

  useEffect(() => {
    let terminate = () => {}
    drawWaveForm(file as string).then(cb => {
      terminate = cb
      updatePosition(setOffset, true)
    })
    return doVideoWithDefault(video => {
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
        terminate()
      }
    }, terminate)
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

const drawWaveForm = async (file: string) => {
  const samplingResult = await getSampling(file)
  if (!samplingResult) throw new Error()
  const { sampleRate, buffer } = samplingResult
  const canvasContainer = document.getElementById(WAVEFORM_ID) as HTMLDivElement
  const pixelPerSample = PIXELS_PER_SECOND / sampleRate
  const width = Math.ceil(buffer.length * pixelPerSample)
  const height = 80

  const canvases: OffscreenCanvas[] = []
  const numofSlices = Math.ceil(width / SLICE_WIDTH)
  for (let i = 0; i < numofSlices; i++) {
    const canvas = document.createElement('canvas')
    canvasContainer.appendChild(canvas)
    canvas.height = height
    canvas.width = i === numofSlices - 1 ? width - (numofSlices - 1) * SLICE_WIDTH : SLICE_WIDTH
    canvases.push(canvas.transferControlToOffscreen())
  }

  const worker: Worker = new CanvasRenderingWorker()
  const task: Task = {
    sliceWith: SLICE_WIDTH,
    pixelPerSecond: PIXELS_PER_SECOND,
    sampleRate,
    buffer,
    canvases,
  }
  worker.postMessage(task, canvases)
  return () => {
    worker.terminate()
  }
}
