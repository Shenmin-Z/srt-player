import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { createStore, get, set, del, keys } from 'idb-keyval'
import { deleteHistory, deleteSampling, Node, parseSRT } from '../utils'
import { message } from '../components/Modal'

interface VideoSubPair {
  video: FileSystemFileHandle
  subtitle: string | Node[]
}

const FilesStore = createStore('files', 'keyval')

export async function getSubtitle(file: string): Promise<Node[]> {
  const pair = (await get(file, FilesStore)) as VideoSubPair | undefined
  if (pair) {
    const { subtitle } = pair
    if (typeof subtitle === 'string') {
      try {
        const nodes = parseSRT(subtitle)
        if (nodes.length === 0) {
          message('Failed to parse srt file.')
        } else {
          saveVideoSubPair({ ...pair, subtitle: nodes })
        }
        return nodes
      } catch (e) {
        message('Error: ' + e)
        return []
      }
    } else {
      return subtitle
    }
  }
  return []
}

export async function getVideo(file: string): Promise<File | undefined> {
  const pair = (await get(file, FilesStore)) as VideoSubPair | undefined
  if (pair) {
    if ((await pair.video.queryPermission({ mode: 'read' })) !== 'granted') {
      const permission = await pair.video.requestPermission({ mode: 'read' })
      if (permission !== 'granted') {
        return undefined
      }
    }
    return (pair.video as any).getFile()
  }
  return undefined
}

class VideoFileCache {
  cache: { [s: string]: File }
  constructor() {
    this.cache = {}
  }
  add(f: File) {
    const url = URL.createObjectURL(f)
    this.cache[url] = f
    return url
  }
  get(url: string) {
    return this.cache[url]
  }
  remove(url: string) {
    if (url) {
      delete this.cache[url]
      URL.revokeObjectURL(url)
    }
  }
}

export const videoFileCache = new VideoFileCache()

type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

export async function saveVideoSubPair(pair: PartialBy<VideoSubPair, 'video'>) {
  if (!pair.video) return
  await set(pair.video.name, { video: pair.video, subtitle: pair.subtitle }, FilesStore)
}

export async function getFileList() {
  return (await keys(FilesStore)) as string[]
}

export const getList = createAsyncThunk('files/getList', async () => {
  const fileNames = await getFileList()
  fileNames.sort((a, b) => a.localeCompare(b))
  return fileNames
})

export const deleteFile = createAsyncThunk<void, string>('files/deleteFile', async (file, { dispatch }) => {
  await del(file, FilesStore)
  await deleteHistory(file)
  await deleteSampling(file)
  dispatch(getList())
})

const initialState: {
  list: string[]
  selected: null | string
} = { list: [], selected: null }

export const filesSlice = createSlice({
  name: 'files',
  initialState,
  reducers: {
    setSelected: (state, action: PayloadAction<string | null>) => {
      state.selected = action.payload
    },
  },
  extraReducers: builder => {
    builder.addCase(getList.fulfilled, (state, action) => {
      state.list = action.payload
    })
  },
})

export const filesReducer = filesSlice.reducer
export const { setSelected } = filesSlice.actions
