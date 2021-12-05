import { get, del, createStore } from 'idb-keyval'

export const AudioSamplingStore = createStore('audio-sampling', 'keyval')

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

export const SAMPLING_PER_SECOND = 10

export const getSampling = (file: string) => get<SamplingResult>(file, AudioSamplingStore)
export const deleteSampling = (file: string) => del(file, AudioSamplingStore)

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
