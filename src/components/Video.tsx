import { FC, useState, useEffect, useRef } from 'react'
import styles from './Video.module.less'
import { setVideo, getVideo, useDispatch, useSelector, deleteFile, setSelected } from '../state'
import { useRestoreVideo } from '../utils'

export const Video: FC = () => {
  const [videoUrl, setVideoUrl] = useState('')
  const urlRef = useRef<string>('')
  const restoreVideo = useRestoreVideo()

  const dispatch = useDispatch()
  const hasVideo = useSelector(s => s.video.hasVideo)
  const file = useSelector(s => s.files.selected)
  const status = useSelector(s => s.video.status)

  useEffect(() => {
    if (!file) return
    getVideo(file)
      .then(f => {
        const url = URL.createObjectURL(f)
        setVideoUrl(url)
        urlRef.current = url
        dispatch(setVideo(true))
        restoreVideo()
      })
      .catch(() => {
        dispatch(deleteFile(file))
        dispatch(setSelected(null))
      })
    return () => {
      const url = urlRef.current
      if (url) {
        URL.revokeObjectURL(url)
      }
      dispatch(setVideo(false))
    }
  }, [])

  const forward = (t: number) => () => {
    const videoElement = document.getElementById('srt-player-video') as HTMLVideoElement | null
    if (videoElement === null) return
    videoElement.blur()
    videoElement.currentTime += t
  }

  function togglePlay() {
    if (!hasVideo) return
    const videoElement = document.getElementById('srt-player-video') as HTMLVideoElement | null
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
      <div className={styles['video-container']}>
        <video id="srt-player-video" src={videoUrl} controls />
      </div>
    )
  }
  return <div />
}
