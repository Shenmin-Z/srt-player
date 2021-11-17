import { FC, useState, useEffect, useRef } from 'react'
import cn from 'classnames'
import { useSelector, useDispatch, getSubtitle, updateSubtitleDelay, LoadSubtitlePreference } from '../state'
import styles from './Subtitle.module.less'
import { useRestoreSubtitle, Node, isWithin, findNode, doVideo } from '../utils'

let autoTmp: boolean

export const Subtitle: FC = () => {
  const nodes = useNodes()
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
    function disableAuto(e: KeyboardEvent) {
      if (!window.enableShortcuts) return
      if (e.key === 'Control') {
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
    window.addEventListener('keydown', disableAuto)
    window.addEventListener('keyup', enableAuto)
    return () => {
      window.removeEventListener('keydown', scroll)
      window.removeEventListener('keydown', disableAuto)
      window.removeEventListener('keyup', enableAuto)
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
    }
  }, [nodes])

  const file = useSelector(s => s.files.selected) as string
  useEffect(() => {
    dispath(LoadSubtitlePreference(file))
  }, [])

  if (nodes === null) {
    return null
  } else {
    return (
      <div id="srt-player-subtitle" ref={divRef} className={styles['subtitle']}>
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
