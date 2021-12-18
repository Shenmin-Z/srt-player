import { useState, useRef } from 'react'
import styles from './Uploader.module.less'
import { saveVideoSubPair, useDispatch, getList, getFileList } from '../state'
import { confirm, message } from './Modal'
import cn from 'classnames'

export const Uploader = () => {
  const dispatch = useDispatch()

  const subtitleHandles = useRef<FileSystemHandle[]>([])
  const [subtitles, setSubtitles] = useState<string[]>([])
  const videoHandles = useRef<FileSystemHandle[]>([])
  const [videos, setVideos] = useState<string[]>([])

  const process = async () => {
    const vs = videoHandles.current
    const ss = subtitleHandles.current
    const reset = () => {
      videoHandles.current = []
      subtitleHandles.current = []
      setSubtitles([])
      setVideos([])
    }
    if (vs.length === 0 || vs.length != ss.length) {
      if (vs.length > 0 && ss.length > 0) {
        await message(`Number of video files(${vs.length}) does not match subtitles(${ss.length}).`)
        reset()
      }
      return
    }
    const exist = await checkExist(vs)
    if (exist.length > 0) {
      const overwrite = await confirm(`${exist.join(', ')} already exist(s), overwrite?`)
      if (!overwrite) {
        reset()
        return
      }
    }
    await Promise.all(vs.map((v, idx) => processPair([v, ss[idx]])))
    reset()
    dispatch(getList())
  }

  return (
    <div className={styles['container']}>
      <div className={styles['button-container']}>
        <div
          className={styles['video-input']}
          onClick={() => {
            showOpenFilePicker({
              id: 'video-input',
              multiple: true,
              types: [
                {
                  description: 'Videos',
                  accept: {
                    'video/*': ['.mp4', '.mov', '.avi', '.mkv', '.flv'],
                  },
                },
              ],
            } as OpenFilePickerOptions).then(
              handles => {
                videoHandles.current = handles
                setVideos(handles.map(h => h.name))
                process()
              },
              () => {},
            )
          }}
        >
          <span className="material-icons">live_tv</span>
          Videos
        </div>
      </div>
      <div className={styles['button-container']}>
        <div
          className={styles['subtitle-input']}
          onClick={() => {
            showOpenFilePicker({
              id: 'subtitle-input',
              multiple: true,
              types: [
                {
                  description: 'Subtitles',
                  accept: {
                    '*/*': ['.srt'],
                  },
                },
              ],
            } as OpenFilePickerOptions).then(
              handles => {
                subtitleHandles.current = handles
                setSubtitles(handles.map(h => h.name))
                process()
              },
              () => {},
            )
          }}
        >
          <span className="material-icons">closed_caption_off</span>
          Subtitles
        </div>
      </div>
      <div>
        <div className={cn(styles['files'], { [styles['hide']]: videos.length === 0 })}>
          {videos.map(name => (
            <div key={name} className={styles['file']}>
              {name}
            </div>
          ))}
          <span
            className="material-icons"
            onClick={() => {
              videoHandles.current = []
              setVideos([])
            }}
          >
            cancel
          </span>
        </div>
      </div>
      <div>
        <div className={cn(styles['files'], { [styles['hide']]: subtitles.length === 0 })}>
          {subtitles.map(name => (
            <div key={name} className={styles['file']}>
              {name}
            </div>
          ))}
          <span
            className="material-icons"
            onClick={() => {
              subtitleHandles.current = []
              setSubtitles([])
            }}
          >
            cancel
          </span>
        </div>
      </div>
    </div>
  )
}

type FilePair = [FileSystemHandle, FileSystemHandle]

async function processPair(pair: FilePair) {
  const [video, subtitle] = pair
  const subtitleFile: File = await (subtitle as any).getFile()
  const subtitleText = await subtitleFile.text()
  await saveVideoSubPair({ video: video, subtitle: subtitleText })
}

async function checkExist(vs: FileSystemHandle[]): Promise<string[]> {
  const fs = vs.map(i => i.name)
  const fileNames = new Set(await getFileList())
  return fs.filter(i => fileNames.has(i))
}
