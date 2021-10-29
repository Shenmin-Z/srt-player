import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { set, del, keys } from 'idb-keyval'

async function readText(file: File, encoding: string) {
  let reader = new FileReader()
  reader.readAsText(file, encoding)
  return await new Promise((res, rej) => {
    reader.onload = e => {
      if (e.target) {
        res(e.target.result)
      } else {
        rej()
      }
    }
    reader.onerror = () => {
      rej()
    }
  })
}

export let uploadFiles = createAsyncThunk<void, { files: FileList; encoding?: string }>(
  'files/uploadFiles',
  async ({ files, encoding = 'UTF-8' }, { dispatch }) => {
    for (let i = 0; i < files.length; i++) {
      let file = files[i]
      try {
        let text = await readText(file, encoding)
        await set(file.name, text)
      } catch (e) {
        console.error(e)
      }
    }
    dispatch(getList())
  },
)

export let getList = createAsyncThunk('files/getList', async () => {
  let fileNames = (await keys()) as string[]
  fileNames.sort((a, b) => a.localeCompare(b))
  return fileNames
})

export let deleteFile = createAsyncThunk<void, string>('files/deleteFile', async (file, { dispatch }) => {
  await del(file)
  dispatch(getList())
})

let initialState: {
  list: string[]
  selected: null | string
} = { list: [], selected: null }

export let filesSlice = createSlice({
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

export let filesReducer = filesSlice.reducer
export const { setSelected } = filesSlice.actions
