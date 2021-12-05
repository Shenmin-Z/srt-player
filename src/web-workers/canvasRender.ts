export interface Task {
  sliceWith: number
  pixelPerSecond: number
  sampleRate: number
  buffer: Uint8Array
  canvases: OffscreenCanvas[]
}

self.addEventListener('message', e => {
  const { data } = e
  if (typeof data.sliceWith === 'number' && typeof data.pixelPerSecond === 'number') {
    drawDetails(data)
  }
})

const drawDetails = (task: Task) => {
  const { sliceWith, pixelPerSecond, sampleRate, buffer, canvases } = task
  const pixelPerSample = pixelPerSecond / sampleRate
  const width = Math.ceil(buffer.length * pixelPerSample)
  const height = 80

  canvases.forEach((canvas, i) => {
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error()

    // draw background
    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, width, height)

    // draw line
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 2
    const samplePerSlice = Math.floor(sliceWith / pixelPerSample)
    const start = i * samplePerSlice
    const end = start + Math.floor(canvas.width / pixelPerSample)
    for (let idx = start; idx < end; idx++) {
      const x = ctx.lineWidth / 2 + (idx - start) * pixelPerSample
      const h = (buffer[idx] / 256) * height
      ctx.moveTo(x, (height - h) / 2)
      ctx.lineTo(x, (height + h) / 2)
      ctx.stroke()
    }
  })
}

export {}
