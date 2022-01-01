import {
  Payload,
  SamplingResult,
  RenderTask,
  SAMPLING_PER_SECOND,
  PIXELS_PER_SECOND,
  SLICE_WIDTH,
  WAVEFORM_HEIGHT,
  saveSampling,
  StageEnum,
} from '../utils/audioSampling'

self.addEventListener('message', async e => {
  const data: Payload = e.data
  if (typeof data.file === 'string' && typeof data.sampleRate === 'number') {
    self.postMessage({ stage: StageEnum.resampling })
    const result = await sampling(data)
    self.postMessage({ stage: StageEnum.imageGeneration })
    await drawWaveForm({ ...result, file: data.file })
    self.postMessage({ stage: StageEnum.done })
  }
})

async function sampling(payload: Payload): Promise<SamplingResult> {
  const { buffer: _buffer, sampleRate, length } = payload
  const buffer = new Float32Array(..._buffer)
  const stepSize = sampleRate / SAMPLING_PER_SECOND
  const samples = []
  let max = 0
  for (let i = 0; i < length / stepSize; i++) {
    let tmp = 0
    for (let j = 0; j < stepSize; j++) {
      tmp += Math.abs(buffer[i * stepSize + j])
    }
    if (isNaN(tmp)) {
      continue
    }
    samples.push(tmp)
    max = Math.max(max, tmp)
  }
  const result = new Uint8Array(Math.ceil(length / stepSize))
  if (max !== 0) {
    for (let i = 0; i < result.length; i++) {
      result[i] = Math.floor((samples[i] / max) * 256)
    }
  }
  return { sampleRate: SAMPLING_PER_SECOND, buffer: result }
}

const LINE_WIDTH = 2
const GAP_WIDTH = 1

const drawWaveForm = async (task: RenderTask) => {
  const { sampleRate, buffer, file } = task
  const pixelPerSample = PIXELS_PER_SECOND / sampleRate
  const width = Math.ceil(buffer.length * pixelPerSample)
  const height = WAVEFORM_HEIGHT

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
      const x = GAP_WIDTH + (idx - start) * pixelPerSample
      const h = (buffer[idx] / 256) * height
      ctx.moveTo(x, (height - h) / 2)
      ctx.lineTo(x, (height + h) / 2)
      ctx.stroke()
    }
    conversions.push(canvas.convertToBlob({ type: 'image/webp' }))
  }
  const blobs = await Promise.all(conversions)
  await saveSampling(file, blobs)
}

export {}
