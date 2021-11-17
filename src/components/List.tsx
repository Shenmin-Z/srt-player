import { FC, useState, useEffect } from 'react'
import cn from 'classnames'
import { useSelector, useDispatch, deleteFile, setSelected } from '../state'
import { getWatchHistory, WatchHistories, WatchHistory } from '../utils'
import styles from './List.module.less'

export let List = () => {
  let list = useSelector(state => state.files.list)
  let dispatch = useDispatch()

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
          <div key={i} className={styles['item']} style={{ '--watch-progress': percentage(hs?.[i]) + '%' } as any}>
            <span
              className={styles['file-name']}
              onClick={() => {
                dispatch(setSelected(i))
              }}
            >
              {i}
            </span>
            <span />
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
  let time = history[file].currentTime
  if (time === 0) return null
  let str =
    time < 3600 ? new Date(time * 1000).toISOString().substr(14, 5) : new Date(time * 1000).toISOString().substr(11, 8)
  return <span className={styles['label']}>{str}</span>
}

function percentage(h: WatchHistory | undefined) {
  if (!h) return 0
  const { currentTime, duration } = h
  const r = currentTime / duration
  if (isNaN(r)) return 0
  return Math.round(r * 100)
}
