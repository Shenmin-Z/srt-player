import { FC, useEffect, MouseEventHandler, TouchEventHandler } from 'react'
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
import { useSaveHistory, migrate, IS_MOBILE } from './utils'

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

  const handleMouse: MouseEventHandler = e => {
    const prev = e.clientX
    function onMove(e: MouseEvent) {
      const clientX = e.clientX
      const delta = clientX - prev
      dispatch(updateSubtitleWidth(subtitleWidth - delta))
    }
    function onEnd() {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onEnd)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onEnd)
  }

  const handleTouch: TouchEventHandler = e => {
    const prev = e.touches[0].clientX
    function onMove(e: TouchEvent) {
      const clientX = e.touches[0].clientX
      const delta = clientX - prev
      dispatch(updateSubtitleWidth(subtitleWidth - delta))
    }
    function onEnd() {
      document.removeEventListener('touchmove', onMove)
      document.removeEventListener('touchend', onEnd)
    }
    document.addEventListener('touchmove', onMove)
    document.addEventListener('touchend', onEnd)
  }

  return (
    <div className={styles['resize']} onMouseDown={handleMouse}>
      {IS_MOBILE && <div className={styles['fat-bar']} onTouchStart={handleTouch} />}
    </div>
  )
}

export default App
