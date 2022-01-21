import { FC, useEffect, useState } from 'react'
import cn from 'classnames'
import styles from './Nav.module.less'
import { useDispatch, useSelector, setSelected, updateSubtitleAuto } from '../../state'
import { useSaveHistory, IS_MOBILE } from '../../utils'
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
      if (!window.enableShortcuts) return
      if (e.code === 'KeyS' && !e.repeat) {
        setShowSubtitle(s => !s)
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
          onClick={async () => {
            await saveHistory()
            dispatch(setSelected(null))
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

window.enableShortcuts = true

const Icon: FC<{ type: string; onClick: () => void; disabled?: boolean }> = ({ type, onClick, disabled, children }) => {
  return (
    <div className={cn(styles['icon'], { disabled: disabled })} onClick={onClick}>
      <span className="material-icons">{type}</span>
      {children && <span className={styles['delay']}>{children}</span>}
    </div>
  )
}
