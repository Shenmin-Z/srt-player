import { FC, useState, useEffect, useRef, memo } from 'react'
import cn from 'classnames'
import { useSelector, useDispatch, updateSubtitleDelay, updateSubtitleFontSize, LoadSubtitlePreference } from '../state'
import { message } from './Modal'
import styles from './Subtitle.module.less'
import {
  useRestoreSubtitle,
  Node,
  isWithin,
  findNode,
  doVideo,
  getSubtitle,
  useSavableHighlight,
  useVideoEvents,
} from '../utils'

// subtitle_time + subtitle_delay = video_time

export const Subtitle: FC = () => {
  const nodes = useNodes()
  const file = useSelector(s => s.files.selected) as string
  const subtitleAuto = useSelector(s => s.settings.subtitleAuto)
  const subtitleDelay = useSelector(s => s.settings.subtitleDelay)
  const subtitleFontSize = useSelector(s => s.settings.subtitleFontSize)
  const subtitleListeningMode = useSelector(s => s.settings.subtitleListeningMode)
  const dispath = useDispatch()
  const [lang, setLang] = useState<string>('')
  const [ready, setReady] = useState(false)
  const [highlight, setHighlight] = useSavableHighlight()
  const { divRef, autoRef, timerRef, delayRef } = useShortcuts(nodes, subtitleAuto, subtitleDelay)

  useEffect(() => {
    autoRef.current = subtitleAuto
    delayRef.current = subtitleDelay
    tick()
  }, [subtitleAuto, subtitleDelay])

  function tick() {
    if (!autoRef.current) return
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    doVideo(video => {
      const playing = video.currentTime >= 0 && !video.paused && !video.ended
      const current = Math.round(video.currentTime * 1000) - delayRef.current
      const node = findNode(nodes || [], current)
      if (node === null) return
      let waitTime: number
      if (isWithin(current, node)) {
        scrollToNthChild(node.counter - 1, divRef.current, n => setHighlight(n))
        waitTime = node.end.timestamp - current
      } else {
        waitTime = node.start.timestamp - current
      }
      if (playing) {
        timerRef.current = setTimeout(tick, waitTime)
      }
    })
  }

  useVideoEvents({ play: tick, seeked: tick })

  const restoreSubtitle = useRestoreSubtitle()

  useEffect(() => {
    dispath(LoadSubtitlePreference(file))
  }, [])

  useEffect(() => {
    if (nodes !== null) {
      restoreSubtitle().then(active => {
        if (active !== null) {
          setHighlight(active)
        }
        setReady(true)
      })

      // detect language
      for (let i = 0; i < Math.min(20, nodes.length); i++) {
        const text = nodes[i].text.join('')
        const jpCharacters = (text.match(/[ぁ-ゔ]+|[ァ-ヴー]+/gu) || []).join('')
        if (jpCharacters.length >= 5) {
          setLang('jp')
          break
        }
      }
    }
  }, [nodes])

  if (nodes === null) {
    return <div className={styles['subtitle']} />
  } else {
    const fontSizes = {
      '--subtitle-text': `${Math.max(subtitleFontSize, 5)}px`,
      '--subtitle-counter': `${Math.max(subtitleFontSize - 2, 5)}px`,
      '--subtitle-time': `${Math.max(subtitleFontSize - 7, 5)}px`,
    } as any
    return (
      <div
        id="srt-player-subtitle"
        ref={divRef}
        className={cn(styles['subtitle'], {
          [styles['ready']]: ready,
          [styles['listening-mode']]: subtitleListeningMode,
        })}
        lang={lang}
        style={{ ...fontSizes }}
      >
        {nodes.map(n => (
          <SubtitleNode
            {...n}
            key={n.counter}
            highlight={highlight === n.counter}
            onClick={h => {
              if (!autoRef.current) {
                setHighlight(h)
              }
            }}
            setDelay={start => {
              if (autoRef.current) {
                doVideo(video => {
                  dispath(
                    updateSubtitleDelay({
                      file,
                      delay: Math.round(video.currentTime * 1000 - start),
                    }),
                  )
                })
              }
            }}
            jumpToTime={t => {
              if (autoRef.current) {
                doVideo(video => {
                  video.currentTime = (t + delayRef.current) / 1000
                })
              }
            }}
          />
        ))}
      </div>
    )
  }
}

