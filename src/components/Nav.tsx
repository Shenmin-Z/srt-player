import { FC, ReactElement, useEffect, useState } from 'react'
import cn from 'classnames'
import styles from './Nav.module.less'
import { Modal } from './Modal'
import {
  useDispatch,
  useSelector,
  setSelected,
  updateLayout,
  updateSubtitleWidth,
  updateDictionaryWidth,
  updateDictionaryLeftOffset,
  updateDictionaryUrl,
  updateSubtitleAuto,
  updateSubtitleDelay,
} from '../state'
import { useSaveHistory } from '../utils'

export const Nav = () => {
  const dispatch = useDispatch()
  const file = useSelector(s => s.files.selected) as string
  const subtitleAuto = useSelector(s => s.settings.subtitleAuto)
  const [showSettings, setShowSettings] = useState(false)
  const [showInfo, setShowInfo] = useState(false)
  const saveHistory = useSaveHistory()

  useEffect(() => {
    function keyListener(e: KeyboardEvent) {
      if (e.code === 'Escape') {
        setShowSettings(s => !s)
        return
      }
      if (!window.enableShortcuts) return
      if (e.code === 'KeyD') {
        dispatch(updateLayout())
      }
      if (e.code === 'KeyA') {
        dispatch(updateSubtitleAuto({ file }))
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

const Info: FC<{ show: boolean; onClose: () => void }> = props => {
  return (
    <Modal {...props} title="Shortcuts">
      <div className={styles['3cols']}>
        <div className="column">
          <div className="column-title">Settings</div>
          <div className={styles['info']}>
            <div className={styles['title']}>Esc</div>
            <div className={styles['body']}>Toggle settings</div>
            <div className={styles['title']}>D</div>
            <div className={styles['body']}>Toggle dictionary</div>
          </div>
        </div>
        <div className="column">
          <div className="column-title">Video</div>
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
          </div>
        </div>
        <div className="column">
          <div className="column-title">Subtitle</div>
          <div className={styles['info']}>
            <div className={styles['title']}>
              <span className="material-icons">arrow_upward</span>
            </div>
            <div className={styles['body']}>Pageup</div>
            <div className={styles['title']}>
              <span className="material-icons">arrow_downward</span>
            </div>
            <div className={styles['body']}>Pagedown</div>
            <div className={styles['title']}>A</div>
            <div className={styles['body']}>Toggle auto</div>
            <div className={styles['title']}>Ctrl + click</div>
            <div className={styles['body']}>Adjust delay</div>
          </div>
        </div>
      </div>
    </Modal>
  )
}

const Settings: FC<{ show: boolean; onClose: () => void }> = props => {
  const settings = useSelector(s => s.settings)
  const file = useSelector(s => s.files.selected) as string
  const { layout, subtitleAuto } = settings
  const [dw, setDW] = useState(`${settings.dictionaryWidth}`)
  const [sw, setSW] = useState(`${settings.subtitleWidth}`)
  const [url, setURL] = useState(settings.dictionaryUrl)
  const [offset, setOffset] = useState(`${settings.dictionaryLeftOffset}`)
  const [delay, setDelay] = useState('0')

  const dispatch = useDispatch()

  useEffect(() => {
    if (props.show) {
      window.enableShortcuts = false
      setDW(settings.dictionaryWidth + '')
      setSW(settings.subtitleWidth + '')
      setDelay((settings.subtitleDelay / 1000).toFixed(3) + '')
    } else {
      window.enableShortcuts = true
    }
  }, [props.show, settings.layout])

  return (
    <Modal {...props} title="Settings">
      <div className={styles['settings']}>
        <div className={styles['title']}>Enable dictionary</div>
        <div className={styles['body']}>
          <input
            type="checkbox"
            checked={layout === '3col'}
            onChange={e => {
              dispatch(updateLayout(e.target.checked ? '3col' : '2col'))
            }}
          />
        </div>
        {layout === '3col' && (
          <>
            <div className={styles['title']}>Dictionary width</div>
            <div className={styles['body']}>
              <input
                value={dw}
                onChange={e => {
                  setDW(e.target.value)
                }}
                onBlur={() => {
                  const width = parseInt(dw, 10)
                  if (!isNaN(width)) {
                    dispatch(updateDictionaryWidth(width))
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
                  dispatch(updateDictionaryUrl(url))
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
                  const width = parseInt(offset, 10)
                  dispatch(updateDictionaryLeftOffset(width))
                }}
              />
            </div>
          </>
        )}
        <div className={styles['title']}>Subtitle width</div>
        <div className={styles['body']}>
          <input
            value={sw}
            onChange={e => {
              setSW(e.target.value)
            }}
            onBlur={() => {
              const width = parseInt(sw, 10)
              if (!isNaN(width)) {
                dispatch(updateSubtitleWidth(width))
              }
            }}
          />
        </div>
        <div className={styles['title']}>Auto subtitle</div>
        <div className={styles['body']}>
          <input
            type="checkbox"
            checked={subtitleAuto}
            onChange={() => {
              dispatch(updateSubtitleAuto({ file }))
            }}
          />
        </div>
        {subtitleAuto && (
          <>
            <div className={styles['title']}>Subtitle delay</div>
            <div className={styles['body']}>
              <input
                value={delay}
                onChange={e => {
                  // seconds
                  setDelay(e.target.value)
                }}
                onBlur={() => {
                  const seconds = parseFloat(delay)
                  if (!isNaN(seconds)) {
                    dispatch(updateSubtitleDelay({ file, delay: Math.round(seconds * 1000) }))
                  }
                }}
              />
            </div>
          </>
        )}
      </div>
    </Modal>
  )
}

const Icon: FC<{ type: string; onClick: () => void; disabled?: boolean }> = ({ type, onClick, disabled }) => {
  return (
    <span className={cn(styles['icon'], 'material-icons', { [styles['disabled']]: disabled })} onClick={onClick}>
      {type}
    </span>
  )
}
