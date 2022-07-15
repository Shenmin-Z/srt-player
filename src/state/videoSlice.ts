import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface initialState {
  hasVideo: boolean
}

const initialState: initialState = { hasVideo: false }

export const videoSlice = createSlice({
  name: 'video',
  initialState,
  reducers: {
    setVideo: (state, action: PayloadAction<boolean>) => {
      state.hasVideo = action.payload
    },
  },
})

export const videoReducer = videoSlice.reducer
export const { setVideo } = videoSlice.actions
