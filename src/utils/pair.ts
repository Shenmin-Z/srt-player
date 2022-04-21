import { FileWithHandle, supported } from 'browser-fs-access'
import { parseSubtitle, SSA, Node } from './subtitle'
import { db, VideoSubPair } from './idb'

async function getPair(file: string) {
  return db.get('files', file)
}

async function setPair(file: string, pair: VideoSubPair, saveCache = false) {
  if (supported || saveCache) {
    return db.put('files', pair, file)
  }
}

export async function deletePair(file: string) {
  videoFileCache.remove(file)
  return db.delete('files', file)
}

export async function getSubtitle(file: string): Promise<Node[]> {
  const pair = await getPair(file)
  if (!supported && !pair) {
    return subtitleFileCache.get(file)
  }
  if (!pair) return []
  const { subtitle, video } = pair
  if (typeof subtitle === 'string') {
    const nodes = parseSubtitle(subtitle)
    await setPair(file, { video, subtitle: nodes })
    return nodes
  } else {
    return subtitle
  }
}

export async function getVideo(file: string): Promise<Video | undefined> {
  if (videoFileCache.has(file)) {
    return videoFileCache.get(file)
  }
  const pair = await getPair(file)
  let videoFile: File
  if (!pair) return undefined
  if (pair.video instanceof File) {
    videoFile = pair.video
  } else {
    if ((await pair.video.queryPermission({ mode: 'read' })) !== 'granted') {
      const permission = await pair.video.requestPermission({ mode: 'read' })
      if (permission !== 'granted') {
        return undefined
      }
    }
    videoFile = await pair.video.getFile()
  }
  return videoFileCache.add(file, videoFile)
}

interface Video {
  file: File
  url: string
}

class VideoFileCache {
  cache: { [s: string]: Video }
  constructor() {
    this.cache = {}
  }
  add(n: string, f: File) {
    const url = URL.createObjectURL(f)
    this.cache[n] = { file: f, url }
    return this.cache[n]
  }
  has(n: string) {
    return this.cache[n] !== undefined
  }
  get(n: string) {
    return this.cache[n]
  }
  remove(n: string) {
    if (this.has(n)) {
      URL.revokeObjectURL(this.cache[n].url)
      delete this.cache[n]
    }
  }
}

const videoFileCache = new VideoFileCache()

// only for unsupported brwoser
class SubtitleFileCache {
  cache: { [s: string]: string | Node[] }
  constructor() {
    this.cache = {}
  }
  add(f: string, sub: string | Node[]) {
    this.cache[f] = sub
  }
  get(f: string): Node[] {
    const subtitle = this.cache[f]
    if (typeof subtitle === 'string') {
      const nodes = parseSubtitle(subtitle)
      this.add(f, nodes)
      return nodes
    } else {
      return subtitle
    }
  }
}

const subtitleFileCache = new SubtitleFileCache()

export async function saveVideoSubPair(pair: [FileWithHandle, FileWithHandle], saveCache = false) {
  const [video, subtitle] = pair
  let subtitleText = await subtitle.text()
  // add format at the beginning if not srt
  if (/.ssa$/i.test(subtitle.name)) {
    subtitleText = SSA + subtitleText
  }
  await setPair(
    video.name,
    {
      video: saveCache ? video : (video?.handle as FileSystemFileHandle),
      subtitle: subtitleText,
    },
    saveCache,
  )
  videoFileCache.add(video.name, video)
  if (!supported) {
    subtitleFileCache.add(video.name, subtitleText)
  }
}

export async function getFileList() {
  const cached = Object.keys(videoFileCache.cache)
  const stored = await db.getAllKeys('files')
  return Array.from(new Set([...cached, ...stored]))
}
