import { FC, useState, useEffect, useRef } from 'react'
import cn from 'classnames'
import { useSelector, useDispatch, deleteFile, setSelected, getList } from '../state'
import {
  getWatchHistory,
  WatchHistories,
  WatchHistory,
  useI18n,
  saveVideoSubPair,
  trackOpenFile,
  displayFileName,
} from '../utils'
import styles from './List.module.less'

export const List = () => {
  const list = useSelector(state => state.files.list)
  const dispatch = useDispatch()

  const [hs, setHS] = useState<WatchHistories>({})
  useEffect(() => {
    getWatchHistory().then(hs => {
      setHS(hs)
    })
  }, [list])

  let listItems =
    list !== null && list?.length > 0
      ? list.map(i => {
          return (
            <div key={i} className={styles['item']} style={{ '--watch-progress': percentage(hs?.[i]) + '%' } as any}>
              <span
                className={styles['file-name']}
                onClick={() => {
                  dispatch(setSelected(i))
                  trackOpenFile(displayFileName(i))
                }}
              >
                {displayFileName(i)}
              </span>
              <Label history={hs} file={i} />
              <span
                className={cn('material-icons', styles['icon'])}
                onClick={() => {
                  dispatch(deleteFile(i))
                }}
              >
                delete_outline
              </span>
            </div>
          )
        })
      : null

  return <div className={styles['list']}>{listItems}</div>
}

const Label: FC<{ history: WatchHistories; file: string }> = ({ history, file }) => {
  if (!history[file]) return <span />
  const time = history[file].currentTime
  if (time === 0) return <span />
  const str =
    time < 3600
      ? new Date(time * 1000).toISOString().substring(14, 14 + 5)
      : new Date(time * 1000).toISOString().substring(11, 11 + 8)
  return <span className={styles['label']}>{str}</span>
}

function percentage(h: WatchHistory | undefined) {
  if (!h) return 0
  const { currentTime, duration } = h
  const r = currentTime / duration
  if (isNaN(r)) return 0
  return Math.round(r * 100)
}

interface Example {
  name: string
  videoUrl: string
  subtitleUrl: string
}

const EXAMPLES: Example[] = [
  {
    name: 'Bad Apple!!(clip).mp4',
    videoUrl: 'https://shenmin-z.github.io/srt-example/example.mp4',
    subtitleUrl: 'https://shenmin-z.github.io/srt-example/example.srt',
  },
  {
    name: 'Substitute Teacher - Key & Peele.mp4',
    videoUrl: 'https://shenmin-z.github.io/srt-example/example-2.mp4',
    subtitleUrl: 'https://shenmin-z.github.io/srt-example/example-2.srt',
  },
  {
    name: 'アニメそんなもの読んじゃいけません.mp4',
    videoUrl: 'https://shenmin-z.github.io/srt-example/example-3.mp4',
    subtitleUrl: 'https://shenmin-z.github.io/srt-example/example-3.srt',
  },
]

interface onProgress {
  (p: number): void
}

async function downloadExample(e: Example, onProgress: onProgress) {
  const videoBlob = await download(e.videoUrl, onProgress)
  const subtitleBlob = await download(e.subtitleUrl, onProgress)
  await saveVideoSubPair([new File([videoBlob], e.name), new File([subtitleBlob], 'example.srt')], true)
}

async function download(url: string, onProgress: onProgress) {
  const response = await fetch(url)
  const contentLength = response.headers.get('content-length')
  const total = parseInt(contentLength || '', 10)
  let loaded = 0

  const res = new Response(
    new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader()
        if (!reader) return
        for (;;) {
          const { done, value } = await reader.read()
          if (done) break
          loaded += value?.byteLength || 0
          onProgress(loaded / total)
          controller.enqueue(value)
        }
        controller.close()
      },
    }),
  )
  return await res.blob()
}

enum DownloadStatus {
  start,
  downloading,
  finished,
}

export const DownloadExample: FC<{ show: boolean }> = ({ show }) => {
  const list = useSelector(state => state.files.list)
  const i18n = useI18n()
  const dispatch = useDispatch()
  const [status, setStatus] = useState<{ [s: string]: { status: DownloadStatus; progress?: number } }>({})
  const countRef = useRef(0)

  if (list?.length !== 0 || !show) {
    return null
  }

  return (
    <div className={styles['download-example']}>
      <div className={styles['message-box']}>
        <span className="material-icons-outlined">error_outline</span>
        {i18n('play_list.download_example')}
        <ul className={styles['example-list']}>
          {EXAMPLES.map((i, idx) => {
            const progress = (Math.min(status[i.name]?.progress || 0, 1) * 100).toFixed(2)
            const setIsDownloading = (d: boolean) => {
              setStatus(s => ({ ...s, [i.name]: { status: d ? DownloadStatus.downloading : DownloadStatus.finished } }))
            }
            const setProgress = (p: number) => {
              setStatus(s => ({ ...s, [i.name]: { status: DownloadStatus.downloading, progress: p } }))
            }
            return (
              <li
                key={i.name}
                className={cn(styles['list-item'], {
                  [styles['downloading']]: status[i.name]?.status === DownloadStatus.downloading,
                  [styles['finished']]: status[i.name]?.status === DownloadStatus.finished,
                })}
              >
                <a
                  href="#"
                  onClick={async e => {
                    if (status[i.name]?.status === DownloadStatus.downloading) return
                    e.preventDefault()
                    setIsDownloading(true)
                    countRef.current++
                    await downloadExample(i, setProgress)
                    setIsDownloading(false)
                    countRef.current--
                    if (countRef.current === 0) {
                      dispatch(getList())
                    }
                  }}
                >
                  {i18n('play_list.example', idx + 1 + '')}
                </a>
                <span className={styles['progress']}>
                  {i18n('play_list.downloading')}
                  {progress + '%'}
                </span>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
