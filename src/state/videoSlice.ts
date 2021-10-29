import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'

interface initialState {
  hasVideo: boolean
  status: 'playing' | 'stopped'
}
let initialState: initialState = { hasVideo: false, status: 'stopped' }

export let videoElement: HTMLVideoElement | null = null
export let setVideo = createAsyncThunk<void, HTMLVideoElement | null>('video/setVideo', (v, { dispatch }) => {
  if (videoElement === null && v !== null) {
    function playListener() {
      dispatch(setVideoStatus('playing'))
    }
    function pauseListener() {
      dispatch(setVideoStatus('stopped'))
    }
    v.addEventListener('play', playListener)
    v.addEventListener('pause', pauseListener)
  }
  videoElement = v
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
    builder.addCase(setVideo.fulfilled, state => {
      state.hasVideo = videoElement !== null
    })
  },
})

export let videoReducer = videoSlice.reducer
export let { setVideoStatus } = videoSlice.actions
