export async function getMediaDuration(f: File) {
  const video = document.createElement('video')
  video.preload = 'metadata'

  return new Promise<number>((resolve, reject) => {
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src)
      resolve(video.duration)
    }

    video.onerror = () => {
      reject(`Failed to get duration of ${f.name}.`)
    }

    video.src = URL.createObjectURL(f)
  })
}
