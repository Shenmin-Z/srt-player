import { FC, useState, useEffect } from 'react'
import { get } from 'idb-keyval'
import { useSelector } from '../state'
import styles from './Subtitle.module.less'

export let Subtitle: FC = () => {
  let { nodes, raw } = useSelected()
  if (nodes === null) {
    if (raw !== '') {
      return <pre>{raw}</pre>
    } else {
      return null
    }
  } else {
    return (
      <div className={styles['subtitle']}>
        {nodes.map(n => (
          <SubtitleNode {...n} key={n.counter} />
        ))}
      </div>
    )
  }
}

let SubtitleNode: FC<Node> = ({ counter, start, end, text }) => {
  return (
    <div className={styles['node']}>
      <div className={styles['line']}>
        <span className={styles['counter']}>{counter}</span>
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
  )
}

let useSelected = () => {
  let fileName = useSelector(state => state.files.selected)
  let [nodes, setNodes] = useState<null | Node[]>(null)
  let [raw, setRaw] = useState('')
  useEffect(() => {
    if (fileName) {
      get(fileName)
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
