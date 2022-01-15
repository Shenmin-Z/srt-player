import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { get, set } from 'idb-keyval'
import {
  getSubtitlePreference,
  getWaveFormPreference,
  saveSubtitleAuto,
  saveSubtitleDelay,
  saveEnableWaveForm,
  EnableWaveForm,
  deleteSampling,
  IS_MOBILE,
} from '../utils'

const SETTINGS_KEY = 'SRT-SETTINGS'

const INIT_SETTING: Settings = {
  subtitleWidth: IS_MOBILE ? 300 : 400,
  subtitleFontSize: 16,
  locale: 'en-US',
}

async function getSettings(): Promise<Settings> {
  const settings = (await get(SETTINGS_KEY)) as Settings
  Object.keys(settings || {}).forEach(k => {
    const key = k as keyof Settings
    if (INIT_SETTING[key] === undefined || typeof INIT_SETTING[key] !== typeof settings[key]) {
      delete settings[key]
    }
  })
  const ns: Settings = { ...INIT_SETTING, ...(settings || {}) }
  if (JSON.stringify(settings) !== JSON.stringify(ns)) {
    await set(SETTINGS_KEY, ns)
  }
  return ns
}

interface Settings {
  subtitleWidth: number
  subtitleFontSize: number
  locale: string
}

interface InitialState {
  loaded: boolean
  subtitleWidth: number
  subtitleAuto: boolean
  subtitleDelay: number
  subtitleFontSize: number
  waveform: EnableWaveForm
  locale: string
}

const initialState: InitialState = {
  loaded: false,
  subtitleWidth: 0,
  subtitleAuto: true,
  subtitleDelay: 0,
  subtitleFontSize: 16,
  waveform: EnableWaveForm.disable,
  locale: '',
}

function setWidth(v: { [s: string]: number }) {
  Object.entries(v).forEach(([k, v]) => {
    document.documentElement.style.setProperty(k, v + 'px')
  })
}

export const LoadSettingsFromLocal = createAsyncThunk('settings/init', async () => {
  const settings = await getSettings()
  setWidth({
    '--subtitle-width': settings.subtitleWidth,
  })
  return settings
})

export const LoadSubtitlePreference = createAsyncThunk('settings/subtitlePreference', async (file: string) => {
  return await getSubtitlePreference(file)
})

export const LoadWaveFormPreference = createAsyncThunk('settings/waveFormPreference', async (file: string) => {
  return await getWaveFormPreference(file)
})

export const updateSubtitleWidth = createAsyncThunk<number, number>('settings/updateSubtitleWidth', async v => {
  setWidth({ '--subtitle-width': v })
  const settings = await getSettings()
  settings.subtitleWidth = v
  await set(SETTINGS_KEY, settings)
  return v
})

export const updateSubtitleFontSize = createAsyncThunk<number, number | boolean>(
  'settings/updateSubtitleFontSize',
  async v => {
    const settings = await getSettings()
    let size: number
    if (typeof v === 'number') {
      size = v
    } else {
      size = settings.subtitleFontSize + (v ? 1 : -1)
    }
    settings.subtitleFontSize = size
    await set(SETTINGS_KEY, settings)
    return size
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

export const updateEnableWaveForm = createAsyncThunk<EnableWaveForm, { file: string; enable: EnableWaveForm }>(
  'settings/updateEnableWaveForm',
  async ({ file, enable }) => {
    if (enable === EnableWaveForm.disable) {
      deleteSampling(file)
    }
    await saveEnableWaveForm(file, enable)
    return enable
  },
)

export const updateLanguage = createAsyncThunk<string, string>('settings/updateLanguage', async v => {
  const settings = await getSettings()
  settings.locale = v
  await set(SETTINGS_KEY, settings)
  return v
})

export const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(LoadSettingsFromLocal.fulfilled, (state, action) => {
        state.loaded = true
        const { subtitleWidth, subtitleFontSize, locale } = action.payload
        state.subtitleWidth = subtitleWidth
        state.subtitleFontSize = subtitleFontSize
        state.locale = locale
      })
      .addCase(LoadSubtitlePreference.fulfilled, (state, action) => {
        state.subtitleAuto = action.payload.auto
        state.subtitleDelay = action.payload.delay
      })
      .addCase(LoadWaveFormPreference.fulfilled, (state, action) => {
        state.waveform = action.payload
      })
      .addCase(updateSubtitleWidth.fulfilled, (state, action) => {
        state.subtitleWidth = action.payload
      })
      .addCase(updateSubtitleFontSize.fulfilled, (state, action) => {
        state.subtitleFontSize = action.payload
      })
      .addCase(updateSubtitleAuto.fulfilled, (state, action) => {
        state.subtitleAuto = action.payload
      })
      .addCase(updateSubtitleDelay.fulfilled, (state, action) => {
        state.subtitleDelay = action.payload
      })
      .addCase(updateEnableWaveForm.fulfilled, (state, action) => {
        state.waveform = action.payload
      })
      .addCase(updateLanguage.fulfilled, (state, action) => {
        state.locale = action.payload
      })
  },
})

export const settingsReducer = settingsSlice.reducer
