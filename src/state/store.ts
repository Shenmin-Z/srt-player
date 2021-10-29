import { configureStore } from '@reduxjs/toolkit'
import { filesReducer } from './filesSlice'
import { videoReducer } from './videoSlice'

export let store = configureStore({ reducer: { files: filesReducer, video: videoReducer } })

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
