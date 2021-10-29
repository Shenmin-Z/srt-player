import { FC, useEffect } from 'react'
import { Uploader } from './components/Uploader'
import { List } from './components/List'
import { Nav } from './components/Nav'
import { Subtitle } from './components/Subtitle'
import { Video } from './components/Video'
import { Dictionary } from './components/Dictionary'
import { useDispatch, useSelector, getList } from './state'
import styles from './App.module.less'
import { SubtitleWidth, DictionaryWidth, DictionaryUrl, DictionaryLeftOffset } from './utils'

function App() {
  let dispatch = useDispatch()
  let selected = useSelector(state => state.files.selected)

  useEffect(() => {
    dispatch(getList())
    SubtitleWidth.set()
    DictionaryWidth.set()
    DictionaryUrl.set()
    DictionaryLeftOffset.set()
  }, [])

  return selected === null ? <Home /> : <Play />
}

function Home() {
  return (
    <div className={styles['home']}>
      <Uploader />
      <List />
    </div>
  )
}

function Play() {
  return (
    <div className={styles['play']}>
      <Nav />
      <div className={styles['body']}>
        <Dictionary />
        <ResizeBar width={DictionaryWidth} />
        <Video />
        <ResizeBar width={SubtitleWidth} />
        <div className={styles['part-b']}>
          <Subtitle />
        </div>
      </div>
    </div>
  )
}

let ResizeBar: FC<{ width: typeof DictionaryWidth | typeof SubtitleWidth }> = ({ width }) => {
  let onMD = () => {
    if (width === DictionaryWidth) {
      let dictionaryIFrame = document.getElementById('dictionary-iframe')
      if (dictionaryIFrame) {
        dictionaryIFrame.style.pointerEvents = 'none'
      }
    }
    function onMouseMove(e: MouseEvent) {
      let prev = parseInt(width.get() as string)
      let next: number
      if (width === DictionaryWidth) {
        next = prev + e.movementX
      } else {
        next = prev - e.movementX
      }
      width.set(next + 'px')
    }
    function onMouseUp() {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
      let dictionaryIFrame = document.getElementById('dictionary-iframe')
      if (dictionaryIFrame) {
        dictionaryIFrame.style.pointerEvents = 'auto'
      }
    }
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }

  return <div className={styles['resize']} onMouseDown={onMD} />
}

export default App
