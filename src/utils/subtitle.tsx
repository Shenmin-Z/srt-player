import { ReactElement, Fragment } from 'react'
import cn from 'classnames'

export interface Node {
  counter: number
  start: Time
  end: Time
  text: string[]
}

function filterText(s: string) {
  return s.replace(/&lrm;/gim, '')
}

function removeCurlyBrakets(s: string) {
  return s.replace(/\{[^\}]*\}/g, '')
}

export const SSA = '[SSA]'

export function parseSubtitle(content: string): Node[] {
  // formats other than srt will have [format] at beginning
  if (content.startsWith(SSA)) {
    return parseSSA(content)
  } else {
    return parseSRT(content)
  }
}

function parseSRT(content: string): Node[] {
  const lines = content.split('\n').map(i => i.trim())
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
    const start = new Time(matched[1], 'srt')
    const end = new Time(matched[2], 'srt')
    const text = i.slice(2).map(filterText)
    nodes.push({ counter, start, end, text })
  }
  return nodes
}

function parseSSA(content: string): Node[] {
  const lines = content
    .split('\n')
    .map(i => {
      const section = i.trim().match(/^dialogue:(.*)$/i)?.[1]
      if (!section) return ''
      return section.trim()
    })
    .filter(Boolean)
  const nodes: Node[] = []
  for (let i = 0; i < lines.length; i++) {
    const tmp = /^[^,]*,(?<startRaw>[^,]*),(?<endRaw>[^,]*),[^,]*,[^,]*,[^,]*,[^,]*,[^,]*,[^,]*,(?<textRaw>.*)$/.exec(
      lines[i],
    )
    if (!tmp?.groups) throw new Error('SSA parer error in line: ' + lines[i])
    const { startRaw, endRaw, textRaw } = tmp.groups
    const counter = i + 1
    const start = new Time(startRaw, 'ssa')
    const end = new Time(endRaw, 'ssa')
    const text = [removeCurlyBrakets(filterText(textRaw))]
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

  constructor(public raw: string, type: 'srt' | 'ssa') {
    if (type === 'srt') {
      const matched = raw.match(/(\d+):(\d+):(\d+),(\d+)/)
      if (matched) {
        const [_, h, m, s, ms] = matched
        this.h = parseInt(h)
        this.m = parseInt(m)
        this.s = parseInt(s)
        this.ms = parseInt(ms)
      } else {
        throw new Error('Invalid time string: ' + raw)
      }
    } else {
      const matched = raw.match(/(\d):(\d{2}):(\d{2}).(\d{2})/)
      if (matched) {
        const [_, h, m, s, ms] = matched
        this.h = parseInt(h)
        this.m = parseInt(m)
        this.s = parseInt(s)
        this.ms = parseInt(ms) * 10
      } else {
        throw new Error('Invalid time string: ' + raw)
      }
    }
    this.timestamp = this.ms + this.s * 1000 + this.m * 60 * 1000 + this.h * 60 * 60 * 1000
  }
}

export function isBefore(ts: number, n: Node) {
  return ts < n.start.timestamp
}
export function isWithin(ts: number, n: Node) {
  return ts >= n.start.timestamp && ts <= n.end.timestamp
}
export function isAfter(ts: number, n: Node) {
  return ts > n.end.timestamp
}

// current or next node
export function findNode(nodes: Node[], ts: number): Node | null {
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

enum TokenType {
  IO,
  IC,
  BO,
  BC,
}

interface HTMLNode {
  type: 'text' | 'italic' | 'bold'
  text?: string
  children?: HTMLNode[]
}

export function ib(s: string): string | ReactElement {
  if (!/<(i|b)>/im.test(s)) return s
  const tokenize = (s: string): (string | TokenType)[] => {
    const result: (string | TokenType)[] = []
    let pointer = 0
    let l: number | null = null
    let r: number | null = null
    const isIO = () => s.substring(pointer, pointer + 3).toLowerCase() === '<i>'
    const isIC = () => s.substring(pointer, pointer + 4).toLowerCase() === '</i>'
    const isBO = () => s.substring(pointer, pointer + 3).toLowerCase() === '<b>'
    const isBC = () => s.substring(pointer, pointer + 4).toLowerCase() === '</b>'
    const addString = () => {
      if (l === null) return
      result.push(s.substring(l, (r as number) + 1))
      l = null
      r = null
    }
    for (; pointer < s.length; ) {
      if (isIO()) {
        addString()
        result.push(TokenType.IO)
        pointer += 3
      } else if (isIC()) {
        addString()
        result.push(TokenType.IC)
        pointer += 4
      } else if (isBO()) {
        addString()
        result.push(TokenType.BO)
        pointer += 3
      } else if (isBC()) {
        addString()
        result.push(TokenType.BC)
        pointer += 4
      } else {
        if (l === null) {
          l = pointer
          r = pointer
        } else {
          r = pointer
        }
        pointer++
      }
    }
    addString()
    return result
  }
  const tokens = tokenize(s)

  const parse = () => {
    let pointer = -1
    const treeParser = (children: HTMLNode[], context: 'italic' | 'bold' | 'root') => {
      pointer++
      if (pointer >= tokens.length) {
        // if (context === 'italic') {
        //   throw new Error('tag not closed: expecting </i>')
        // } else if (context === 'bold') {
        //   throw new Error('tag not closed: expecting </b>')
        // }
        return
      }
      const i = tokens[pointer]
      if (typeof i === 'string') {
        children.push({ type: 'text', text: i })
      } else if (i === TokenType.IO) {
        const newChilden: HTMLNode[] = []
        children.push({ type: 'italic', children: newChilden })
        treeParser(newChilden, 'italic')
      } else if (i === TokenType.BO) {
        const newChilden: HTMLNode[] = []
        children.push({ type: 'bold', children: newChilden })
        treeParser(newChilden, 'bold')
      } else if (i === TokenType.IC) {
        if (context === 'italic') {
          return
        } else {
          throw new Error('invalid token: expecting </b>')
        }
      } else if (i === TokenType.BC) {
        if (context === 'bold') {
          return
        } else {
          throw new Error('invalid token: expecting </i>')
        }
      }
      treeParser(children, context)
    }
    const list: HTMLNode[] = []
    treeParser(list, 'root')
    return list
  }
  let list: HTMLNode[] = []
  try {
    list = parse()
  } catch {
    return s
  }

  const toElement = (n: HTMLNode, italic: boolean, bold: boolean, key: number): ReactElement => {
    if (n.type === 'text') {
      return (
        <span key={key} className={cn({ 'subtitle-italic': italic, 'subtitle-bold': bold })}>
          {n.text || ''}
        </span>
      )
    } else if (n.type === 'italic') {
      return <Fragment key={key}>{(n.children || []).map((i, idx) => toElement(i, true, bold, idx))}</Fragment>
    } else if (n.type === 'bold') {
      return <Fragment key={key}>{(n.children || []).map((i, idx) => toElement(i, italic, true, idx))}</Fragment>
    } else {
      return <></>
    }
  }
  return <>{list.map((i, idx) => toElement(i, false, false, idx))}</>
}
