import { FileWithHandle, supported } from 'browser-fs-access'
import { parseSubtitle, SSA, Node } from './subtitle'
import { db, VideoSubPair } from './idb'
import { createSilentAudio } from './createEmptyAudio'
import { deleteHistory } from './history'
import { deleteSampling } from './audioSampling'

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
    return subtitle ?? []
  }
}

export async function getVideo(file: string): Promise<Video | undefined> {
  if (videoFileCache.has(file)) {
    return videoFileCache.get(file)
  }
  const pair = await getPair(file)
  let videoFile: File
  if (!pair) return undefined
  if (typeof pair.video === 'number') {
    videoFile = await createSilentAudio(pair.video, file)
  } else if (pair.video instanceof File) {
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
      return subtitle ?? []
    }
  }
}

const subtitleFileCache = new SubtitleFileCache()

export async function saveVideoSubPairs(vs: FileWithHandle[], ss: FileWithHandle[], saveCache: boolean) {
  await Promise.all(
    vs.map((v, idx) => {
      if (ss[idx]) {
        return saveVideoSubPair([v, ss[idx]], saveCache)
      } else {
        return saveVideoOnly(v, saveCache)
      }
    }),
  )
  if (ss.length > vs.length) {
    await Promise.all(ss.slice(vs.length).map(s => saveSubtitleOnly(s)))
  }

  // clear previous generated on unsupported browsers
  vs.forEach(v => {
    deleteHistory(v.name)
    deleteSampling(v.name)
  })
  if (ss.length > vs.length) {
    ss.slice(vs.length).forEach(s => {
      deleteHistory(s.name)
      deleteSampling(s.name)
    })
  }
}

async function saveVideoOnly(video: FileWithHandle, saveCache: boolean) {
  await setPair(
    video.name,
    {
      video: saveCache ? video : (video?.handle as FileSystemFileHandle),
    },
    saveCache,
  )
  videoFileCache.add(video.name, video)
}

const SUBTITLE_ONLY = ' [SUBTITLE_ONLY]'
export const isSubtitleOnly = (s: string) => s.endsWith(SUBTITLE_ONLY)
export const displayFileName = (s: string) => {
  if (isSubtitleOnly(s)) {
    return s.substring(0, s.length - SUBTITLE_ONLY.length)
  } else {
    return s
  }
}

async function saveSubtitleOnly(subtitle: FileWithHandle) {
  const subtitleText = await getSubtitleText(subtitle)
  const nodes = parseSubtitle(subtitleText)
  let duration = 0
  if (nodes.length) {
    duration = Math.ceil(nodes[nodes.length - 1].end.timestamp / 1000)
  }
  await setPair(
    subtitle.name + SUBTITLE_ONLY,
    {
      video: duration,
      subtitle: nodes,
    },
    true,
  )
}

export async function saveVideoSubPair(pair: [FileWithHandle, FileWithHandle], saveCache = false) {
  const [video, subtitle] = pair
  let subtitleText = await getSubtitleText(subtitle)
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

async function getSubtitleText(subtitle: FileWithHandle) {
  let subtitleText = await getFileText(subtitle)
  // add format at the beginning if not srt
  if (/.(ssa|ass)$/i.test(subtitle.name)) {
    subtitleText = SSA + subtitleText
  }
  return subtitleText
}

async function getFileText(file: File) {
  let encoding = 'utf-8'
  const bytes = new Uint8Array(await file.arrayBuffer())
  // check byte order mark
  if (bytes[0] === 0xff && bytes[1] === 0xfe) {
    encoding = 'utf-16le'
  } else if (bytes[0] === 0xfe && bytes[1] === 0xff) {
    encoding = 'utf-16be'
  }

  const decoder = new TextDecoder(encoding)
  return decoder.decode(bytes)
}

export async function getFileList() {
  const cached = Object.keys(videoFileCache.cache)
  const stored = await db.getAllKeys('files')
  return Array.from(new Set([...cached, ...stored]))
}
