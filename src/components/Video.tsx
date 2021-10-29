import { useState, useEffect, useRef } from 'react'
import styles from './Video.module.less'
import { setVideo, useDispatch } from '../state'
import cn from 'classnames'

const videoInput = () => document.querySelector('#video-input') as HTMLInputElement

export let Video = () => {
  let [videoUrl, setVideoUrl] = useState('')

  let videoRef = useRef<HTMLVideoElement>(null)

  let dispatch = useDispatch()

  useEffect(() => {
    if (!videoUrl) return
    dispatch(setVideo(videoRef.current))
    return () => {
      URL.revokeObjectURL(videoUrl)
      dispatch(setVideo(null))
    }
  }, [videoUrl])

  if (videoUrl) {
    return (
      <div className={styles['video-container']}>
        <video ref={videoRef} src={videoUrl} controls />
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
