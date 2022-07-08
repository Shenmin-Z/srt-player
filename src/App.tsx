import { FC, useEffect, MouseEventHandler, TouchEventHandler, useState } from 'react'
import cn from 'classnames'
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
import { useSaveHistory, migrate, getSubtitle, IS_MOBILE } from './utils'

const App: FC = migrate(() => {
  const dispatch = useDispatch()
  const selected = useSelector(state => state.files.selected)
  const locale = useSelector(state => state.settings.locale)
  const [hasSubtitle, setHasSubtitle] = useState<boolean | null>(null)

  useEffect(() => {
    dispatch(getList())
    dispatch(LoadSettingsFromLocal())
  }, [])

  useEffect(() => {
    if (selected) {
      getSubtitle(selected).then(nodes => {
        setHasSubtitle(nodes.length > 0)
      })
    } else {
      setHasSubtitle(null)
    }
  }, [selected])

  if (locale === '') return null
  return hasSubtitle === null ? <Home /> : <Play hasSubtitle={hasSubtitle} />
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

const Play: FC<{ hasSubtitle: boolean }> = ({ hasSubtitle }) => {
  const saveHistory = useSaveHistory(5000)

  useEffect(() => {
    document.addEventListener('mouseleave', saveHistory)
    return () => {
      document.removeEventListener('mouseleave', saveHistory)
    }
  }, [])

  return (
    <>
      <div className={cn(styles['play'], { 'no-subtitle': !hasSubtitle })}>
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