interface SubtitleNodeProps extends Node {
  highlight: boolean
  onClick: (h: number) => void
  setDelay: (start: number) => void
  jumpToTime: (t: number) => void
}

const SubtitleNode: FC<SubtitleNodeProps> = memo(
  props => {
    const { counter, start, end, text, highlight, onClick, setDelay, jumpToTime } = props
    return (
      <div
        className={cn(styles['node'], { [styles['highlight']]: highlight })}
        onClick={() => {
          onClick(counter)
        }}
      >
        <span
          className={styles['counter']}
          onClick={() => {
            jumpToTime(start.timestamp)
          }}
        >
          {counter}
        </span>
        <div>
          <div className={styles['line']}>
            <span
              className={styles['start']}
              onClick={() => {
                setDelay(start.timestamp)
              }}
            >
              {start.raw}
            </span>
            <span className={styles['hyphen']}> - </span>
            <span
              className={styles['end']}
              onClick={() => {
                setDelay(end.timestamp)
              }}
            >
              {end.raw}
            </span>
          </div>
          <p className={styles['text']} dangerouslySetInnerHTML={{ __html: text.join('\n') }} />
        </div>
      </div>
    )
  },
  (prevProps, nextProps) => prevProps.highlight === nextProps.highlight,
)

const useShortcuts = (nodes: Node[] | null, subtitleAuto: boolean, subtitleDelay: number) => {
  const dispath = useDispatch()
  const divRef = useRef<HTMLDivElement>(null)
  const autoRef = useRef<boolean>(subtitleAuto)
  const timerRef = useRef<number | null>(null)
  const delayRef = useRef<number>(subtitleDelay)
  useEffect(() => {
    if (!nodes || nodes.length === 0) return
    function scroll(e: KeyboardEvent) {
      if (!divRef.current || !window.__SRT_ENABLE_SHORTCUTS__) return
      const step = divRef.current.offsetHeight / 2
      let top = divRef.current.scrollTop
      if (e.code === 'ArrowUp') {
        e.preventDefault()
        top -= step
      }
      if (e.code === 'ArrowDown') {
        e.preventDefault()
        top += step
      }
      divRef.current.scroll({ top, behavior: 'smooth' })
    }
    function fontSize(e: KeyboardEvent) {
      if (!divRef.current || !window.__SRT_ENABLE_SHORTCUTS__) return
      if (e.code === 'Minus') {
        e.preventDefault()
        dispath(updateSubtitleFontSize(false))
      }
      if (e.code === 'Equal') {
        e.preventDefault()
        dispath(updateSubtitleFontSize(true))
      }
    }
    window.addEventListener('keydown', scroll)
    window.addEventListener('keydown', fontSize)
    return () => {
      window.removeEventListener('keydown', scroll)
      window.removeEventListener('keydown', fontSize)
    }
  }, [nodes])
  return { divRef, autoRef, timerRef, delayRef }
}

const useNodes = () => {
  const fileName = useSelector(state => state.files.selected)
  const [nodes, setNodes] = useState<null | Node[]>(null)
  useEffect(() => {
    if (fileName) {
      getSubtitle(fileName)
        .then(nodes => {
          setNodes(nodes)
        })
        .catch(e => {
          message(e + '')
        })
    }
  }, [fileName])
  return nodes
}

const scrollToNthChild = (() => {
  let prevN: number
  return (n: number, div: HTMLDivElement | null, setHighlight: { (s: number): void }) => {
    if (!div || n === prevN) return
    prevN = n
    const child = div.children[n] as HTMLDivElement | undefined
    if (!child) return
    const offset = child.offsetTop - div.offsetTop
    const halfHeight = div.offsetHeight / 2
    const selfHeight = child.clientHeight
    const top = offset - halfHeight + selfHeight / 2
    div.scroll({ top, behavior: 'smooth' })
    setHighlight(n + 1)
  }
})()
