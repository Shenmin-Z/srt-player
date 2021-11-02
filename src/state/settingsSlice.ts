import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { get, set } from 'idb-keyval'

const SETTINGS_KEY = 'SRT-SETTINGS'

export async function getSettings(): Promise<Settings> {
  let settings = await get<Settings>(SETTINGS_KEY)
  if (!settings) {
    settings = {
      layout: {
        layout: '3col',
        subtitle2Col: 600,
        subtitle3Col: 400,
        dictionary: 600,
        dictionaryLeftOffset: 0,
      },
      dictionary: {
        url: 'https://www.mojidict.com/',
      },
    }
    await set(SETTINGS_KEY, settings)
  }
  return settings
}

type Layout = '2col' | '3col'
interface Settings {
  layout: {
    layout: Layout
    subtitle2Col: number // 2 columns layout
    subtitle3Col: number
    dictionary: number
    dictionaryLeftOffset: number
  }
  dictionary: {
    url: string
  }
}

interface InitialState {
  loaded: boolean
  layout: Layout
  subtitleWidth: number
  dictionaryWidth: number
  dictionaryLeftOffset: number
  dictionaryUrl: string
}

let initialState: InitialState = {
  loaded: false,
  layout: '3col',
  subtitleWidth: 0,
  dictionaryWidth: 0,
  dictionaryLeftOffset: 0,
  dictionaryUrl: '',
}

export let LoadSettingsFromLocal = createAsyncThunk('settings/init', async () => {
  let settings = await getSettings()
  let root = document.documentElement
  root.style.setProperty('--dictionary-width', `${settings.layout.dictionary}px`)
  root.style.setProperty(
    '--subtitle-width',
    `${settings.layout.layout === '2col' ? settings.layout.subtitle2Col : settings.layout.subtitle3Col}px`,
  )
  root.style.setProperty('--dictionary-left-offset', `${settings.layout.dictionaryLeftOffset}px`)
  return settings
})

export let updateDictionaryWidth = createAsyncThunk<number, number>('settings/updateDictionaryWidth', async v => {
  let settings = await getSettings()
  settings.layout.dictionary = v
  await set(SETTINGS_KEY, settings)
  let root = document.documentElement
  root.style.setProperty('--dictionary-width', `${v}px`)
  return v
})

export let updateDictionaryLeftOffset = createAsyncThunk<number, number>(
  'settings/updateDictionaryLeftOffset',
  async v => {
    let settings = await getSettings()
    settings.layout.dictionaryLeftOffset = v
    await set(SETTINGS_KEY, settings)
    let root = document.documentElement
    root.style.setProperty('--dictionary-left-offset', `${v}px`)
    return v
  },
)

export let updateDictionaryUrl = createAsyncThunk<string, string>('settings/updateDictionaryUrl', async v => {
  let settings = await getSettings()
  settings.dictionary.url = v
  await set(SETTINGS_KEY, settings)
  return v
})

export let updateSubtitleWidth = createAsyncThunk<number, number>(
  'settings/updateSubtitleWidth',
  async (v, { getState }) => {
    let state = getState() as { settings: InitialState }
    let settings = await getSettings()
    if (state.settings.layout === '2col') {
      settings.layout.subtitle2Col = v
    } else {
      settings.layout.subtitle3Col = v
    }
    await set(SETTINGS_KEY, settings)
    let root = document.documentElement
    root.style.setProperty('--subtitle-width', `${v}px`)
    return v
  },
)

export let updateLayout = createAsyncThunk<[Layout, number], Layout | undefined>(
  'settings/updateLayout',
  async (v, { getState }) => {
    let state = getState() as { settings: InitialState }
    let next: Layout
    if (v === undefined) {
      next = state.settings.layout === '2col' ? '3col' : '2col'
    } else {
      next = v
    }
    let settings = await getSettings()
    settings.layout.layout = next
    await set(SETTINGS_KEY, settings)
    let root = document.documentElement
    let width = settings.layout.layout === '2col' ? settings.layout.subtitle2Col : settings.layout.subtitle3Col
    root.style.setProperty('--subtitle-width', `${width}px`)
    return [next, width]
  },
)

export let settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(LoadSettingsFromLocal.fulfilled, (state, action) => {
        state.loaded = true
        let { layout, dictionary } = action.payload
        state.layout = layout.layout
        state.subtitleWidth = layout.layout === '2col' ? layout.subtitle2Col : layout.subtitle3Col
        state.dictionaryWidth = layout.dictionary
        state.dictionaryLeftOffset = layout.dictionaryLeftOffset
        state.dictionaryUrl = dictionary.url
      })
      .addCase(updateDictionaryLeftOffset.fulfilled, (state, action) => {
        state.dictionaryLeftOffset = action.payload
      })
      .addCase(updateDictionaryWidth.fulfilled, (state, action) => {
        state.dictionaryWidth = action.payload
      })
      .addCase(updateDictionaryUrl.fulfilled, (state, action) => {
        state.dictionaryUrl = action.payload
      })
      .addCase(updateSubtitleWidth.fulfilled, (state, action) => {
        state.subtitleWidth = action.payload
      })
      .addCase(updateLayout.fulfilled, (state, action) => {
        state.layout = action.payload[0]
        state.subtitleWidth = action.payload[1]
      })
  },
})

export let settingsReducer = settingsSlice.reducer
