import { FC, useEffect, MouseEventHandler } from 'react'
import cn from 'classnames'
import { Language } from './components/Language'
import { Uploader } from './components/Uploader'
import { List } from './components/List'
import { Footer } from './components/Footer'
import { Nav } from './components/Nav'
import { Subtitle } from './components/Subtitle'
import { Video } from './components/Video'
import { Dictionary } from './components/Dictionary'
import { Message, Confirm } from './components/Modal'
import {
  useDispatch,
  useSelector,
  getList,
  LoadSettingsFromLocal,
  updateSubtitleWidth,
  updateDictionaryWidth,
} from './state'
import styles from './App.module.less'
import { useSaveHistory, migrate } from './utils'

const App: FC = migrate(() => {
  const dispatch = useDispatch()
  const selected = useSelector(state => state.files.selected)
  const language = useSelector(state => state.settings.language)

  useEffect(() => {
    dispatch(getList())
    dispatch(LoadSettingsFromLocal())
  }, [])

  useEffect(() => {
    if (selected === null) {
      document.body.style.overflow = 'auto'
    } else {
      document.body.style.overflow = 'hidden'
    }
  }, [selected])

  if (language === '') return null
  return selected === null ? <Home /> : <Play />
})

const Home: FC = () => {
  return (
    <div className={styles['home']}>
      <Language />
      <Uploader />
      <List />
      <Footer />
      <Message />
      <Confirm />
    </div>
  )
}

const Play: FC = () => {
  const layout = useSelector(s => s.settings.layout)
  const saveHistory = useSaveHistory()

  useEffect(() => {
    function listener() {
      saveHistory()
    }
    window.addEventListener('beforeunload', listener)
    return () => {
      window.removeEventListener('beforeunload', listener)
    }
  }, [])

  return (
    <div className={styles['play']}>
      <Nav />
      <div className={cn(styles['body'], { [styles['2col']]: layout === '2col', [styles['3col']]: layout === '3col' })}>
        <Dictionary />
        <ResizeBar type="dictionary" />
        <Video />
        <ResizeBar type="subtitle" />
        <div className={styles['part-b']}>
          <Subtitle />
        </div>
      </div>
      <Message />
      <Confirm />
    </div>
  )
}

const ResizeBar: FC<{ type: 'dictionary' | 'subtitle' }> = ({ type }) => {
  const subtitleWidth = useSelector(s => s.settings.subtitleWidth)
  const dictionaryWidth = useSelector(s => s.settings.dictionaryWidth)
  const dispatch = useDispatch()

  const onMD: MouseEventHandler<HTMLDivElement> = e => {
    if (type === 'dictionary') {
      const dictionaryIFrame = document.getElementById('dictionary-iframe')
      if (dictionaryIFrame) {
        dictionaryIFrame.style.pointerEvents = 'none'
      }
    }
    const prev = e.clientX
    function onMouseMove(e: MouseEvent) {
      const delta = e.clientX - prev
      if (type === 'dictionary') {
        dispatch(updateDictionaryWidth(dictionaryWidth + delta))
      } else {
        dispatch(updateSubtitleWidth(subtitleWidth - delta))
      }
    }
    function onMouseUp() {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
      const dictionaryIFrame = document.getElementById('dictionary-iframe')
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
