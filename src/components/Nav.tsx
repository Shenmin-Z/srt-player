import { FC, useEffect, useState } from 'react'
import cn from 'classnames'
import styles from './Nav.module.less'
import { Modal } from './Modal'
import { useDispatch, useSelector, setSelected, videoElement } from '../state'
import { SubtitleWidth, DictionaryWidth, getCSS, DictionaryUrl, DictionaryLeftOffset } from '../utils'

export let Nav = () => {
  let dispatch = useDispatch()
  let [showSettings, setShowSettings] = useState(false)
  let [showInfo, setShowInfo] = useState(false)

  return (
    <>
      <nav className={styles['nav']}>
        <Icon
          type="arrow_back"
          onClick={() => {
            dispatch(setSelected(null))
          }}
        />
        <Controls />
        <div className={styles['right']}>
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

let Controls = () => {
  let hasVideo = useSelector(s => s.video.hasVideo)
  let status = useSelector(s => s.video.status)

  let forward = (t: number) => () => {
    if (videoElement === null) return
    videoElement.currentTime += t
  }

  function togglePlay() {
    if (!hasVideo) return
    if (videoElement === null) return
    videoElement.blur()
    if (status === 'playing') {
      videoElement.pause()
    } else {
      videoElement.play()
    }
  }

  useEffect(() => {
    function keyListener(e: KeyboardEvent) {
      if (e.code === 'Space') {
        e.preventDefault()
        togglePlay()
      }
      if (e.code === 'ArrowLeft') {
        if (e.shiftKey) {
          forward(-2)()
        } else {
          forward(-10)()
        }
      }
      if (e.code === 'ArrowRight') {
        if (e.shiftKey) {
          forward(2)()
        } else {
          forward(10)()
        }
      }
    }
    window.addEventListener('keydown', keyListener)
    return () => {
      window.removeEventListener('keydown', keyListener)
    }
  }, [togglePlay])

  return (
    <div className={styles['play']}>
      <Icon type="replay_5" onClick={forward(-5)} disabled={!hasVideo} />
      <Icon type="replay_10" onClick={forward(-10)} disabled={!hasVideo} />
      <Icon type={status === 'playing' ? 'pause' : 'play_circle_outline'} onClick={togglePlay} disabled={!hasVideo} />
      <Icon type="forward_5" onClick={forward(5)} disabled={!hasVideo} />
      <Icon type="forward_10" onClick={forward(10)} disabled={!hasVideo} />
    </div>
  )
}

let Info: FC<{ show: boolean; onClose: () => void }> = props => {
  return (
    <Modal {...props}>
      <div className={styles['shortcuts']}>Shortcuts</div>
      <div className={styles['info']}>
        <div className={styles['title']}>Space</div>
        <div className={styles['body']}>Play / Pasue</div>
        <div className={styles['title']}>
          <span className="material-icons">arrow_back</span>
        </div>
        <div className={styles['body']}>-10s</div>
        <div className={styles['title']}>
          Shfit +<span className="material-icons">arrow_back</span>
        </div>
        <div className={styles['body']}>-2s</div>
        <div className={styles['title']}>
          <span className="material-icons">arrow_forward</span>
        </div>
        <div className={styles['body']}>+10s</div>
        <div className={styles['title']}>
          Shfit +<span className="material-icons">arrow_forward</span>
        </div>
        <div className={styles['body']}>+2s</div>
      </div>
    </Modal>
  )
}

let Settings: FC<{ show: boolean; onClose: () => void }> = props => {
  let [dw, setDW] = useState(getCSS(DictionaryWidth))
  let [sw, setSW] = useState(getCSS(SubtitleWidth))
  let [url, setURL] = useState(DictionaryUrl.get())
  let [offset, setOffset] = useState(getCSS(DictionaryLeftOffset))

  useEffect(() => {
    if (props.show) {
      setDW(getCSS(DictionaryWidth))
      setSW(getCSS(SubtitleWidth))
    }
  }, [props.show])

  return (
    <Modal {...props}>
      <div className={styles['settings']}>
        <div className={styles['title']}>Dictionary width</div>
        <div className={styles['body']}>
          <input
            value={dw}
            onChange={e => {
              setDW(e.target.value)
            }}
            onBlur={() => {
              let width = parseInt(dw, 10)
              if (!isNaN(width)) {
                DictionaryWidth.set(width + 'px')
              }
            }}
          />
        </div>
        <div className={styles['title']}>Dictionary URL</div>
        <div className={styles['body']}>
          <input
            value={url || ''}
            onChange={e => {
              setURL(e.target.value)
            }}
            onBlur={() => {
              DictionaryUrl.set(url || '')
            }}
          />
        </div>
        <div className={styles['title']}>Dictionary Left Offset</div>
        <div className={styles['body']}>
          <input
            value={offset}
            onChange={e => {
              setOffset(e.target.value)
            }}
            onBlur={() => {
              let width = parseInt(offset, 10)
              if (!isNaN(width)) {
                DictionaryLeftOffset.set(width + 'px')
              }
            }}
          />
        </div>
        <div className={styles['title']}>Subtitle width</div>
        <div className={styles['body']}>
          <input
            value={sw}
            onChange={e => {
              setSW(e.target.value)
            }}
            onBlur={() => {
              let width = parseInt(sw, 10)
              if (!isNaN(width)) {
                SubtitleWidth.set(width + 'px')
              }
            }}
          />
        </div>
      </div>
    </Modal>
  )
}

let Icon: FC<{ type: string; onClick: () => void; disabled?: boolean }> = ({ type, onClick, disabled }) => {
  return (
    <span className={cn(styles['icon'], 'material-icons', { [styles['disabled']]: disabled })} onClick={onClick}>
      {type}
    </span>
  )
}
