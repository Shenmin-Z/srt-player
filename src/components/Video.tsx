import { FC, useState, useEffect, useRef, Fragment } from 'react'
import styles from './Video.module.less'
import {
  setVideo,
  useDispatch,
  useSelector,
  setSelected,
  LoadWaveFormPreference,
  LoadBookmarks,
  deleteFile,
  updateVideoTime,
  setVideoStatus,
  addBookmark,
  updateBookmarks,
  removeBookmark,
} from '../state'
import {
  useRestoreVideo,
  doVideo,
  isAudioOnly,
  VIDEO_ID,
  useI18n,
  EnableWaveForm,
  getVideo,
  IS_MOBILE,
  IS_IOS,
  toggleFullScreen,
  FULLSCREEN_ENABLED,
  useTouchEmitter,
  isSubtitleOnly,
  formatTime,
} from '../utils'
import { WaveForm } from './WaveForm'
import { confirm, message, Modal } from './Modal'
import cn from 'classnames'

export const Video: FC = () => {
  const [videoUrl, setVideoUrl] = useState('')
  const [audioOnly, setAudioOnly] = useState(false)
  const restoreVideo = useRestoreVideo()
  const i18n = useI18n()
  const dispatch = useDispatch()
  const enableStatus = useSelector(s => s.settings.waveform)
  const hasVideo = useSelector(s => s.video.hasVideo)
  const file = useSelector(s => s.files.selected) as string
  const { controlsShow, showForAWhile, showControls, hideControls } = useShowControls()
  const { divRef: replayDivRef, emitter: replayEmitter } = useTouchEmitter([hasVideo])
  const { divRef: scrollDivRef, emitter: scrollEmitter } = useTouchEmitter([hasVideo])

  useEffect(() => {
    dispatch(LoadWaveFormPreference(file))
    dispatch(LoadBookmarks(file))
    ;(async () => {
      try {
        const v = await getVideo(file)
        if (v === undefined) {
          dispatch(setSelected(null))
          return
        }
        setVideoUrl(v.url)
      } catch (e) {
        if (e instanceof DOMException && e.name === 'NotFoundError') {
          setTimeout(async () => {
            const remove = await confirm(i18n('confirm.cannot_find_file', file))
            if (remove) {
              dispatch(deleteFile(file))
            }
          })
        }
        dispatch(setSelected(null))
      }
    })()
    return () => {
      dispatch(setVideo({ hasVideo: false }))
    }
  }, [])

  useEffect(() => {
    function keyListener(e: KeyboardEvent) {
      if (!window.__SRT_ENABLE_SHORTCUTS__) return
      if (e.code === 'Space') {
        e.preventDefault()
        e.stopPropagation() // space may interrupt subtitle's smooth scroll
        togglePlay()
        return
      }
      if (e.code === 'ArrowLeft') {
        e.preventDefault()
        if (e.shiftKey) {
          forward(-3)()
        } else {
          forward(-10)()
        }
        return
      }
      if (e.code === 'ArrowRight') {
        e.preventDefault()
        if (e.shiftKey) {
          forward(3)()
        } else {
          forward(10)()
        }
        return
      }
      if (e.code === 'KeyF' && !e.repeat && !e.ctrlKey && e.metaKey !== true) {
        toggleFullScreen()
        return
      }
      if (e.code === 'KeyM' && !e.repeat && !e.ctrlKey && e.metaKey !== true) {
        if (e.shiftKey) {
        } else {
          doVideo(v => {
            dispatch(addBookmark({ file, currentTime: v.currentTime }))
          })
        }
      }
    }
    window.addEventListener('keydown', keyListener, true)
    return () => {
      window.removeEventListener('keydown', keyListener, true)
    }
  }, [])

  useEffect(() => {
    // automatically create wavefrom when: 1. only audio, 2. first time played (current time is 0)
    if (audioOnly && !isSubtitleOnly(file)) {
      doVideo(v => {
        if (v.currentTime === 0) {
          // mock user action of:
          // 1.click waveform setting icon
          document.body.classList.add('hide-modal')
          const icon = document.getElementById('open-waveform-setting')
          if (!icon) return
          icon.click()

          setTimeout(() => {
            // 2. click generate waveform
            const button = document.querySelector('div[data-button-type="create-waveform"]')
            if (button) {
              ;(button as HTMLDivElement).click()
            }
            // 3. close waveform setting
            const mask = document.querySelector('.modal-mask')
            if (mask) (mask as HTMLDivElement).click()
            setTimeout(() => {
              document.body.classList.remove('hide-modal')
            })
          })
        }
      })
    }
  }, [audioOnly])

  if (videoUrl) {
    return (
      <div
        className={cn(styles['video-container'], { [styles['has-waveform']]: enableStatus, 'audio-only': audioOnly })}
      >
        {enableStatus !== EnableWaveForm.disable && (
          <WaveForm key={enableStatus} replayEmitter={replayEmitter} scrollEmitter={scrollEmitter} />
        )}
        <div className={styles['inner']}>
          <video
            autoPlay={IS_IOS} // loaddata does not fire on iPhone unless played
            playsInline
            id={VIDEO_ID}
            src={videoUrl}
            onLoadedData={async e => {
              e.currentTarget.pause()
              await restoreVideo()
              dispatch(setVideo({ hasVideo: true, total: doVideo(v => v.duration) }))
              showControls()
              isAudioOnly(file, setAudioOnly)
            }}
            onPlay={() => {
              dispatch(setVideoStatus(true))
              if (IS_MOBILE) {
                hideControls()
              } else {
                showForAWhile()
              }
            }}
            onPause={() => {
              dispatch(setVideoStatus(false))
              showControls()
            }}
            onEnded={() => {
              dispatch(setVideoStatus(false))
              showControls()
            }}
            onTimeUpdate={() => {
              dispatch(updateVideoTime(doVideo(v => v.currentTime) as number))
            }}
            onError={onVideoError(i18n)}
            onMouseMove={showForAWhile}
            className={cn({ [styles['hide-cursor']]: !controlsShow })}
          />
          <VideoControls
            shown={controlsShow}
            show={showControls}
            hide={hideControls}
            hasWaveform={enableStatus !== EnableWaveForm.disable}
            replayDivRef={replayDivRef}
            scrollDivRef={scrollDivRef}
          />
        </div>
      </div>
    )
  }
  return <div />
}

