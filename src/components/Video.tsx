import { FC, useState, useEffect, useRef } from 'react'
import styles from './Video.module.less'
import { setVideo, getVideo, useDispatch, useSelector, setSelected, LoadWaveFormPreference, deleteFile } from '../state'
import { useRestoreVideo, doVideo, VIDEO_ID, useI18n } from '../utils'
import { WaveForm } from './WaveForm'
import { confirm } from './Modal'
import cn from 'classnames'

export const Video: FC = () => {
  const [videoUrl, setVideoUrl] = useState('')
  const urlRef = useRef<string>('')
  const restoreVideo = useRestoreVideo()
  const i18n = useI18n()
  const dispatch = useDispatch()
  const hasVideo = useSelector(s => s.video.hasVideo)
  const enableWaveForm = useSelector(s => s.settings.waveform)
  const file = useSelector(s => s.files.selected)
  const status = useSelector(s => s.video.status)

  useEffect(() => {
    dispatch(LoadWaveFormPreference(file as string))
    getVideo(file as string)
      .then(
        f => {
          if (f === undefined) {
            dispatch(setSelected(null))
            return
          }
          const url = URL.createObjectURL(f)
          setVideoUrl(url)
          urlRef.current = url
          dispatch(setVideo(true))
          restoreVideo()
        },
        e => {
          if (e instanceof DOMException && e.name === 'NotFoundError') {
            setTimeout(() => {
              confirm(i18n('confirm.cannot_find_file', file as string)).then(remove => {
                if (remove) {
                  dispatch(deleteFile(file as string))
                }
              })
            })
          }
          dispatch(setSelected(null))
        },
      )
      .catch(() => {})
    return () => {
      const url = urlRef.current
      if (url) {
        URL.revokeObjectURL(url)
      }
      dispatch(setVideo(false))
    }
  }, [])

  const forward = (t: number) => () => {
    doVideo(video => {
      video.blur()
      video.currentTime += t
    })
  }

  function togglePlay() {
    if (!hasVideo) return
    doVideo(video => {
      video.blur()
      if (status === 'playing') {
        video.pause()
      } else {
        video.play()
      }
    })
  }

  useEffect(() => {
    function keyListener(e: KeyboardEvent) {
      if (!window.enableShortcuts) return
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
    }
    window.addEventListener('keydown', keyListener)
    return () => {
      window.removeEventListener('keydown', keyListener)
    }
  }, [togglePlay])

  if (videoUrl) {
    return (
      <div className={cn(styles['video-container'], { [styles['has-waveform']]: enableWaveForm })}>
        {enableWaveForm && <WaveForm />}
        <div>
          <video id={VIDEO_ID} src={videoUrl} controls />
        </div>
      </div>
    )
  }
  return <div />
}
