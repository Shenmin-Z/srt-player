import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface initialState {
  hasVideo: boolean
  playing: boolean
  total: number
  current: number
}

const initialState: initialState = { hasVideo: false, playing: false, total: 0, current: 0 }

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
})

export const videoReducer = videoSlice.reducer
export const { setVideo, updateVideoTime, setVideoStatus } = videoSlice.actions
