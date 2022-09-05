import { FC, useState, useEffect, useRef } from 'react'
import styles from './Video.module.less'
import {
  setVideo,
  useDispatch,
  useSelector,
  setSelected,
  LoadWaveFormPreference,
  deleteFile,
  updateVideoTime,
  setVideoStatus,
} from '../state'
import { useRestoreVideo, doVideo, isAudioOnly, VIDEO_ID, useI18n, EnableWaveForm, getVideo, IS_MOBILE } from '../utils'
import { WaveForm } from './WaveForm'
import { confirm, message } from './Modal'
import cn from 'classnames'

export const Video: FC = () => {
  const [videoUrl, setVideoUrl] = useState('')
  const [audioOnly, setAudioOnly] = useState(false)
  const restoreVideo = useRestoreVideo()
  const i18n = useI18n()
  const dispatch = useDispatch()
  const enableStatus = useSelector(s => s.settings.waveform)
  const file = useSelector(s => s.files.selected) as string
  const { controlsShow, showForAWhile, showControls, hideControls } = useShowControls()

  useEffect(() => {
    dispatch(LoadWaveFormPreference(file))
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
      if (e.code === 'KeyF') {
        if (document.fullscreenElement) {
          document.exitFullscreen()
        } else {
          document.body.requestFullscreen()
        }
      }
    }
    window.addEventListener('keydown', keyListener, true)
    return () => {
      window.removeEventListener('keydown', keyListener, true)
    }
  }, [])

  if (videoUrl) {
    return (
      <div
        className={cn(styles['video-container'], { [styles['has-waveform']]: enableStatus, 'audio-only': audioOnly })}
      >
        {enableStatus !== EnableWaveForm.disable && <WaveForm key={enableStatus} />}
        <div className={styles['inner']}>
          <video
            id={VIDEO_ID}
            src={videoUrl}
            onClick={togglePlay}
            onLoadedData={async () => {
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
}

const VideoControls: FC<VideoControlsProps> = ({ shown, show, hide, hasWaveform }) => {
  const { hasVideo, playing, total, current } = useSelector(s => s.video)
  const [fullscreen, setFullscreen] = useState(false)

  useEffect(() => {
    const listener = () => {
      setFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', listener)
    return () => {
      document.removeEventListener('fullscreenchange', listener)
    }
  }, [])

  if (!hasVideo) return null

  return (
    <>
      <div
        className={cn(styles['play-button'], 'material-icons-outlined')}
        style={{ display: playing ? 'none' : undefined }}
      >
        play_circle
      </div>
      <div
        className={cn(styles['video-controls'], { [styles['hidden']]: IS_MOBILE && hasWaveform ? false : !shown })}
        onMouseOver={show}
        onMouseLeave={hide}
      >
        <div className={styles['controls']}>
          <Icon type={playing ? 'pause' : 'play_arrow'} onClick={togglePlay} className={styles['play-icon']} />
          <PlayTime total={total} current={current} />
          {hasWaveform && (
            <Icon
              type="replay"
              onClick={() => {
                window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyR' }))
              }}
            />
          )}
          <Icon
            type={fullscreen ? 'fullscreen_exit' : 'fullscreen'}
            onClick={() => {
              window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyF' }))
            }}
          />
        </div>
        <ProgressBar value={current / total} />
      </div>
    </>
  )
}

interface IconProps {
  type: string
  onClick: () => void
  className?: string
}

const Icon: FC<IconProps> = ({ type, onClick, className }) => {
  return (
    <div className={cn(styles['icon'], 'material-icons', className)} onClick={onClick}>
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

function formatTime(t: number) {
  const h = Math.floor(t / 3600)
  const m = Math.floor((t % 3600) / 60)
  const s = Math.floor(t % 60)
  if (h > 0) {
    return `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`
  } else {
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`
  }
}

interface ProgressBarProps {
  value: number
}

const ProgressBar: FC<ProgressBarProps> = ({ value }) => {
  const holdDown = useRef(false)
  const timerRef = useRef(0)
  const previousProgress = useRef(-1)
  const [nobPosition, setNobPosition] = useState(-1)
  const percentage = nobPosition === -1 ? `${(value * 100).toFixed(2)}%` : `${(nobPosition * 100).toFixed(2)}%`

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
  }, [value])

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
