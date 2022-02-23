import { FC, useState, useEffect } from 'react'
import { useI18n } from '../utils'
import { confirm } from './Modal'
import styles from './Footer.module.less'

const BASE = '/srt-player/'

async function getLatestVersion() {
  const randomNumber = Math.ceil(Math.random() * Math.pow(10, 10))
  const url = `${BASE}version.js?bypassCache=${randomNumber}`
  const latest = (await (await fetch(url)).text()).trim()
  const match = (latest || '').match(/__SRT_VERSION__\s?=\s?('(.*)'|"(.*)")/)
  return match?.[2] || match?.[3] || '0'
}

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
  const [hasUpdate, setHasUpdate] = useState(false)
  const i18n = useI18n()

  useEffect(() => {
    ;(async () => {
      const latest = await getLatestVersion()
      if (window.__SRT_VERSION__ !== latest) {
        await clearAndUpate()
        setHasUpdate(true)
      }
    })()
  }, [])

  if (!window.__SRT_VERSION__) return null
  return (
    <div className={styles['version']}>
      <img className={styles['icon']} src="./srt-player.svg" />
      <span className={styles['text']} onClick={click5Times.click.bind(click5Times)}>
        {i18n('footer.current_version')}: {window.__SRT_VERSION__}
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