function forward(t: number) {
  return () => {
    doVideo(video => {
      video.blur()
      video.currentTime += t
    })
  }
}

function togglePlay() {
  doVideo(video => {
    video.blur()
    if (video.paused || video.ended) {
      video.play()
    } else {
      video.pause()
    }
  })
}

function onVideoError(i18n: ReturnType<typeof useI18n>) {
  return () => {
    doVideo(video => {
      const error = video.error!
      if (error.code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED) {
        message(i18n('error.video_src_not_supported'))
      } else {
        message(error.message)
      }
    })
  }
}

interface VideoControlsProps {
  shown: boolean
  show(): void
  hide(): void
  hasWaveform: boolean
  replayDivRef: React.RefObject<HTMLDivElement>
  scrollDivRef: React.RefObject<HTMLDivElement>
}

const VideoControls: FC<VideoControlsProps> = ({ shown, show, hide, hasWaveform, replayDivRef, scrollDivRef }) => {
  const { hasVideo, playing, total, current } = useSelector(s => s.video)

  if (!hasVideo) return null

  return (
    <div className={cn(styles['video-controls'], { [styles['is-playing']]: playing })}>
      <div className={styles['video-controls-top']} onClick={togglePlay}>
        <div className={styles['touch-top']} ref={replayDivRef} />
        <div className={styles['three-icons']}>
          <div className={cn('material-icons-outlined', styles['float-control'])}>
            {playing ? 'pause_circle' : 'play_circle'}
          </div>
          {hasWaveform && (
            <div
              className={cn('material-icons', styles['float-control'])}
              onClick={e => {
                e.stopPropagation()
                window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyR' }))
              }}
            >
              replay
            </div>
          )}
          <div
            className={cn('material-icons-outlined', styles['float-control'])}
            onClick={e => {
              e.stopPropagation()
              window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyM' }))
            }}
          >
            bookmark_add
          </div>
        </div>
        <div className={styles['touch-bottom']} ref={scrollDivRef} />
      </div>
      <div
        className={cn(styles['video-controls-bottom'], {
          [styles['hidden']]: IS_MOBILE && hasWaveform ? false : !shown,
        })}
        onMouseOver={show}
        onMouseLeave={hide}
      >
        <div className={styles['controls']}>
          <Icon type={playing ? 'pause' : 'play_arrow'} onClick={togglePlay} className={styles['regular-control']} />
          <PlayTime total={total} current={current} />
          {hasWaveform && (
            <Icon
              type="replay"
              onClick={() => {
                window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyR' }))
              }}
              className={styles['regular-control']}
            />
          )}
          <BookmarkIcon />
          <FullscreenIcon />
          <PlaySpeedIcon />
        </div>
        <ProgressBar />
      </div>
    </div>
  )
}

