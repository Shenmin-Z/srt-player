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
import { useSaveHistory, IS_MOBILE, trackGoBack, displayFileName, GO_BACK_ID } from '../../utils'
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
      if (e.code === 'KeyS' && !e.repeat && !e.ctrlKey && e.metaKey !== true) {
        setShowSubtitle(s => !s)
      }
      if (e.code === 'KeyA' && !e.repeat && !e.ctrlKey && e.metaKey !== true) {
        dispatch(updateSubtitleAuto({ file }))
      }
      if (e.code === 'KeyL' && !e.repeat && !e.ctrlKey && e.metaKey !== true) {
        dispatch(updateSubtitleListeningMode({ file }))
      }
      if (e.code === 'KeyK' && !e.repeat && !e.ctrlKey && e.metaKey !== true) {
        dispatch(toggleSubtitleShowCN({ file }))
      }
      if (e.code === 'KeyW' && !e.repeat && !e.ctrlKey && e.metaKey !== true) {
        setShowWaveForm(s => !s)
      }
      if (e.code === 'KeyI' && !e.repeat && !e.ctrlKey && e.metaKey !== true) {
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
        <span
          id={GO_BACK_ID}
          className={styles['hidden']}
          onClick={async () => {
            await saveHistory()
            dispatch(setSelected(null))
            trackGoBack()
          }}
        />
        <Icon
          type="arrow_back"
          onClick={() => {
            history.back()
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
  id?: string
}

const Icon: FC<IconProps> = ({ type, onClick, disabled, children, id }) => {
  return (
    <div className={cn(styles['icon'], type, { disabled: disabled })} onClick={onClick} id={id}>
      <span className="material-icons">{type}</span>
      {children && <span className={styles['delay']}>{children}</span>}
    </div>
  )
}
