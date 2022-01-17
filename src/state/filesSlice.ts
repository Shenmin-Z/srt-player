import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { deleteHistory, deleteSampling, getFileList, deletePair } from '../utils'

export const getList = createAsyncThunk('files/getList', async () => {
  const fileNames = await getFileList()
  fileNames.sort((a, b) => a.localeCompare(b))
  return fileNames
})

export const deleteFile = createAsyncThunk<void, string>('files/deleteFile', async (file, { dispatch }) => {
  await deletePair(file)
  await deleteHistory(file)
  await deleteSampling(file)
  dispatch(getList())
})

const initialState: {
  list: null | string[]
  selected: null | string
} = { list: null, selected: null }

export const filesSlice = createSlice({
  name: 'files',
  initialState,
  reducers: {
    setSelected: (state, action: PayloadAction<string | null>) => {
      state.selected = action.payload
    },
  },
  extraReducers: builder => {
    builder.addCase(getList.fulfilled, (state, action) => {
      state.list = action.payload
    })
  },
})

export const filesReducer = filesSlice.reducer
export const { setSelected } = filesSlice.actions
