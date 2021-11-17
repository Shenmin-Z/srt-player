import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { get, set } from 'idb-keyval'
import { getSubtitlePreference, saveSubtitleAuto, saveSubtitleDelay } from '../utils'

const SETTINGS_KEY = 'SRT-SETTINGS'

const INIT_SETTING: Settings = {
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
export async function getSettings(): Promise<Settings> {
  const settings = await get<Settings>(SETTINGS_KEY)
  let ns: Settings
  if (!settings) {
    ns = INIT_SETTING
  } else {
    ns = settings
    Object.keys(INIT_SETTING).forEach(k => {
      const key = k as keyof Settings
      ns[key] = { ...INIT_SETTING[key], ...(ns[key] || {}) } as any
    })
  }
  if (JSON.stringify(settings) !== JSON.stringify(ns)) {
    await set(SETTINGS_KEY, settings)
  }
  return ns
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
  subtitleAuto: boolean
  subtitleDelay: number
}

const initialState: InitialState = {
  loaded: false,
  layout: '3col',
  subtitleWidth: 0,
  dictionaryWidth: 0,
  dictionaryLeftOffset: 0,
  dictionaryUrl: '',
  subtitleAuto: false,
  subtitleDelay: 0,
}

function setWidth(v: { [s: string]: number }) {
  Object.entries(v).forEach(([k, v]) => {
    document.documentElement.style.setProperty(k, v + 'px')
  })
}

export const LoadSettingsFromLocal = createAsyncThunk('settings/init', async () => {
  const settings = await getSettings()
  setWidth({
    '--dictionary-width': settings.layout.dictionary,
    '--subtitle-width': settings.layout.layout === '2col' ? settings.layout.subtitle2Col : settings.layout.subtitle3Col,
    '--dictionary-left-offset': settings.layout.dictionaryLeftOffset,
  })
  return settings
})

export const LoadSubtitlePreference = createAsyncThunk('settings/subtitlePreference', async (file: string) => {
  return await getSubtitlePreference(file)
})

export const updateDictionaryWidth = createAsyncThunk<number, number>('settings/updateDictionaryWidth', async v => {
  setWidth({ '--dictionary-width': v })
  const settings = await getSettings()
  settings.layout.dictionary = v
  await set(SETTINGS_KEY, settings)
  return v
})

export const updateDictionaryLeftOffset = createAsyncThunk<number, number>(
  'settings/updateDictionaryLeftOffset',
  async v => {
    setWidth({ '--dictionary-left-offset': v })
    const settings = await getSettings()
    settings.layout.dictionaryLeftOffset = v
    await set(SETTINGS_KEY, settings)
    return v
  },
)

export const updateDictionaryUrl = createAsyncThunk<string, string>('settings/updateDictionaryUrl', async v => {
  const settings = await getSettings()
  settings.dictionary.url = v
  await set(SETTINGS_KEY, settings)
  return v
})

export const updateSubtitleWidth = createAsyncThunk<number, number>(
  'settings/updateSubtitleWidth',
  async (v, { getState }) => {
    setWidth({ '--subtitle-width': v })
    const state = getState() as { settings: InitialState }
    const settings = await getSettings()
    if (state.settings.layout === '2col') {
      settings.layout.subtitle2Col = v
    } else {
      settings.layout.subtitle3Col = v
    }
    await set(SETTINGS_KEY, settings)
    return v
  },
)

export const updateLayout = createAsyncThunk<[Layout, number], Layout | undefined>(
  'settings/updateLayout',
  async (v, { getState }) => {
    const state = getState() as { settings: InitialState }
    let next: Layout
    if (v === undefined) {
      next = state.settings.layout === '2col' ? '3col' : '2col'
    } else {
      next = v
    }
    const settings = await getSettings()
    settings.layout.layout = next
    await set(SETTINGS_KEY, settings)
    const width = settings.layout.layout === '2col' ? settings.layout.subtitle2Col : settings.layout.subtitle3Col
    setWidth({ '--subtitle-width': width })
    return [next, width]
  },
)

export const updateSubtitleAuto = createAsyncThunk<boolean, { file: string; auto?: boolean }>(
  'settings/updateSubtitleAuto',
  async ({ file, auto: _auto }, { getState }) => {
    let auto: boolean
    if (_auto === undefined) {
      const state = getState() as { settings: InitialState }
      auto = !state.settings.subtitleAuto
    } else {
      auto = _auto
    }
    await saveSubtitleAuto(file, auto)
    return auto
  },
)

export const updateSubtitleDelay = createAsyncThunk<number, { file: string; delay: number }>(
  'settings/updateSubtitleDelay',
  async ({ file, delay }) => {
    await saveSubtitleDelay(file, delay)
    return delay
  },
)

export const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(LoadSettingsFromLocal.fulfilled, (state, action) => {
        state.loaded = true
        const { layout, dictionary } = action.payload
        state.layout = layout.layout
        state.subtitleWidth = layout.layout === '2col' ? layout.subtitle2Col : layout.subtitle3Col
        state.dictionaryWidth = layout.dictionary
        state.dictionaryLeftOffset = layout.dictionaryLeftOffset
        state.dictionaryUrl = dictionary.url
      })
      .addCase(LoadSubtitlePreference.fulfilled, (state, action) => {
        state.subtitleAuto = action.payload.auto
        state.subtitleDelay = action.payload.delay
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
      .addCase(updateSubtitleAuto.fulfilled, (state, action) => {
        state.subtitleAuto = action.payload
      })
      .addCase(updateSubtitleDelay.fulfilled, (state, action) => {
        state.subtitleDelay = action.payload
      })
  },
})

export const settingsReducer = settingsSlice.reducer
