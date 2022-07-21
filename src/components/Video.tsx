import { FC, useState, useEffect } from 'react'
import styles from './Video.module.less'
import { setVideo, useDispatch, useSelector, setSelected, LoadWaveFormPreference, deleteFile } from '../state'
import { useRestoreVideo, doVideo, VIDEO_ID, useI18n, EnableWaveForm, getVideo } from '../utils'
import { WaveForm } from './WaveForm'
import { confirm, message } from './Modal'
import cn from 'classnames'

export const Video: FC = () => {
  const [videoUrl, setVideoUrl] = useState('')
  const restoreVideo = useRestoreVideo()
  const i18n = useI18n()
  const dispatch = useDispatch()
  const enableStatus = useSelector(s => s.settings.waveform)
  const file = useSelector(s => s.files.selected) as string

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
      dispatch(setVideo(false))
    }
  }, [])

  const forward = (t: number) => () => {
    doVideo(video => {
      video.blur()
      video.currentTime += t
    })
  }

  useEffect(() => {
    function keyListener(e: KeyboardEvent) {
      if (!window.__SRT_ENABLE_SHORTCUTS__) return
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
      if (e.code === 'KeyF') {
        document.body.requestFullscreen()
      }
    }
    window.addEventListener('keydown', keyListener)
    return () => {
      window.removeEventListener('keydown', keyListener)
    }
  }, [])

  if (videoUrl) {
    return (
      <div className={cn(styles['video-container'], { [styles['has-waveform']]: enableStatus })}>
        {enableStatus !== EnableWaveForm.disable && <WaveForm key={enableStatus} />}
        <div className={styles['inner']}>
          <video
            id={VIDEO_ID}
            src={videoUrl}
            controls
            disablePictureInPicture
            controlsList="nodownload noplaybackrate"
            onLoadedData={async () => {
              await restoreVideo()
              dispatch(setVideo(true))
            }}
            onError={onVideoError(i18n)}
          />
        </div>
      </div>
    )
  }
  return <div />
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
