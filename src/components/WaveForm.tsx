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

const getOffset = (video: HTMLVideoElement) => -Math.floor(video.currentTime * PIXELS_PER_SECOND)

export const WaveForm: FC<Props> = () => {
  const file = useSelector(s => s.files.selected)
  const [offset, setOffset] = useState<number | undefined>(undefined)
  const [replayPos, setReplayPos] = useState<number | undefined>(undefined)

  useEffect(() => {
    let terminate = () => {}
    drawWaveForm(file as string).then(cb => {
      terminate = cb
      doVideo(video => {
        setOffset(getOffset(video))
      })
    })
    return doVideoWithDefault(video => {
      let enable = true
      const move = () => {
        if (!enable) return
        const newOffset = getOffset(video)
        setOffset(newOffset)
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
        setOffset(getOffset(video))
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
          if (replayPos) {
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
    <div
      className={styles['waveform']}
      onClick={e => {
        const { left, width } = (e.target as HTMLDivElement).getBoundingClientRect()
        const newPosition = e.clientX - left - width / 2 - (offset ?? 0)
        if (newPosition >= 0) {
          setReplayPos(newPosition)
        }
      }}
    >
      <div
        id={WAVEFORM_ID}
        className={styles['waveform-container']}
        style={{ display: offset === undefined ? 'none' : undefined, transform: `translate3d(${offset}px,0,0)` }}
      >
        <div className={styles['replay-indicator']} style={{ left: replayPos }} />
      </div>
    </div>
  )
}

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
