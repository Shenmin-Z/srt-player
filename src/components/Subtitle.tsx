import { FC, useState, useEffect, useRef } from 'react'
import cn from 'classnames'
import {
  useSelector,
  useDispatch,
  getSubtitle,
  updateSubtitleDelay,
  updateSubtitleFontSize,
  LoadSubtitlePreference,
} from '../state'
import styles from './Subtitle.module.less'
import { useRestoreSubtitle, Node, isWithin, findNode, doVideo } from '../utils'

export const Subtitle: FC = () => {
  const nodes = useNodes()
  const hasVideo = useSelector(s => s.video.hasVideo)
  const subtitleAuto = useSelector(s => s.settings.subtitleAuto)
  const subtitleDelay = useSelector(s => s.settings.subtitleDelay)
  const subtitleFontSize = useSelector(s => s.settings.subtitleFontSize)
  const dispath = useDispatch()
  const [lang, setLang] = useState('')
  const [highlight, setHighlight] = useState<number | null>(null)
  const divRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<number | null>(null)
  const autoRef = useRef<boolean>(subtitleAuto)
  const delayRef = useRef<number>(subtitleDelay)

  useEffect(() => {
    if (!nodes || nodes.length === 0) return
    function scroll(e: KeyboardEvent) {
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
    function fontSize(e: KeyboardEvent) {
      if (!divRef.current || !window.enableShortcuts) return
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
      if (!window.enableShortcuts) return
      if (e.key === 'Control' && !e.repeat) {
        autoTmp = autoRef.current
        autoRef.current = false
      }
    }
    function enableAuto(e: KeyboardEvent) {
      if (!window.enableShortcuts) return
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
    tick()
  }, [subtitleAuto, subtitleDelay])

  const tick = () => {
    if (!autoRef.current) return
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    doVideo(video => {
      if (video.currentTime >= 0 && !video.paused && !video.ended) {
        const current = Math.round(video.currentTime * 1000) - delayRef.current
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
    })
  }

  useEffect(() => {
    if (!hasVideo) return
    return doVideo(video => {
      tick()
      video.addEventListener('play', tick)
      video.addEventListener('seeked', tick)
      return () => {
        video.removeEventListener('play', tick)
        video.removeEventListener('seeked', tick)
      }
    })
  }, [hasVideo, subtitleAuto])

  const restoreSubtitle = useRestoreSubtitle()

  useEffect(() => {
    if (nodes !== null) {
      restoreSubtitle()
      // detect language
      for (let i = 0; i < Math.min(20, nodes.length); i++) {
        const text = nodes[i].text.join('')
        const jpCharacters = (text.match(/[ぁ-ゔ]+|[ァ-ヴー]+|[a-zA-Z0-9]+|[ａ-ｚＡ-Ｚ０-９]+/gu) || []).join('')
        if (jpCharacters.length >= 5) {
          setLang('jp')
          return
        }
      }
    }
  }, [nodes])

  const file = useSelector(s => s.files.selected) as string
  useEffect(() => {
    dispath(LoadSubtitlePreference(file))
  }, [])

  if (nodes === null) {
    return null
  } else {
    const fontSizes = {
      '--subtitle-text': `${Math.max(subtitleFontSize, 5)}px`,
      '--subtitle-counter': `${Math.max(subtitleFontSize - 2, 5)}px`,
      '--subtitle-time': `${Math.max(subtitleFontSize - 7, 5)}px`,
    } as any
    return (
      <div id="srt-player-subtitle" ref={divRef} className={styles['subtitle']} lang={lang} style={fontSizes}>
        {nodes.map(n => (
          <SubtitleNode
            {...n}
            key={n.counter}
            highlight={highlight}
            onClick={(h, adjustDelay) => {
              if (subtitleAuto && adjustDelay) {
                doVideo(video => {
                  dispath(
                    updateSubtitleDelay({
                      file,
                      delay: Math.round(video.currentTime * 1000 - n.start.timestamp),
                    }),
                  )
                })
              }
              setHighlight(h)
            }}
          />
        ))}
      </div>
    )
  }
}

const SubtitleNode: FC<Node & { highlight: number | null; onClick: (h: number, adjustDelay?: boolean) => void }> = ({
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
      onClick={e => {
        onClick(counter, e.ctrlKey)
      }}
      onContextMenu={e => {
        e.preventDefault()
        onClick(counter, true)
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
          console.error(e)
        })
    }
  }, [fileName])
  return nodes
}
