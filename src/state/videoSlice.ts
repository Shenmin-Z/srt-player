import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { doVideo } from '../utils'

interface initialState {
  hasVideo: boolean
  status: 'playing' | 'stopped'
}
let initialState: initialState = { hasVideo: false, status: 'stopped' }

export let setVideo = createAsyncThunk<boolean, boolean>('video/setVideo', (v, { dispatch }) => {
  if (!v) return false
  doVideo(video => {
    function playListener() {
      dispatch(setVideoStatus('playing'))
    }
    function pauseListener() {
      dispatch(setVideoStatus('stopped'))
    }
    video.addEventListener('play', playListener)
    video.addEventListener('pause', pauseListener)
  })
  return true
})

export let videoSlice = createSlice({
  name: 'video',
  initialState,
  reducers: {
    setVideoStatus: (state, action: PayloadAction<initialState['status']>) => {
      state.status = action.payload
    },
  },
  extraReducers: builder => {
    builder.addCase(setVideo.fulfilled, (state, action) => {
      state.hasVideo = action.payload
    })
  },
})

export let videoReducer = videoSlice.reducer
export let { setVideoStatus } = videoSlice.actions
