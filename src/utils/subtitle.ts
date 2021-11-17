export interface Node {
  counter: number
  start: Time
  end: Time
  text: string[]
}

export function parseSRT(content: string): Node[] {
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
