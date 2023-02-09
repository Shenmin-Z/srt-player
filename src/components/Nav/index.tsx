import { FC, ReactNode, useEffect, useState } from 'react'
import cn from 'classnames'
import styles from './Nav.module.less'
import {
  useDispatch,
  useSelector,
  setSelected,
  updateSubtitleAuto,
  updateSubtitleListeningMode,
  toggleSubtitleShowCN,
} from '../../state'
import { useSaveHistory, IS_MOBILE, trackGoBack, displayFileName } from '../../utils'
import { SubtitleSetting } from './SubtitleSetting'
import { Info } from './Info'
import { WaveForm } from './WaveFormSetting'

export const Nav = () => {
  const dispatch = useDispatch()
  const file = useSelector(s => s.files.selected) as string
  const subtitleAuto = useSelector(s => s.settings.subtitleAuto)
  const subtitleDelay = useSelector(s => s.settings.subtitleDelay)
  const delayText = subtitleDelay ? (subtitleDelay / 1000).toFixed(1) : ''
  const enableWaveForm = useSelector(s => s.settings.waveform)
  const [showSubtitle, setShowSubtitle] = useState(false)
  const [showInfo, setShowInfo] = useState(false)
  const [showWaveForm, setShowWaveForm] = useState(false)
  const saveHistory = useSaveHistory()

  useEffect(() => {
    function keyListener(e: KeyboardEvent) {
      if (!window.__SRT_ENABLE_SHORTCUTS__) return
      if (e.code === 'KeyS' && !e.repeat) {
        setShowSubtitle(s => !s)
      }
      if (e.code === 'KeyA' && !e.repeat) {
        dispatch(updateSubtitleAuto({ file }))
      }
      if (e.code === 'KeyL' && !e.repeat) {
        dispatch(updateSubtitleListeningMode({ file }))
      }
      if (e.code === 'KeyK' && !e.repeat) {
        dispatch(toggleSubtitleShowCN({ file }))
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
          onClick={async () => {
            await saveHistory()
            dispatch(setSelected(null))
            trackGoBack()
          }}
        />
        <div className={styles['name']}>{displayFileName(file)}</div>
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
              setShowSubtitle(true)
            }}
          >
            {delayText}
          </Icon>
          {!IS_MOBILE && (
            <Icon
              type="info"
              onClick={() => {
                setShowInfo(true)
              }}
            />
          )}
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
      <SubtitleSetting
        show={showSubtitle}
        onClose={() => {
          setShowSubtitle(false)
        }}
      />
    </>
  )
}

window.__SRT_ENABLE_SHORTCUTS__ = true

interface IconProps {
  type: string
  onClick: () => void
  disabled?: boolean
  children?: ReactNode
}

const Icon: FC<IconProps> = ({ type, onClick, disabled, children }) => {
  return (
    <div className={cn(styles['icon'], type, { disabled: disabled })} onClick={onClick}>
      <span className="material-icons">{type}</span>
      {children && <span className={styles['delay']}>{children}</span>}
    </div>
  )
}
