import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { EnableDictionary } from '../utils'

interface initialState {
  hasDictionary: boolean
}
let initialState: initialState = { hasDictionary: EnableDictionary.get() === 'true' }

export let toggleDictionary = createAsyncThunk<boolean, boolean | undefined>('settings/toggleDictionary', (v, { getState }) => {
  let state = getState() as { settings: initialState }
  let next:boolean
  if (v === undefined) {
    next = !state.settings.hasDictionary
  } else {
    next = v
  }
  EnableDictionary.set(`${next}`)
  return next
})

export let settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
  },
  extraReducers: builder => {
    builder.addCase(toggleDictionary.fulfilled, (state, action) => {
      state.hasDictionary = action.payload
    })
  },
})

export let settingsReducer = settingsSlice.reducer
