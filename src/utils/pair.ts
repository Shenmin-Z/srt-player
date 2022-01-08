import { FileWithHandle, supported } from 'browser-fs-access'
import { createStore, get, set, del, keys } from 'idb-keyval'
import { parseSRT, Node } from './subtitle'

interface VideoSubPair {
  video: FileSystemFileHandle
  subtitle: string | Node[]
}

const FilesStore = createStore('files', 'keyval')

async function getPair(file: string) {
  const pair: VideoSubPair | undefined = await get(file, FilesStore)
  return pair
}

async function setPair(file: string, pair: VideoSubPair) {
  if (supported) {
    await set(file, pair, FilesStore)
  }
}

export async function deletePair(file: string) {
  videoFileCache.remove(file)
  await del(file, FilesStore)
}

export async function getSubtitle(file: string): Promise<Node[]> {
  if (!supported) {
    return subtitleFileCache.get(file)
  }
  const pair = await getPair(file)
  if (!pair) return []
  const { subtitle, video } = pair
  if (typeof subtitle === 'string') {
    const nodes = parseSRT(subtitle)
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
  if (!pair) return undefined
  if ((await pair.video.queryPermission({ mode: 'read' })) !== 'granted') {
    const permission = await pair.video.requestPermission({ mode: 'read' })
    if (permission !== 'granted') {
      return undefined
    }
  }
  const videoFile = await pair.video.getFile()
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
      const nodes = parseSRT(subtitle)
      this.add(f, nodes)
      return nodes
    } else {
      return subtitle
    }
  }
}

const subtitleFileCache = new SubtitleFileCache()

export async function saveVideoSubPair(pair: [FileWithHandle, FileWithHandle]) {
  const [video, subtitle] = pair
  const subtitleText = await subtitle.text()
  await setPair(video.name, { video: video?.handle as FileSystemFileHandle, subtitle: subtitleText })
  videoFileCache.add(video.name, video)
  if (!supported) {
    subtitleFileCache.add(video.name, subtitleText)
  }
}

export async function getFileList() {
  if (!supported) {
    return Object.keys(videoFileCache.cache)
  }
  return (await keys(FilesStore)) as string[]
}