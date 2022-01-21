import { FC, useState, useEffect } from 'react'
import { getCurrentVersion, getLatestVersion, useI18n } from '../utils'
import { confirm } from './Modal'
import styles from './Footer.module.less'

const clearAndUpate = () => {
  return new Promise<void>(resolve => {
    const sw = navigator.serviceWorker.controller
    if (sw) {
      const channel = new MessageChannel()
      sw.postMessage(
        {
          type: 'UPDATE',
        },
        [channel.port2],
      )
      channel.port1.onmessage = event => {
        if (event.data === 'updated') {
          resolve()
        }
      }
    }
  })
}

const click5Times = {
  count: 0,
  waiting: false,
  timer: 0,
  click() {
    if (this.waiting) {
      this.count++
      clearTimeout(this.timer)
      if (this.count === 5) {
        this.count = 0
        clearAndUpate().then(() => {
          location.reload()
        })
      }
    } else {
      this.count = 1
    }
    this.waiting = true
    this.timer = setTimeout(() => {
      this.waiting = false
    }, 200)
  },
}

const Version: FC = () => {
  const [version, setVersion] = useState('')
  const [hasUpdate, setHasUpdate] = useState(false)
  const i18n = useI18n()

  useEffect(() => {
    getCurrentVersion().then(v => {
      if (v) {
        setVersion(v)
      }
    })
    setTimeout(async () => {
      const current = await getCurrentVersion()
      const latest = await getLatestVersion(true)
      if (current !== latest) {
        await clearAndUpate()
        setHasUpdate(true)
      }
    }, 2500)
  }, [])

  if (!version) return null
  return (
    <div className={styles['version']}>
      <img className={styles['icon']} src="./srt-player.svg" />
      <span className={styles['text']} onClick={click5Times.click.bind(click5Times)}>
        {i18n('footer.current_version')}: {version}
      </span>
      {hasUpdate && (
        <span
          className={styles['update']}
          onClick={async () => {
            const update = await confirm(i18n('confirm.reload_update'))
            if (update) {
              location.reload()
            }
          }}
        >
          {i18n('footer.update')}
        </span>
      )}
    </div>
  )
}

export const Footer: FC = () => {
  return (
    <div className={styles['footer']}>
      <Version />
      <a className={styles['copy-right']} href="https://github.com/Shenmin-Z/srt-player" target="_blank">
        <img src="./github.png" />
        Github
      </a>
    </div>
  )
}
