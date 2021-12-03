import { set, createStore } from 'idb-keyval'

const AudioSamplingStore = createStore('audio-sampling', 'keyval')

export interface Payload {
  file: string
  sampleRate: number
  duration: number
  length: number
  buffer: Float32Array
}

self.addEventListener('message', e => {
  sampling(e.data)
  self.postMessage('done')
})

export const SAMPLING_PER_SECOND = 25

function sampling(payload: Payload) {
  const { buffer, sampleRate, length, file } = payload
  const stepSize = sampleRate / SAMPLING_PER_SECOND
  const result = new Float32Array(Math.ceil(length / stepSize))
  let max = 0
  for (let i = 0; i < length / stepSize; i++) {
    let tmp = 0
    for (let j = 0; j < stepSize; j++) {
      tmp += Math.abs(buffer[i * stepSize + j])
    }
    if (isNaN(tmp)) {
      continue
    }
    result[i] = tmp
    max = Math.max(max, tmp)
  }
  if (max !== 0) {
    for (let i = 0; i < result.length; i++) {
      result[i] /= max
    }
  }
  set(file, { sampleRate: SAMPLING_PER_SECOND, buffer: result }, AudioSamplingStore)
}

export {}
