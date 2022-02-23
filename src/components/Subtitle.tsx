import { FC, useState, useEffect, useRef, memo } from 'react'
import cn from 'classnames'
import { useSelector, useDispatch, updateSubtitleDelay, updateSubtitleFontSize, LoadSubtitlePreference } from '../state'
import { message } from './Modal'
import styles from './Subtitle.module.less'
import { useRestoreSubtitle, Node, isWithin, findNode, doVideo, getSubtitle } from '../utils'

// subtitle_time + subtitle_delay = video_time

export const Subtitle: FC = () => {
  const nodes = useNodes()
  const hasVideo = useSelector(s => s.video.hasVideo)
  const subtitleAuto = useSelector(s => s.settings.subtitleAuto)
  const subtitleDelay = useSelector(s => s.settings.subtitleDelay)
  const subtitleFontSize = useSelector(s => s.settings.subtitleFontSize)
  const dispath = useDispatch()
  const [lang, setLang] = useState<string>('')
  const [ready, setReady] = useState(false)
  const [highlight, setHighlight] = useState<number | null>(null)
  const { divRef, autoRef, timerRef, delayRef } = useShortcuts(nodes, subtitleAuto, subtitleDelay, tick)

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

  useEffect(() => {
    if (!hasVideo || nodes === null) return
    return doVideo(video => {
      tick()
      video.addEventListener('play', tick)
      video.addEventListener('seeked', tick)
      return () => {
        video.removeEventListener('play', tick)
        video.removeEventListener('seeked', tick)
      }
    })
  }, [hasVideo, subtitleAuto, nodes])

  const restoreSubtitle = useRestoreSubtitle()

  useEffect(() => {
    if (nodes !== null) {
      restoreSubtitle().then(() => {
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

  const file = useSelector(s => s.files.selected) as string
  useEffect(() => {
    dispath(LoadSubtitlePreference(file))
  }, [])

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
        className={cn(styles['subtitle'], { [styles['ready']]: ready })}
        lang={lang}
        style={{ ...fontSizes }}
      >
        {nodes.map(n => (
          <SubtitleNode
            {...n}
            key={n.counter}
            highlight={highlight === n.counter}
            setHighlight={setHighlight}
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
  setHighlight: (h: number) => void
  setDelay: (start: number) => void
  jumpToTime: (t: number) => void
}

const SubtitleNode: FC<SubtitleNodeProps> = memo(
  props => {
    const { counter, start, end, text, highlight, setHighlight, setDelay, jumpToTime } = props
    return (
      <div
        className={cn(styles['node'], { [styles['highlight']]: highlight })}
        onClick={() => {
          setHighlight(counter)
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
          {text.map((i, idx) => (
            <p key={idx} className={styles['text']}>
              {i}
            </p>
          ))}
        </div>
      </div>
    )
  },
  (prevProps, nextProps) => prevProps.highlight === nextProps.highlight,
)

const useShortcuts = (nodes: Node[] | null, subtitleAuto: boolean, subtitleDelay: number, tick: { (): void }) => {
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
    let autoTmp: boolean
    function disableAuto(e: KeyboardEvent) {
      if (!window.__SRT_ENABLE_SHORTCUTS__) return
      if (e.key === 'Control' && !e.repeat) {
        autoTmp = autoRef.current
        autoRef.current = false
      }
    }
    function enableAuto(e: KeyboardEvent) {
      if (!window.__SRT_ENABLE_SHORTCUTS__) return
      if (e.key === 'Control') {
        autoRef.current = autoTmp
        tick()
      }
    }
    window.addEventListener('keydown', scroll)
    window.addEventListener('keydown', fontSize)
    window.addEventListener('keydown', disableAuto)
    window.addEventListener('keyup', enableAuto)
    return () => {
      window.removeEventListener('keydown', scroll)
      window.removeEventListener('keydown', fontSize)
      window.removeEventListener('keydown', disableAuto)
      window.removeEventListener('keyup', enableAuto)
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
