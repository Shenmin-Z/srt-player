import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'

interface initialState {
  hasVideo: boolean
  status: 'playing' | 'stopped'
}
let initialState: initialState = { hasVideo: false, status: 'stopped' }

export let setVideo = createAsyncThunk<boolean, boolean>('video/setVideo', (v, { dispatch }) => {
  if (!v) return false
  let videoElement = document.getElementById('srt-player-video')
  if (videoElement) {
    function playListener() {
      dispatch(setVideoStatus('playing'))
    }
    function pauseListener() {
      dispatch(setVideoStatus('stopped'))
    }
    videoElement.addEventListener('play', playListener)
    videoElement.addEventListener('pause', pauseListener)
  }
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