const BookmarkIcon = () => {
  const { bookmarks } = useSelector(s => s.video)
  const [show, setShow] = useState(false)
  const [names, setNames] = useState(bookmarks.map(b => b.name))
  const dispatch = useDispatch()
  const file = useSelector(s => s.files.selected) as string
  const i18n = useI18n()

  useEffect(() => {
    setNames(bookmarks.map(b => b.name))
    if (bookmarks.length === 0) {
      setShow(false)
    }
  }, [bookmarks])

  const save = () => {
    dispatch(
      updateBookmarks({
        file,
        bookmarks: bookmarks.map((bookmark, idx) => ({
          name: names[idx],
          time: bookmark.time,
        })),
      }),
    )
  }
  const jump = (t: number) => () => {
    doVideo(v => {
      v.currentTime = t
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Slash' }))
      setShow(false)
    })
  }

  return (
    <>
      <Modal
        title={i18n('bookmark.edit')}
        show={show}
        onClose={() => {
          setShow(false)
        }}
        disableShortcuts
      >
        <div className={styles['bookmark-list']}>
          {bookmarks.map((bookmark, idx) => {
            return (
              <Fragment key={bookmark.time}>
                <span className="numeric" onClick={jump(bookmark.time)}>
                  {idx + 1}
                </span>
                <span className="numeric" onClick={jump(bookmark.time)}>
                  {formatTime(bookmark.time, 3, true)}
                </span>
                <input
                  type="text"
                  value={names[idx]}
                  onChange={e => {
                    const newNames = [...names]
                    newNames[idx] = e.target.value
                    setNames(newNames)
                  }}
                  onBlur={save}
                  placeholder={i18n('bookmark.add_description')}
                />
                <span
                  className="material-icons-outlined"
                  onClick={() => {
                    dispatch(
                      removeBookmark({
                        file,
                        currentTime: bookmark.time,
                      }),
                    )
                  }}
                >
                  bookmark_remove
                </span>
              </Fragment>
            )
          })}
        </div>
      </Modal>
      {bookmarks.length > 0 && (
        <Icon
          outlined
          type={'bookmarks'}
          onClick={() => {
            setShow(true)
          }}
          className={styles['bookmarks']}
        />
      )}
    </>
  )
}

const FullscreenIcon = () => {
  if (!FULLSCREEN_ENABLED) return null
  const onClick = () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyF' }))
  }
  return (
    <>
      <Icon type="fullscreen_exit" onClick={onClick} className={styles['fullscreen-exit']} />
      <Icon type="fullscreen" onClick={onClick} className={styles['fullscreen']} />
    </>
  )
}

