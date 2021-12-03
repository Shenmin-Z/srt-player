import Worker from './audioSampling?worker'
import { Payload } from './audioSampling'

const worker = new Worker()

export const loadAudio = async (file: File) => {
  const audioContext = new AudioContext()
  const audioBuffer = await audioContext.decodeAudioData(await file.arrayBuffer())
  const payload: Payload = {
    file: file.name,
    sampleRate: audioBuffer.sampleRate,
    duration: audioBuffer.duration,
    length: audioBuffer.length,
    buffer: audioBuffer.getChannelData(0),
  }
  worker.postMessage(payload)
  await new Promise(resolve => {
    worker.onmessage = e => {
      if (e.data === 'done') {
        resolve(null)
      }
    }
  })
}
