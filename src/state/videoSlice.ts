import { createSlice, PayloadAction } from '@reduxjs/toolkit'

type videoStatus = 'init' | 'playing' | 'paused' | 'ended'
interface initialState {
  hasVideo: boolean
  status: videoStatus
  seeked: number // use number to mock seeked event
}

const initialState: initialState = { hasVideo: false, status: 'init', seeked: -1 }

export const videoSlice = createSlice({
  name: 'video',
  initialState,
  reducers: {
    setVideo: (state, action: PayloadAction<boolean>) => {
      state.hasVideo = action.payload
    },
    setVideoStatus: (state, action: PayloadAction<videoStatus>) => {
      state.status = action.payload
    },
    increaseSeeked(state) {
      state.seeked = (state.seeked + 1) % 10
    },
  },
})

export const videoReducer = videoSlice.reducer
export const { setVideo, setVideoStatus, increaseSeeked } = videoSlice.actions
