import { FC, useEffect, MouseEventHandler, TouchEventHandler } from 'react'
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
import { useSaveHistory, migrate, IS_MOBILE } from './utils'

const App: FC = migrate(() => {
  const dispatch = useDispatch()
  const subtitleNoes = useSelector(state => state.files.subtitleNoes)
  const locale = useSelector(state => state.settings.locale)
  const selected = useSelector(state => state.files.selected)

  useEffect(() => {
    dispatch(getList())
    dispatch(LoadSettingsFromLocal())
  }, [])

  if (locale === '') return null
  return subtitleNoes === null ? (
    <Home />
  ) : (
    <Play hasSubtitle={subtitleNoes.length > 0} hasVideo={!/\.(srt|ass|ssa)$/i.test(selected || '')} />
  )
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

interface PlayProps {
  hasSubtitle: boolean
  hasVideo: boolean
}

const Play: FC<PlayProps> = ({ hasSubtitle, hasVideo }) => {
  const saveHistory = useSaveHistory(5000)

  useEffect(() => {
    document.addEventListener('mouseleave', saveHistory)
    return () => {
      document.removeEventListener('mouseleave', saveHistory)
    }
  }, [])

  return (
    <>
      <div className={cn(styles['play'], { 'no-subtitle': !hasSubtitle, 'no-video': !hasVideo })}>
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

if (IS_MOBILE) {
  document.documentElement.classList.add('is-mobile')
  document.documentElement.style.setProperty('--100vh', `${window.innerHeight}px`)
  window.addEventListener('resize', () => {
    document.documentElement.style.setProperty('--100vh', `${window.innerHeight}px`)
  })
} else {
  document.documentElement.style.setProperty('--100vh', '100vh')
}

export default App
