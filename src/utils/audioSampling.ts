import { set, get, del, createStore } from 'idb-keyval'

const AudioSamplingStore = createStore('audio-sampling', 'keyval')

export interface Payload {
  file: string
  sampleRate: number
  duration: number
  length: number
  buffer: [ArrayBuffer, number, number]
}

export interface SamplingResult {
  sampleRate: number
  buffer: Uint8Array
}

export interface RenderTask extends SamplingResult {
  file: string
}

export const WAVEFORM_HEIGHT = 80
export const SAMPLING_PER_SECOND = 10
export const PIXELS_PER_SECOND = 30
export const SLICE_WIDTH = 4002 // canvas cannot be too wide

export const getSampling = (file: string) => get<Blob[]>(file, AudioSamplingStore)
export const deleteSampling = (file: string) => del(file, AudioSamplingStore)
export const saveSampling = (file: string, blobs: Blob[]) => set(file, blobs, AudioSamplingStore)

export enum StageEnum {
  stopped,
  decoding,
  resampling,
  imageGeneration,
  done,
}

interface ComputeAudioSampling {
  worker: Worker
  arrayBuffer: ArrayBuffer
  fileName: string
  videoDuration: number
  onProgress: (s: StageEnum) => void
}

export class DurationError {
  constructor(public expected: number, public actual: number) {}
}

export const computeAudioSampling = async (task: ComputeAudioSampling) => {
  const { worker, arrayBuffer, fileName, videoDuration, onProgress } = task
  const audioContext = new AudioContext()
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
  const { sampleRate, duration, length } = audioBuffer
  if (Math.abs(videoDuration - duration) > 0.5) {
    throw new DurationError(videoDuration, duration)
  }
  const float32Array = audioBuffer.getChannelData(0)
  const payload: Payload = {
    file: fileName,
    sampleRate,
    duration,
    length,
    buffer: [float32Array.buffer, float32Array.byteOffset, float32Array.byteLength / Float32Array.BYTES_PER_ELEMENT],
  }
  worker.postMessage(payload, [payload.buffer[0]])
  return await new Promise<void>(resolve => {
    worker.onmessage = e => {
      const stage = e.data?.stage as StageEnum
      if (typeof stage !== 'number') return
      onProgress(stage)
      if (stage === StageEnum.done) {
        worker.terminate()
        resolve()
      }
    }
  })
}
