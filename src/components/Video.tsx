import { FC, useState, useEffect, useRef } from 'react'
import styles from './Video.module.less'
import { setVideo, useDispatch } from '../state'
import cn from 'classnames'
import { useRestoreVideo } from '../utils'

const videoInput = () => document.querySelector('#video-input') as HTMLInputElement

export let Video: FC = () => {
  let [videoUrl, setVideoUrl] = useState('')

  let videoRef = useRef<HTMLVideoElement>(null)

  let dispatch = useDispatch()

  let restoreVideo = useRestoreVideo()

  useEffect(() => {
    if (!videoUrl) return
    dispatch(setVideo(true))
    restoreVideo()
    return () => {
      URL.revokeObjectURL(videoUrl)
      dispatch(setVideo(false))
    }
  }, [videoUrl])

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
