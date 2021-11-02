import { FC, useState, useEffect, useRef } from 'react'
import cn from 'classnames'
import { useSelector, getSubtitle } from '../state'
import styles from './Subtitle.module.less'
import { WatchHistory } from '../utils'

export let Subtitle: FC = () => {
  let { nodes, raw } = useSelected()
  let [highlight, setHighlight] = useState<number | null>(null)
  let divRef = useRef<HTMLDivElement>(null)
  let file = useSelector(state => state.files.selected)

  useEffect(() => {
    function keyListener(e: KeyboardEvent) {
      if (!divRef.current || !window.enableShortcuts) return
      let step = divRef.current.offsetHeight / 2
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

  useEffect(() => {
    if (nodes !== null) {
      let history = new WatchHistory(file as string)
      history.restoreSubtitle()
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
          <SubtitleNode {...n} key={n.counter} highlight={highlight} setHighlight={setHighlight} />
        ))}
      </div>
    )
  }
}

let SubtitleNode: FC<Node & { highlight: number | null; setHighlight: (h: number) => void }> = ({
  counter,
  start,
  end,
  text,
  highlight,
  setHighlight,
}) => {
  return (
    <div
      className={cn(styles['node'], { [styles['highlight']]: highlight === counter })}
      onClick={() => {
        setHighlight(counter)
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

let useSelected = () => {
  let fileName = useSelector(state => state.files.selected)
  let [nodes, setNodes] = useState<null | Node[]>(null)
  let [raw, setRaw] = useState('')
  useEffect(() => {
    if (fileName) {
      getSubtitle(fileName)
        .then(content => {
          setRaw(content)
          let nodes = parseSRT(content)
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
  let lines = content.split('\r').map(i => i.trim())
  let group: string[][] = []
  let p = 0
  for (let i = 0; i < lines.length; i++) {
    if (lines[i] === '') {
      group.push(lines.slice(p, i))
      p = i + 1
    }
  }
  group = group.filter(i => i.length !== 0)
  let nodes: Node[] = []
  for (let i of group) {
    let counter = parseInt(i[0])
    let matched = i[1].match(/([\d:,]+)\s*-->\s*([\d:,]+)/)
    if (!matched) {
      throw new Error('Invalid time: ' + i[1])
    }
    let start = new Time(matched[1])
    let end = new Time(matched[2])
    let text = i.slice(2)
    nodes.push({ counter, start, end, text })
  }
  return nodes
}

class Time {
  h: number
  m: number
  s: number
  ms: number
  timestamp: number

  constructor(public raw: string) {
    let matched = raw.match(/(\d+):(\d+):(\d+),(\d+)/)
    if (matched) {
      let [_, h, m, s, ms] = matched
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
