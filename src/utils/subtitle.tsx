export interface Node {
  counter: number
  start: SubtitleTime
  end: SubtitleTime
  text: string[]
}

interface SSANode extends Node {
  style: string
}

export const SUBTITLE_CONTAINER_ID = 'srt-player-subtitle'
export let previousHighlighted: number

// manual update for better performance
// counter: starts from 1
export function highlight(counter: number) {
  const container = document.querySelector(`#${SUBTITLE_CONTAINER_ID}`)
  if (!container) return
  const prev = container.children[previousHighlighted - 1]
  if (prev) {
    prev.classList.remove('highlighted-subtitle')
  }
  const elm = container.children[counter - 1] as HTMLElement
  if (elm) {
    previousHighlighted = counter
    elm.classList.add('highlighted-subtitle')
  }
}

function escapeHtmlTags(s: string) {
  return s.replace(/&/g, '&amp;').replace(/<([^>]*)>/g, (match, s) => {
    // keep <i>, <b>, <u>
    if (/^\/?(i|b|u)$/i.test(s)) return match
    // escape the rest
    return `&lt;${s}&gt;`
  })
}

function filterText(s: string) {
  return s.replace(/&lrm;/gim, '')
}

function filterSSAText(s: string) {
  if (/\{[^\}]*p[1-9][^\}]*\}/.test(s)) {
    // https://aeg-dev.github.io/AegiSite/docs/3.2/ass_tags/#drawing-commands
    // ignore drawing commands
    return ''
  }
  return filterText(s)
    .replace(/\{[^\}]*\}/g, '') // ssa styling
    .replace(/&/g, '&amp;') // escape html
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
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
  const timeReg = /(\d{2}:\d{2}:\d{2},\d{3})\s-->\s(\d{2}:\d{2}:\d{2},\d{3})/
  const lines = content.split('\n').map(i => i.trim())
  let group: string[][] = []
  let p = 0
  for (let i = 0; i < lines.length; i++) {
    if (lines[i] === '') {
      const item = lines.slice(p, i)
      p = i + 1

      if (item.length < 3) continue
      if (!/^\d+$/.test(item[0])) continue
      if (!timeReg.test(item[1])) continue
      group.push(item)
    }
  }
  const nodes: Node[] = []
  let count = 0
  for (const i of group) {
    const matched = i[1].match(timeReg)!
    const start = parseTime(matched[1], 'srt')
    const end = parseTime(matched[2], 'srt')
    const text = i.slice(2).map(filterText).map(escapeHtmlTags)
    nodes.push({ counter: ++count, start, end, text })
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
  const nodes: SSANode[] = []
  for (let i = 0; i < lines.length; i++) {
    const tmp =
      /^[^,]*,(?<startRaw>[^,]*),(?<endRaw>[^,]*),(?<style>[^,]*),[^,]*,[^,]*,[^,]*,[^,]*,[^,]*,(?<textRaw>.*)$/.exec(
        lines[i],
      )
    if (!tmp?.groups) continue
    const { startRaw, endRaw, style, textRaw } = tmp.groups
    const counter = i + 1
    const start = parseTime(startRaw, 'ssa')
    const end = parseTime(endRaw, 'ssa')
    const text = filterSSAText(textRaw)
    if (!text) continue
    nodes.push({ counter, start, style, end, text: text.split(/\\n/i) })
  }
  return sortAndMerge(nodes)
}

function sortAndMerge(nodes: SSANode[]): Node[] {
  nodes.sort((a, b) => {
    if (a.start.timestamp === b.start.timestamp) {
      return a.style.localeCompare(b.style)
    }
    return a.start.timestamp - b.start.timestamp
  })
  const merged: Node[] = []
  let count = 0
  nodes.forEach(n => {
    if (merged.length === 0 || merged[merged.length - 1].end.timestamp <= n.start.timestamp) {
      n.counter = ++count
      merged.push(n)
    } else {
      const last = merged[merged.length - 1]
      if (n.end.timestamp > last.end.timestamp) {
        last.end = n.end
      }
      last.text = last.text.concat(n.text)
    }
  })
  return merged
}

function parseTime(raw: string, type: 'srt' | 'ssa') {
  const t: SubtitleTime = { raw, timestamp: 0 }
  if (type === 'srt') {
    const matched = raw.match(/(\d{2}):(\d{2}):(\d{2}),(\d{3})/)
    const [_, h, m, s, ms] = matched!
    t.timestamp = parseInt(ms) + parseInt(s) * 1000 + parseInt(m) * 60 * 1000 + parseInt(h) * 60 * 60 * 1000
  } else {
    const matched = raw.match(/(\d):(\d{2}):(\d{2}).(\d{2})/)
    if (matched) {
      const [_, h, m, s, ms] = matched
      t.timestamp = parseInt(ms) + parseInt(s) * 1000 + parseInt(m) * 60 * 1000 + parseInt(h) * 60 * 60 * 1000
    } else {
      throw new Error('Invalid time string: ' + raw)
    }
  }
  return t
}

interface SubtitleTime {
  raw: string
  timestamp: number // ms
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
