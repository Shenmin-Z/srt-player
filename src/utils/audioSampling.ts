import { db, getDB } from './idb'

export interface Payload {
  file: string
  duration: number
  buffer: [ArrayBuffer, number, number]
}

export interface SamplingResult {
  buffer: Uint8Array
}

export interface RenderTask extends SamplingResult {
  file: string
}

export const SAMPLE_RATE = 44100
export const WAVEFORM_HEIGHT = 80
export const NEW_SAMPLING_RATE = 10
export const PIXELS_PER_SECOND = 30
export const SLICE_WIDTH = 4002 // canvas cannot be too wide

export const getSampling = (file: string) => db.get('audio-sampling', file)
export const deleteSampling = (file: string) => db.delete('audio-sampling', file)
// saveSampling is called from web worker which does not have access to db
export const saveSampling = async (file: string, blobs: Blob[]) => {
  const db = await getDB()
  return db.put('audio-sampling', blobs, file)
}

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

export const computeAudioSampling = async (task: ComputeAudioSampling) => {
  const { worker, arrayBuffer, fileName, videoDuration, onProgress } = task
  const audioContext = new OfflineAudioContext(1, 2, SAMPLE_RATE)
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
  const float32Array = audioBuffer.getChannelData(0)
  const payload: Payload = {
    file: fileName,
    duration: videoDuration,
    buffer: [float32Array.buffer, float32Array.byteOffset, float32Array.byteLength / Float32Array.BYTES_PER_ELEMENT],
  }
  worker.postMessage(payload, [payload.buffer[0]])
  return await new Promise<void>((resolve, reject) => {
    worker.onmessage = e => {
      if (e.data?.type === 'error') {
        reject(e.data?.error)
        return
      }
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
