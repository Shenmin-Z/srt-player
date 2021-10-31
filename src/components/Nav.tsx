import { FC, useEffect, useState } from 'react'
import cn from 'classnames'
import styles from './Nav.module.less'
import { Modal } from './Modal'
import { useDispatch, useSelector, setSelected, videoElement, toggleDictionary } from '../state'
import { SubtitleWidthWithDictionary, SubtitleWidthWithoutDictionary, DictionaryWidth, getCSS, DictionaryUrl, DictionaryLeftOffset } from '../utils'

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

  let dispatch = useDispatch()

  let forward = (t: number) => () => {
    if (videoElement === null) return
    videoElement.blur()
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
        e.preventDefault()
        if (e.shiftKey) {
          forward(-3)()
        } else {
          forward(-10)()
        }
      }
      if (e.code === 'ArrowRight') {
        e.preventDefault()
        if (e.shiftKey) {
          forward(3)()
        } else {
          forward(10)()
        }
      }
      if (e.code === 'KeyD') {
        dispatch(toggleDictionary())
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
        <div className={styles['body']}>-3s</div>
        <div className={styles['title']}>
          <span className="material-icons">arrow_forward</span>
        </div>
        <div className={styles['body']}>+10s</div>
        <div className={styles['title']}>
          Shfit +<span className="material-icons">arrow_forward</span>
        </div>
        <div className={styles['body']}>+3s</div>
        <div className={styles['title']}>
          d
        </div>
        <div className={styles['body']}>Toggle dictionary</div>
      </div>
    </Modal>
  )
}

let Settings: FC<{ show: boolean; onClose: () => void }> = props => {
  let [dw, setDW] = useState(getCSS(DictionaryWidth))
  let [dicWidth, setDicWidth] = useState(getCSS(SubtitleWidthWithDictionary))
  let [noDicWidth, setNoDicWidth] = useState(getCSS(SubtitleWidthWithoutDictionary))
  let [url, setURL] = useState(DictionaryUrl.get())
  let [offset, setOffset] = useState(getCSS(DictionaryLeftOffset))

  let hasDictionary = useSelector(s => s.settings.hasDictionary)
  let dispatch = useDispatch()

  useEffect(() => {
    if (props.show) {
      setDW(getCSS(DictionaryWidth))
      setDicWidth(getCSS(SubtitleWidthWithDictionary))
      setNoDicWidth(getCSS(SubtitleWidthWithoutDictionary))
    }
  }, [props.show])

  return (
    <Modal {...props}>
      <div className={styles['settings']}>
        <div className={styles['title']}>Enable dictionary</div>
        <div className={styles['body']}>
          <input
            type="checkbox"
            checked={hasDictionary}
            onChange={e => {
              dispatch(toggleDictionary(e.target.checked))
            }}
          />
        </div>
        {hasDictionary && (
          <>
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
          </>
        )}
        <div className={styles['title']}>Subtitle width</div>
        <div className={styles['body']}>
          <input
            value={hasDictionary ? dicWidth : noDicWidth}
            onChange={e => {
              (hasDictionary ? setDicWidth : setNoDicWidth)(e.target.value)
            }}
            onBlur={() => {
              let width = parseInt(hasDictionary ? dicWidth : noDicWidth, 10)
              if (!isNaN(width)) {
                (hasDictionary ? SubtitleWidthWithDictionary : SubtitleWidthWithoutDictionary).set(width + 'px')
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
