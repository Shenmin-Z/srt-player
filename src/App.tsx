import { FC, useEffect, MouseEventHandler } from 'react'
import { Language } from './components/Language'
import { Uploader } from './components/Uploader'
import { List } from './components/List'
import { Footer } from './components/Footer'
import { Nav } from './components/Nav'
import { Subtitle } from './components/Subtitle'
import { Video } from './components/Video'
import { Message, Confirm } from './components/Modal'
import { useDispatch, useSelector, getList, LoadSettingsFromLocal, updateSubtitleWidth } from './state'
import styles from './App.module.less'
import { useSaveHistory, migrate } from './utils'

const App: FC = migrate(() => {
  const dispatch = useDispatch()
  const selected = useSelector(state => state.files.selected)
  const locale = useSelector(state => state.settings.locale)

  useEffect(() => {
    dispatch(getList())
    dispatch(LoadSettingsFromLocal())
  }, [])

  if (locale === '') return null
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
    <>
      <div className={styles['play']}>
        <Nav />
        <Video />
        <ResizeBar />
        <Subtitle />
      </div>
      <Message />
      <Confirm />
    </>
  )
}

const ResizeBar: FC = () => {
  const subtitleWidth = useSelector(s => s.settings.subtitleWidth)
  const dispatch = useDispatch()

  const onMD: MouseEventHandler<HTMLDivElement> = e => {
    const prev = e.clientX
    function onMouseMove(e: MouseEvent) {
      const delta = e.clientX - prev
      dispatch(updateSubtitleWidth(subtitleWidth - delta))
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
