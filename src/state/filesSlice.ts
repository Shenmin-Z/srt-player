import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { deleteHistory, deleteSampling, getFileList, deletePair, Node, getSubtitle } from '../utils'

export const getList = createAsyncThunk('files/getList', async () => {
  const fileNames = await getFileList()
  fileNames.sort((a, b) => a.localeCompare(b))
  return fileNames
})

export const setSelected = createAsyncThunk<{ selected: null | string; subtitleNoes: null | Node[] }, string | null>(
  'files/setSelected',
  async f => {
    if (!f) {
      return {
        selected: null,
        subtitleNoes: null,
      }
    }
    try {
      const nodes = await getSubtitle(f)
      return {
        selected: f,
        subtitleNoes: nodes,
      }
    } catch {
      return {
        selected: f,
        subtitleNoes: [],
      }
    }
  },
)

export const deleteFile = createAsyncThunk<void, string>('files/deleteFile', async (file, { dispatch }) => {
  await deletePair(file)
  await deleteHistory(file)
  await deleteSampling(file)
  dispatch(getList())
})

const initialState: {
  list: null | string[]
  selected: null | string
  subtitleNoes: null | Node[]
} = { list: null, selected: null, subtitleNoes: null }

export const filesSlice = createSlice({
  name: 'files',
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(setSelected.fulfilled, (state, action) => {
        state.selected = action.payload.selected
        state.subtitleNoes = action.payload.subtitleNoes
      })
      .addCase(getList.fulfilled, (state, action) => {
        state.list = action.payload
      })
  },
})

export const filesReducer = filesSlice.reducer
