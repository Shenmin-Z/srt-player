import { FC, useEffect, useState } from 'react'
import cn from 'classnames'
import styles from './Nav.module.less'
import { useDispatch, useSelector, setSelected, updateSubtitleAuto } from '../../state'
import { useSaveHistory } from '../../utils'
import { Settings } from './Settings'
import { Info } from './Info'
import { WaveForm } from './WaveFormSetting'

export const Nav = () => {
  const dispatch = useDispatch()
  const file = useSelector(s => s.files.selected) as string
  const subtitleAuto = useSelector(s => s.settings.subtitleAuto)
  const enableWaveForm = useSelector(s => s.settings.waveform)
  const [showSettings, setShowSettings] = useState(false)
  const [showInfo, setShowInfo] = useState(false)
  const [showWaveForm, setShowWaveForm] = useState(false)
  const saveHistory = useSaveHistory()

  useEffect(() => {
    function keyListener(e: KeyboardEvent) {
      if (e.code === 'Escape' && !e.repeat) {
        setShowSettings(s => !s)
        return
      }
      if (!window.enableShortcuts) return
      if (e.code === 'KeyA' && !e.repeat) {
        dispatch(updateSubtitleAuto({ file }))
      }
      if (e.code === 'KeyW' && !e.repeat) {
        setShowWaveForm(s => !s)
      }
      if (e.code === 'KeyI' && !e.repeat) {
        setShowInfo(s => !s)
      }
    }
    window.addEventListener('keydown', keyListener)
    return () => {
      window.removeEventListener('keydown', keyListener)
    }
  }, [])

  return (
    <>
      <nav className={styles['nav']}>
        <Icon
          type="arrow_back"
          onClick={() => {
            saveHistory().then(() => {
              dispatch(setSelected(null))
            })
          }}
        />
        <div className={styles['name']}>{file}</div>
        <div className={styles['right']}>
          <Icon
            disabled={!enableWaveForm}
            type="graphic_eq"
            onClick={() => {
              setShowWaveForm(true)
            }}
          />
          <Icon
            disabled={!subtitleAuto}
            type="closed_caption_off"
            onClick={() => {
              dispatch(updateSubtitleAuto({ file }))
            }}
          />
          <Icon
            type="settings"
            onClick={() => {
              setShowSettings(true)
            }}
          />
          <Icon
            type="info"
            onClick={() => {
              setShowInfo(true)
            }}
          />
        </div>
      </nav>
      <WaveForm
        show={showWaveForm}
        onClose={() => {
          setShowWaveForm(false)
        }}
      />
      <Info
        show={showInfo}
        onClose={() => {
          setShowInfo(false)
        }}
      />
      <Settings
        show={showSettings}
        onClose={() => {
          setShowSettings(false)
        }}
      />
    </>
  )
}

window.enableShortcuts = true

const Icon: FC<{ type: string; onClick: () => void; disabled?: boolean }> = ({ type, onClick, disabled }) => {
  return (
    <span className={cn(styles['icon'], 'material-icons', { disabled: disabled })} onClick={onClick}>
      {type}
    </span>
  )
}
