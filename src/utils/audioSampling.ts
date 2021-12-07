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
export const SLICE_WIDTH = 10002 // canvas cannot be too wide

export const getSampling = (file: string) => get<Blob[]>(file, AudioSamplingStore)
export const deleteSampling = (file: string) => del(file, AudioSamplingStore)
export const saveSampling = (file: string, blobs: Blob[]) => set(file, blobs, AudioSamplingStore)

export const computeAudioSampling = async (worker: Worker, file: File, fileName?: string) => {
  const audioContext = new AudioContext()
  const audioBuffer = await audioContext.decodeAudioData(await file.arrayBuffer())
  const float32Array = audioBuffer.getChannelData(0)
  const payload: Payload = {
    file: fileName ?? file.name,
    sampleRate: audioBuffer.sampleRate,
    duration: audioBuffer.duration,
    length: audioBuffer.length,
    buffer: [float32Array.buffer, float32Array.byteOffset, float32Array.byteLength / Float32Array.BYTES_PER_ELEMENT],
  }
  worker.postMessage(payload, [payload.buffer[0]])
  return await new Promise<number>(resolve => {
    worker.onmessage = e => {
      if (e.data === 'done') {
        worker.terminate()
        resolve(audioBuffer.duration)
      }
    }
  })
}
