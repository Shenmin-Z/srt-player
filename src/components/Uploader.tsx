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
    if (vs.length === 0 || ss.length === 0) return
    if (vs.length === 1 && ss.length === 1) {
      await processPair([vs[0], ss[0]])
    } else {
      await Promise.all(group(vs, ss).map(p => processPair(p)))
    }
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
                    'video/*': ['.mp4', '.mov', '.avi'],
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

function group(vs: FileSystemHandle[], ss: FileSystemHandle[]): FilePair[] {
  const res: FilePair[] = []
  for (let i = 0; i < vs.length; i++) {
    const ve = getEpisode(vs[i].name)
    const s = ss.find(s => getEpisode(s.name) === ve)
    if (s) {
      res.push([vs[i], s])
    }
  }
  return res
}

function getEpisode(s: string) {
  const match = s.split('.')[0].match(/^(.*?)(\d+)$/)
  if (match) {
    return parseInt(match[2], 10)
  }
  return -1
}

async function processPair(pair: FilePair) {
  const [video, subtitle] = pair
  const subtitleFile: File = await (subtitle as any).getFile()
  const subtitleText = await subtitleFile.text()
  await saveVideoSubPair({ video: video, subtitle: subtitleText })
}
