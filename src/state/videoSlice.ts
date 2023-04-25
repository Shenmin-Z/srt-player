import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { getBookmarks, saveBookmarks, Bookmark } from '../utils'

interface InitialState {
  hasVideo: boolean
  playing: boolean
  total: number
  current: number
  bookmarks: Bookmark[]
}

const initialState: InitialState = { hasVideo: false, playing: false, total: 0, current: 0, bookmarks: [] }

export const LoadBookmarks = createAsyncThunk('video/bookmarks', async (file: string) => {
  return await getBookmarks(file)
})

export const updateBookmark = createAsyncThunk<Bookmark[], { file: string; bookmark: Bookmark }>(
  'video/updateBookmark',
  async ({ file, bookmark }, { getState }) => {
    const state = getState() as { video: InitialState }
    const newBookmarks = [...state.video.bookmarks]
    for (let i = 0; i < newBookmarks.length; i++) {
      if (newBookmarks[i].time === bookmark.time) {
        newBookmarks[i] = bookmark
        break
      }
    }
    await saveBookmarks(file, newBookmarks)
    return newBookmarks
  },
)

export const addBookmark = createAsyncThunk<Bookmark[], { file: string; currentTime: number }>(
  'video/addBookmark',
  async ({ file, currentTime }, { getState }) => {
    const state = getState() as { video: InitialState }
    if (state.video.bookmarks.findIndex(b => b.time === currentTime) !== -1) return state.video.bookmarks
    const newBookmarks = [...state.video.bookmarks, { time: currentTime, name: '' }].sort((a, b) => a.time - b.time)
    await saveBookmarks(file, newBookmarks)
    return newBookmarks
  },
)

export const removeBookmark = createAsyncThunk<Bookmark[], { file: string; currentTime: number }>(
  'video/removeBookmark',
  async ({ file, currentTime }, { getState }) => {
    const state = getState() as { video: InitialState }
    const index = state.video.bookmarks.findIndex(b => b.time === currentTime)
    if (index === -1) return state.video.bookmarks
    const newBookmarks = [...state.video.bookmarks]
    newBookmarks.splice(index, 1)
    await saveBookmarks(file, newBookmarks)
    return newBookmarks
  },
)

export const videoSlice = createSlice({
  name: 'video',
  initialState,
  reducers: {
    setVideo: (state, action: PayloadAction<{ hasVideo: boolean; total?: number }>) => {
      state.hasVideo = action.payload.hasVideo
      if (action.payload.total) {
        state.total = action.payload.total
      }
    },
    updateVideoTime: (state, action: PayloadAction<number>) => {
      state.current = action.payload
    },
    setVideoStatus: (state, action: PayloadAction<boolean | undefined>) => {
      if (action.payload !== undefined) {
        state.playing = action.payload
      } else {
        state.playing = !state.playing
      }
    },
  },
  extraReducers: builder => {
    builder
      .addCase(LoadBookmarks.fulfilled, (state, action) => {
        state.bookmarks = action.payload
      })
      .addCase(updateBookmark.fulfilled, (state, action) => {
        state.bookmarks = action.payload
      })
      .addCase(addBookmark.fulfilled, (state, action) => {
        state.bookmarks = action.payload
      })
      .addCase(removeBookmark.fulfilled, (state, action) => {
        state.bookmarks = action.payload
      })
  },
})

export const videoReducer = videoSlice.reducer
export const { setVideo, updateVideoTime, setVideoStatus } = videoSlice.actions
