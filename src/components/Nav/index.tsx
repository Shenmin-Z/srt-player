import { FC, ReactElement, useEffect, useState } from 'react'
import cn from 'classnames'
import styles from './Nav.module.less'
import { useDispatch, useSelector, setSelected, updateLayout, updateSubtitleAuto } from '../../state'
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
      if (e.code === 'KeyD' && !e.repeat) {
        dispatch(updateLayout())
      }
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
        <Title file={file} />
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
            type="autorenew"
            onClick={() => {
              dispatch(updateSubtitleAuto({ file }))
            }}
          />
          <Icon
            type="info"
            onClick={() => {
              setShowInfo(true)
            }}
          />
          <Icon
            type="settings"
            onClick={() => {
              setShowSettings(true)
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

const Title: FC<{ file: string }> = ({ file }) => {
  if (/\.srt$/i.test(file)) file = file.substring(0, file.length - 4)
  let inner: string | ReactElement = file
  const match = file.split('.')[0].match(/^(.*?)(\d+)$/)
  if (match) {
    inner = (
      <>
        {match[1]}
        <span className={styles['episode']}>{match[2]}</span>
      </>
    )
  }
  return (
    <div className={styles['name']}>
      <div>{inner}</div>
    </div>
  )
}

const Icon: FC<{ type: string; onClick: () => void; disabled?: boolean }> = ({ type, onClick, disabled }) => {
  return (
    <span className={cn(styles['icon'], 'material-icons', { [styles['disabled']]: disabled })} onClick={onClick}>
      {type}
    </span>
  )
}
