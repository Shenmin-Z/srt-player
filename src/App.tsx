import { FC, useEffect } from 'react'
import cn from 'classnames'
import { Uploader } from './components/Uploader'
import { List } from './components/List'
import { Nav } from './components/Nav'
import { Subtitle } from './components/Subtitle'
import { Video } from './components/Video'
import { Dictionary } from './components/Dictionary'
import { useDispatch, useSelector, getList } from './state'
import styles from './App.module.less'
import { SubtitleWidthWithDictionary, SubtitleWidthWithoutDictionary, DictionaryWidth, DictionaryUrl, DictionaryLeftOffset, WatchHistory } from './utils'

function App() {
  let dispatch = useDispatch()
  let selected = useSelector(state => state.files.selected)

  useEffect(() => {
    dispatch(getList())
    SubtitleWidthWithDictionary.set()
    SubtitleWidthWithoutDictionary.set()
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
  let hasDictionary = useSelector(s => s.settings.hasDictionary)
  let file = useSelector(state => state.files.selected)

  useEffect(() => {
    let history = new WatchHistory(file as string)
    history.restoreSubtitle()
    window.addEventListener('keydown', history.keyListener)
    return () => {
      window.removeEventListener('keydown', history.keyListener)
    }
  }, [])

  return (
    <div className={styles['play']}>
      <Nav />
      <div className={cn(styles['body'], { [styles['has-dictionary']]: hasDictionary })}>
        <Dictionary />
        <ResizeBar type="dictionary" />
        <Video />
        <ResizeBar type="subtitle" />
        <div className={styles['part-b']}>
          <Subtitle />
        </div>
      </div>
    </div>
  )
}

let ResizeBar: FC<{ type: 'dictionary' | 'subtitle' }> = ({ type }) => {
  let hasDictionary = useSelector(s => s.settings.hasDictionary)
  let onMD = () => {
    if (type === 'dictionary') {
      let dictionaryIFrame = document.getElementById('dictionary-iframe')
      if (dictionaryIFrame) {
        dictionaryIFrame.style.pointerEvents = 'none'
      }
    }
    function onMouseMove(e: MouseEvent) {
      let width = type === 'dictionary' ? DictionaryWidth : (hasDictionary ? SubtitleWidthWithDictionary : SubtitleWidthWithoutDictionary)
      let prev = parseInt(width.get() as string)
      let next: number
      if (type === 'dictionary') {
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
