import { FC, useState, useEffect, useRef } from 'react'
import styles from './Video.module.less'
import { setVideo, useDispatch, useSelector } from '../state'
import cn from 'classnames'
import { useRestoreVideo } from '../utils'

const videoInput = () => document.querySelector('#video-input') as HTMLInputElement

export let Video: FC = () => {
  let [videoUrl, setVideoUrl] = useState('')
  let videoRef = useRef<HTMLVideoElement>(null)
  let restoreVideo = useRestoreVideo()

  let dispatch = useDispatch()
  let hasVideo = useSelector(s => s.video.hasVideo)
  let status = useSelector(s => s.video.status)

  useEffect(() => {
    if (!videoUrl) return
    dispatch(setVideo(true))
    restoreVideo()
    return () => {
      URL.revokeObjectURL(videoUrl)
      dispatch(setVideo(false))
    }
  }, [videoUrl])

  let forward = (t: number) => () => {
    let videoElement = document.getElementById('srt-player-video') as HTMLVideoElement | null
    if (videoElement === null) return
    videoElement.blur()
    videoElement.currentTime += t
  }

  function togglePlay() {
    if (!hasVideo) return
    let videoElement = document.getElementById('srt-player-video') as HTMLVideoElement | null
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
        <video id="srt-player-video" ref={videoRef} src={videoUrl} controls />
      </div>
    )
  }

  return (
    <div className={styles['upload']}>
      <div
        className={styles['click-area']}
        onClick={() => {
          videoInput().click()
        }}
      >
        <div>
          <div className={cn('material-icons', styles['icon'])}>movie</div>
          Select Video
          <input
            type="file"
            id="video-input"
            accept="video/mp4,video/x-m4v,video/*"
            onChange={() => {
              let files = videoInput().files
              if (files && files[0]) {
                setVideoUrl(URL.createObjectURL(files[0]))
              }
            }}
          />
        </div>
      </div>
    </div>
  )
}
