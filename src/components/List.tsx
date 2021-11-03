import { FC, useState, useEffect, useRef } from 'react'
import cn from 'classnames'
import { useSelector, useDispatch, deleteFile, setSelected } from '../state'
import { debounce, getWatchHistory, WatchHistories } from '../utils'
import styles from './List.module.less'

const getVW = () => Math.floor(Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0))

export let List = () => {
  let list = useSelector(state => state.files.list)
  let dispatch = useDispatch()

  let [vw, setVw] = useState(getVW)

  useEffect(() => {
    let listener = debounce(() => {
      setVw(getVW())
    }, 500)
    window.addEventListener('resize', listener)
    return () => {
      window.removeEventListener('resize', listener)
    }
  }, [])

  let [hs, setHS] = useState<WatchHistories>({})
  useEffect(() => {
    getWatchHistory().then(hs => {
      setHS(hs)
    })
  }, [list])

  return (
    <div className={styles['list']}>
      {list.map(i => {
        return (
          <div key={i} className={styles['item']}>
            <Text
              width={vw}
              height={32}
              text={i}
              onClick={() => {
                dispatch(setSelected(i))
              }}
            />
            <Label history={hs} file={i} />
            <span
              className={cn('material-icons', styles['icon'])}
              onClick={() => {
                dispatch(deleteFile(i))
              }}
            >
              delete_outline
            </span>
          </div>
        )
      })}
    </div>
  )
}

let Label: FC<{ history: WatchHistories; file: string }> = ({ history, file }) => {
  if (!history[file]) return null
  let time = history[file].videoTime
  let str =
    time < 3600 ? new Date(time * 1000).toISOString().substr(14, 5) : new Date(time * 1000).toISOString().substr(11, 8)
  return <span className={styles['label']}>{str}</span>
}

interface TextProps {
  width: number
  height: number
  text: string
  onClick: () => void
}

let Text: FC<TextProps> = ({ width, height, text, onClick }) => {
  let [size, setSize] = useState({ width: -1, height: -1 })
  let textRef = useRef<SVGTextElement>(null)

  useEffect(() => {
    let svgText = textRef.current
    if (svgText) {
      let { width, height } = svgText.getBoundingClientRect()
      setSize({ width, height })
    }
  }, [text])

  let viewBox: string | undefined = undefined
  if (size.width > width) {
    viewBox = `0 0 ${size.width} ${size.height}`
  }

  return (
    <>
      <svg className={styles['off-screen']} width={width} height={height}>
        <text ref={textRef}>{text + '~'}</text>
      </svg>
      <svg width={width} height={height} viewBox={viewBox}>
        {size.width === -1 ? null : (
          <text y="50%" dominantBaseline="middle" onClick={onClick}>
            {text}
          </text>
        )}
      </svg>
    </>
  )
}