const PlaySpeedIcon = () => {
  const [open, setOpen] = useState(false)
  const [speed, setSpeed] = useState(1)

  return (
    <div className={styles['play-speed-container']}>
      <Icon
        outlined
        type="slow_motion_video"
        onClick={() => {
          setOpen(o => !o)
        }}
      />
      {open && (
        <div className={styles['speed-options']}>
          {[0.5, 0.75, 1, 1.25, 1.5].map(s => (
            <div
              key={s}
              onClick={() => {
                setSpeed(s)
                setOpen(false)
                doVideo(v => {
                  v.playbackRate = s
                })
              }}
              className={cn({ [styles['active']]: speed === s })}
            >
              <span className="material-icons-outlined">done</span>
              {s}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

interface IconProps {
  type: string
  onClick: () => void
  className?: string
  outlined?: boolean
}

const Icon: FC<IconProps> = ({ type, onClick, className, outlined = false }) => {
  return (
    <div className={cn(styles['icon'], `material-icons${outlined ? '-outlined' : ''}`, className)} onClick={onClick}>
      {type}
    </div>
  )
}

interface PlayTimeProps {
  total: number
  current: number
}

const PlayTime: FC<PlayTimeProps> = ({ total, current }) => {
  return (
    <div className={styles['play-time']}>
      {formatTime(current)} / {formatTime(total)}
    </div>
  )
}

const ProgressBar: FC = () => {
  const { bookmarks, total, current } = useSelector(s => s.video)
  const holdDown = useRef(false)
  const timerRef = useRef(0)
  const previousProgress = useRef(-1)
  const [nobPosition, setNobPosition] = useState(-1)
  const percentage =
    nobPosition === -1 ? `${((current / total) * 100).toFixed(2)}%` : `${(nobPosition * 100).toFixed(2)}%`

  const getProgressByMouse = (e: React.MouseEvent) => {
    const { left, right } = e.currentTarget.getBoundingClientRect()
    return (e.clientX - left) / (right - left)
  }
  const getProgressByTouch = (e: React.TouchEvent) => {
    const { left, right } = e.currentTarget.getBoundingClientRect()
    const progress = (e.touches[0].clientX - left) / (right - left)
    if (progress < 0) return 0
    if (progress > 1) return 1
    return progress
  }
  const update = (progress: number) => {
    setNobPosition(progress)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      doVideo(video => {
        video.currentTime = progress * video.duration
        previousProgress.current = progress
      })
    }, 160)
  }

  useEffect(() => {
    if (previousProgress.current === nobPosition) {
      setNobPosition(-1)
    }
  }, [current / total])

  return (
    <div
      className={styles['progress']}
      onClick={e => {
        const progress = getProgressByMouse(e)
        setNobPosition(progress)
        previousProgress.current = progress
        doVideo(video => {
          video.currentTime = progress * video.duration
        })
      }}
      onMouseDown={e => {
        e.preventDefault()
        holdDown.current = true
      }}
      onMouseUp={() => {
        holdDown.current = false
      }}
      onMouseLeave={() => {
        holdDown.current = false
      }}
      onMouseMove={e => {
        if (!holdDown.current) return
        const progress = getProgressByMouse(e)
        update(progress)
      }}
      onTouchMove={e => {
        const progress = getProgressByTouch(e)
        update(progress)
      }}
    >
      <div>
        <div className={styles['bar']} />
        {bookmarks.map(bookmark => {
          return (
            <div
              key={bookmark.time}
              className={styles['bookmark']}
              style={{ left: `${((bookmark.time / total) * 100).toFixed(2)}%` }}
              onClick={e => {
                doVideo(v => {
                  v.currentTime = bookmark.time
                  window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Slash' }))
                })
                e.stopPropagation()
              }}
            />
          )
        })}
        <div className={cn(styles['bar'], styles['current-bar'])} style={{ width: percentage }}>
          <div className={styles['nob']} />
        </div>
      </div>
    </div>
  )
}

const useShowControls = () => {
  const [controlsShow, setControlsShow] = useState(false)
  const timerRef = useRef(0)

  const showForAWhile = () => {
    setControlsShow(true)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      doVideo(video => {
        if (!video.paused && !video.ended) {
          setControlsShow(false)
        }
      })
    }, 1200)
  }

  const showControls = () => {
    clearTimeout(timerRef.current)
    setControlsShow(true)
  }
  const hideControls = () => {
    clearTimeout(timerRef.current)
    setControlsShow(false)
  }

  return {
    controlsShow,
    showForAWhile,
    showControls,
    hideControls,
  }
}
