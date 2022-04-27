export interface Node {
  counter: number
  start: Time
  end: Time
  text: string[]
}

function removeTags(s: string) {
  return s.replace(/<[^>]*>/g, s => {
    if (/^<\/?(i|b|u)>$/i.test(s)) return s
    return ''
  })
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
    const matched = i[1].match(/(\d{2}:\d{2}:\d{2},\d{3})\s-->\s(\d{2}:\d{2}:\d{2},\d{3})/)
    if (!matched) {
      throw new Error('Invalid time: ' + i[1])
    }
    const start = new Time(matched[1], 'srt')
    const end = new Time(matched[2], 'srt')
    const text = i.slice(2).map(filterText).map(removeTags)
    nodes.push({ counter, start, end, text })
  }
  return nodes
}

function parseSSA(content: string): Node[] {
  const lines = content
    .split('\n')
    .map(i => {
      const section = i.trim().match(/^Dialogue:(.*)$/)?.[1]
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
    const text = removeCurlyBrakets(filterText(textRaw)).split(/\\n/i)
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
      const matched = raw.match(/(\d{2}):(\d{2}):(\d{2}),(\d{3})/)
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
