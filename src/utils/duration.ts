export async function getMediaDuration(f: File) {
  const video = document.createElement('video')
  video.preload = 'metadata'

  return new Promise<number>(resolve => {
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src)
      resolve(video.duration)
    }

    video.src = URL.createObjectURL(f)
  })
}
