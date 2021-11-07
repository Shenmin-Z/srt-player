import { FC, useState, useEffect, useRef } from 'react'
import cn from 'classnames'
import { useSelector, useDispatch, getSubtitle, updateSubtitleDelay } from '../state'
import styles from './Subtitle.module.less'
import { useRestoreSubtitle } from '../utils'

export const Subtitle: FC = () => {
  const { nodes, raw } = useSelected()
  const hasVideo = useSelector(s => s.video.hasVideo)
  const subtitleAuto = useSelector(s => s.settings.subtitleAuto)
  const subtitleDelay = useSelector(s => s.settings.subtitleDelay)
  const dispath = useDispatch()
  const [highlight, setHighlight] = useState<number | null>(null)
  const divRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<number | null>(null)
  const autoRef = useRef<boolean>(subtitleAuto)
  const delayRef = useRef<number>(subtitleDelay)

  useEffect(() => {
    function keyListener(e: KeyboardEvent) {
      if (!divRef.current || !window.enableShortcuts) return
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
    window.addEventListener('keydown', keyListener)
    return () => {
      window.removeEventListener('keydown', keyListener)
    }
  }, [])

  const scrollToNthChild = (n: number) => {
    if (!divRef.current) return
    const child = divRef.current.children[n] as HTMLDivElement | undefined
    if (!child) return
    const offset = child.offsetTop - divRef.current.offsetTop
    const halfHeight = divRef.current.offsetHeight / 2
    const selfHeight = child.clientHeight
    divRef.current.scroll({ top: offset - halfHeight + selfHeight / 2, behavior: 'smooth' })
    setHighlight(n + 1)
  }

  useEffect(() => {
    autoRef.current = subtitleAuto
    delayRef.current = subtitleDelay
  }, [subtitleAuto, subtitleDelay])

  const tick = () => {
    if (!autoRef.current) return
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    const videoElement = document.getElementById('srt-player-video') as HTMLVideoElement | null
    if (!videoElement) return
    if (videoElement.currentTime >= 0 && !videoElement.paused && !videoElement.ended) {
      const current = Math.round(videoElement.currentTime * 1000) - delayRef.current
      const node = findNode(nodes || [], current)
      if (node === null) return
      if (isWithin(current, node)) {
        scrollToNthChild(node.counter - 1)
        timerRef.current = setTimeout(() => {
          tick()
          timerRef.current = null
        }, node.end.timestamp - current)
      } else {
        timerRef.current = setTimeout(() => {
          tick()
          timerRef.current = null
        }, node.start.timestamp - current)
      }
    }
  }

  useEffect(() => {
    if (!hasVideo) return
    const videoElement = document.getElementById('srt-player-video') as HTMLVideoElement
    tick()
    videoElement.addEventListener('play', tick)
    videoElement.addEventListener('seeked', tick)
    return () => {
      videoElement.removeEventListener('play', tick)
      videoElement.removeEventListener('seeked', tick)
    }
  }, [hasVideo, subtitleAuto])

  const restoreSubtitle = useRestoreSubtitle()

  useEffect(() => {
    if (nodes !== null) {
      restoreSubtitle()
    }
  }, [nodes])

  if (nodes === null) {
    if (raw !== '') {
      return <pre>{raw}</pre>
    } else {
      return null
    }
  } else {
    return (
      <div id="srt-player-subtitle" ref={divRef} className={styles['subtitle']}>
        {nodes.map(n => (
          <SubtitleNode
            {...n}
            key={n.counter}
            highlight={highlight}
            onClick={h => {
              if (subtitleAuto) {
                const videoElement = document.getElementById('srt-player-video') as HTMLVideoElement | null
                if (videoElement) {
                  dispath(updateSubtitleDelay(Math.round(videoElement.currentTime * 1000 - n.start.timestamp)))
                }
              }
              setHighlight(h)
            }}
          />
        ))}
      </div>
    )
  }
}

const SubtitleNode: FC<Node & { highlight: number | null; onClick: (h: number) => void }> = ({
  counter,
  start,
  end,
  text,
  highlight,
  onClick,
}) => {
  return (
    <div
      className={cn(styles['node'], { [styles['highlight']]: highlight === counter })}
      onClick={() => {
        onClick(counter)
      }}
    >
      <span className={styles['counter']}>{counter}</span>
      <div>
        <div className={styles['line']}>
          <span className={styles['start']}>{start.raw}</span>
          <span className={styles['hyphen']}> - </span>
          <span className={styles['end']}>{end.raw}</span>
        </div>
        {text.map((i, idx) => (
          <p key={idx} className={styles['text']}>
            {i}
          </p>
        ))}
      </div>
    </div>
  )
}

const useSelected = () => {
  const fileName = useSelector(state => state.files.selected)
  const [nodes, setNodes] = useState<null | Node[]>(null)
  const [raw, setRaw] = useState('')
  useEffect(() => {
    if (fileName) {
      getSubtitle(fileName)
        .then(content => {
          setRaw(content)
          const nodes = parseSRT(content)
          setNodes(nodes)
        })
        .catch(e => {
          console.error(e)
        })
    }
  }, [fileName])
  return { nodes, raw }
}

interface Node {
  counter: number
  start: Time
  end: Time
  text: string[]
}

function parseSRT(content: string): Node[] {
  const lines = content.split('\r').map(i => i.trim())
  let group: string[][] = []
  let p = 0
  for (let i = 0; i < lines.length; i++) {
    if (lines[i] === '') {
      group.push(lines.slice(p, i))
      p = i + 1
    }
  }
  group = group.filter(i => i.length !== 0)
  const nodes: Node[] = []
  for (const i of group) {
    const counter = parseInt(i[0])
    const matched = i[1].match(/([\d:,]+)\s*-->\s*([\d:,]+)/)
    if (!matched) {
      throw new Error('Invalid time: ' + i[1])
    }
    const start = new Time(matched[1])
    const end = new Time(matched[2])
    const text = i.slice(2)
    nodes.push({ counter, start, end, text })
  }
  return nodes
}

class Time {
  h: number
  m: number
  s: number
  ms: number
  timestamp: number // ms

  constructor(public raw: string) {
    const matched = raw.match(/(\d+):(\d+):(\d+),(\d+)/)
    if (matched) {
      const [_, h, m, s, ms] = matched
      this.h = parseInt(h)
      this.m = parseInt(m)
      this.s = parseInt(s)
      this.ms = parseInt(ms)
      this.timestamp = this.ms + this.s * 1000 + this.m * 60 * 1000 + this.h * 60 * 60 * 1000
    } else {
      throw new Error('Invalid time string: ' + raw)
    }
  }
}

function isBefore(ts: number, n: Node) {
  return ts < n.start.timestamp
}
function isWithin(ts: number, n: Node) {
  return ts >= n.start.timestamp && ts <= n.end.timestamp
}
function isAfter(ts: number, n: Node) {
  return ts > n.end.timestamp
}

// current or next node
function findNode(nodes: Node[], ts: number): Node | null {
  if (nodes.length === 0) return null
  let l = 0
  let r = nodes.length - 1
  if (isBefore(ts, nodes[l])) return nodes[0]
  if (isAfter(ts, nodes[r])) return null
  while (l < r) {
    const m = Math.floor((l + r) / 2)
    if (isWithin(ts, nodes[m])) return nodes[m]
    if (isBefore(ts, nodes[m])) {
      r = m
    } else {
      if (l === m) return nodes[r]
      l = m
    }
  }
  return null
}
