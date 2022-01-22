import {
  Payload,
  SamplingResult,
  RenderTask,
  NEW_SAMPLING_RATE,
  PIXELS_PER_SECOND,
  SLICE_WIDTH,
  WAVEFORM_HEIGHT,
  saveSampling,
  StageEnum,
} from '../utils/audioSampling'

self.addEventListener('message', async e => {
  const data: Payload = e.data
  if (typeof data.file === 'string' && typeof data.duration === 'number') {
    try {
      self.postMessage({ stage: StageEnum.resampling })
      const result = await sampling(data)
      self.postMessage({ stage: StageEnum.imageGeneration })
      await drawWaveForm({ ...result, file: data.file }, 'svg')
      self.postMessage({ stage: StageEnum.done })
    } catch (e) {
      self.postMessage({ type: 'error', error: e + '' })
    }
  }
})

async function sampling(payload: Payload): Promise<SamplingResult> {
  const { buffer: _buffer, duration } = payload
  const buffer = new Float32Array(..._buffer)
  let total = NEW_SAMPLING_RATE * duration
  const stepSize = buffer.length / total
  total = Math.ceil(total)
  const samples: number[] = Array.from({ length: total })
  let max = 0
  for (let i = 0; i < total; i++) {
    let tmp = 0
    for (let j = 0; j < stepSize; j++) {
      const index = Math.floor(i * stepSize) + j
      if (index < buffer.length) {
        tmp += Math.abs(buffer[index])
      }
    }
    if (isNaN(tmp)) {
      continue
    }
    samples[i] = tmp
    max = Math.max(max, tmp)
  }
  const result = new Uint8Array(total)
  if (max !== 0) {
    for (let i = 0; i < result.length; i++) {
      result[i] = Math.floor((samples[i] / max) * 256)
    }
  }
  return { buffer: result }
}

const LINE_WIDTH = 2
const GAP_WIDTH = 1

const drawWaveForm = async (task: RenderTask, target: 'webp' | 'svg') => {
  const { buffer, file } = task
  const pixelPerSample = PIXELS_PER_SECOND / NEW_SAMPLING_RATE
  const width = Math.ceil(buffer.length * pixelPerSample)
  const height = WAVEFORM_HEIGHT

  const conversions = (target === 'webp' ? toWebp : toSvg)({ width, height, pixelPerSample, buffer })
  const blobs = await Promise.all(conversions)
  await saveSampling(file, blobs)
}

interface GenerateImage {
  (i: { width: number; height: number; pixelPerSample: number; buffer: Uint8Array }): Promise<Blob>[]
}

const toWebp: GenerateImage = ({ width, height, pixelPerSample, buffer }) => {
  const conversions: Promise<Blob>[] = []

  const numofSlices = Math.ceil(width / SLICE_WIDTH)
  for (let i = 0; i < numofSlices; i++) {
    const canvas = new OffscreenCanvas(
      i === numofSlices - 1 ? width - (numofSlices - 1) * SLICE_WIDTH : SLICE_WIDTH,
      height,
    )
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error()

    // draw line
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = LINE_WIDTH
    const samplePerSlice = Math.floor(SLICE_WIDTH / pixelPerSample)
    const start = i * samplePerSlice
    const end = start + Math.floor(canvas.width / pixelPerSample)
    for (let idx = start; idx < end; idx++) {
      let x = GAP_WIDTH + (idx - start) * pixelPerSample
      x = Math.round(x)
      let h = (buffer[idx] / 256) * height
      h = Math.round(h)
      ctx.moveTo(x, (height - h) / 2)
      ctx.lineTo(x, (height + h) / 2)
      ctx.stroke()
    }
    conversions.push(canvas.convertToBlob({ type: 'image/webp' }))
  }
  return conversions
}

const toSvg: GenerateImage = ({ width, height, pixelPerSample, buffer }) => {
  const conversions: Promise<Blob>[] = []

  const numofSlices = Math.ceil(width / SLICE_WIDTH)

  for (let i = 0; i < numofSlices; i++) {
    const svgWidth = i === numofSlices - 1 ? width - (numofSlices - 1) * SLICE_WIDTH : SLICE_WIDTH
    const svgPath: string[] = []

    const samplePerSlice = Math.floor(SLICE_WIDTH / pixelPerSample)
    const start = i * samplePerSlice
    const end = start + Math.floor(svgWidth / pixelPerSample)
    for (let idx = start; idx < end; idx++) {
      let mx = GAP_WIDTH + (idx - start) * pixelPerSample
      mx = Math.round(mx)
      let h = (buffer[idx] / 256) * height
      h = Math.round(h)
      let my = (height - h) / 2
      svgPath.push(`M${mx} ${my}v${h}`)
    }
    const svg = [
      `<svg width="${svgWidth}" height="${height}" xmlns="http://www.w3.org/2000/svg" stroke="#fff" stroke-width="2" fill="#000">`,
      `<path d="${svgPath.join('')}"/>`,
      '</svg>',
    ].join('\n')
    conversions.push(Promise.resolve(new Blob([svg], { type: 'image/svg+xml' })))
  }
  return conversions
}

export {}
