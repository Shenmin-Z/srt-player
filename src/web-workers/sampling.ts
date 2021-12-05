import { set } from 'idb-keyval'
import { Payload, SamplingResult, SAMPLING_PER_SECOND, AudioSamplingStore } from '../utils/audioSampling'

self.addEventListener('message', async e => {
  const { data } = e
  if (typeof data.file === 'string' && typeof data.sampleRate === 'number') {
    await sampling(data)
    self.postMessage('done')
  }
})

async function sampling(payload: Payload) {
  const { buffer: _buffer, sampleRate, length, file } = payload
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
  const samplingResult: SamplingResult = { sampleRate: SAMPLING_PER_SECOND, buffer: result }
  await set(file, samplingResult, AudioSamplingStore)
}

export {}
