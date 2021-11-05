import { useState, useRef } from 'react'
import styles from './Uploader.module.less'
import { saveVideoSubPair, useDispatch, getList } from '../state'
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
    if (vs.length === 0 || vs.length != ss.length) return
    await Promise.all(vs.map((v, idx) => processPair([v, ss[idx]])))
    videoHandles.current = []
    subtitleHandles.current = []
    setSubtitles([])
    setVideos([])
    dispatch(getList())
  }

  return (
    <div className={styles['container']}>
      <div>
        <div
          className={styles['video-input']}
          onClick={() => {
            showOpenFilePicker({
              multiple: true,
              types: [
                {
                  description: 'Videos',
                  accept: {
                    'video/*': ['.mp4', '.mov', '.avi', '.mkv'],
                  },
                },
              ],
            }).then(handles => {
              videoHandles.current = handles
              setVideos(handles.map(h => h.name))
              process()
            })
          }}
        >
          <span className="material-icons">movie</span>
          Import Videos
        </div>
      </div>
      <div>
        <div
          className={styles['subtitle-input']}
          onClick={() => {
            showOpenFilePicker({
              multiple: true,
              types: [
                {
                  description: 'Subtitles',
                  accept: {
                    '*/*': ['.srt'],
                  },
                },
              ],
            }).then(handles => {
              subtitleHandles.current = handles
              setSubtitles(handles.map(h => h.name))
              process()
            })
          }}
        >
          <span className="material-icons">description</span>
          Import Subtitles
        </div>
      </div>
      <div>
        <div className={cn(styles['files'], { [styles['hide']]: videos.length === 0 })}>
          {videos.map(name => (
            <div key={name} className={styles['file']}>
              {name}
            </div>
          ))}
        </div>
      </div>
      <div>
        <div className={cn(styles['files'], { [styles['hide']]: subtitles.length === 0 })}>
          {subtitles.map(name => (
            <div key={name} className={styles['file']}>
              {name}
            </div>
          ))}
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
