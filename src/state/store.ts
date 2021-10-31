import { configureStore } from '@reduxjs/toolkit'
import { filesReducer } from './filesSlice'
import { videoReducer } from './videoSlice'
import { settingsReducer } from './settingsSlice'

export let store = configureStore({ reducer: { files: filesReducer, video: videoReducer, settings: settingsReducer } })

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
