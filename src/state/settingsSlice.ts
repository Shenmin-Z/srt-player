import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import {
  db,
  getSubtitlePreference,
  getWaveFormPreference,
  saveSubtitleAuto,
  saveSubtitleDelay,
  saveSubtitleListeningMode,
  saveEnableWaveForm,
  EnableWaveForm,
  deleteSampling,
  IS_MOBILE,
} from '../utils'

const INIT_LANG = (() => {
  if (/^zh/i.test(navigator.language)) {
    return 'zh-CN'
  }
  return 'en-US'
})()

const INIT_SETTING: Settings = {
  subtitleWidth: IS_MOBILE ? 300 : 400,
  subtitleFontSize: 16,
  locale: INIT_LANG,
}

async function getSettings(): Promise<Settings> {
  const init_setting = INIT_SETTING as unknown as { [s: string]: string | number }
  const settings = { ...init_setting }
  const tx = db.transaction('global', 'readwrite')
  for (const key of Object.keys(settings)) {
    const value = await tx.store.get(key)
    if (value === undefined) {
      await tx.store.put(init_setting[key], key)
    } else {
      settings[key] = value
    }
  }
  await tx.done
  return settings as unknown as Settings
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
  subtitleListeningMode: boolean
  subtitleFontSize: number
  waveform: EnableWaveForm
  locale: string
}

const initialState: InitialState = {
  loaded: false,
  subtitleWidth: 0,
  subtitleAuto: true,
  subtitleDelay: 0,
  subtitleListeningMode: false,
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
  await db.put('global', v, 'subtitleWidth')
  return v
})

export const updateSubtitleFontSize = createAsyncThunk<number, number | boolean>(
  'settings/updateSubtitleFontSize',
  async v => {
    let size: number
    if (typeof v === 'number') {
      size = v
    } else {
      const _size = ((await db.get('global', 'subtitleFontSize')) as number) || INIT_SETTING.subtitleFontSize
      size = _size + (v ? 1 : -1)
    }
    await db.put('global', size, 'subtitleFontSize')
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

export const updateSubtitleListeningMode = createAsyncThunk<boolean, { file: string }>(
  'settings/updateSubtitleListeningMode',
  async ({ file }, { getState }) => {
    const state = getState() as { settings: InitialState }
    const listeningMode = !state.settings.subtitleListeningMode
    await saveSubtitleListeningMode(file, listeningMode)
    return listeningMode
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
  await db.put('global', v, 'locale')
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
        state.subtitleListeningMode = action.payload.listeningMode
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
      .addCase(updateSubtitleListeningMode.fulfilled, (state, action) => {
        state.subtitleListeningMode = action.payload
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
