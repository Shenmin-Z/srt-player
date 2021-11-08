import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { createStore, get, set, del, keys } from 'idb-keyval'
import { deleteHistory } from '../utils'

interface VideoSubPair {
  video: FileSystemHandle
  subtitle: string
}

const FilesStore = createStore('files', 'keyval')

export async function getSubtitle(file: string): Promise<string> {
  const pair = (await get(file, FilesStore)) as VideoSubPair | undefined
  if (pair) {
    return pair.subtitle
  }
  return ''
}

export async function getVideo(file: string): Promise<File | undefined> {
  const pair = (await get(file, FilesStore)) as VideoSubPair | undefined
  if (pair) {
    if ((await pair.video.queryPermission({ mode: 'read' })) !== 'granted') {
      await pair.video.requestPermission({ mode: 'read' })
    }
    return (pair.video as any).getFile()
  }
  return undefined
}

export async function saveVideoSubPair(pair: VideoSubPair) {
  await set(pair.video.name, pair, FilesStore)
}

export let getList = createAsyncThunk('files/getList', async () => {
  let fileNames = (await keys(FilesStore)) as string[]
  fileNames.sort((a, b) => a.localeCompare(b))
  return fileNames
})

export let deleteFile = createAsyncThunk<void, string>('files/deleteFile', async (file, { dispatch }) => {
  await del(file, FilesStore)
  await deleteHistory(file)
  dispatch(getList())
})

let initialState: {
  list: string[]
  selected: null | string
} = { list: [], selected: null }

export let filesSlice = createSlice({
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

export let filesReducer = filesSlice.reducer
export const { setSelected } = filesSlice.actions
