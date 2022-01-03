import { FC, useState, useEffect } from 'react'
import { getCurrentVersion, getLatestVersion, useI18n } from '../utils'
import { confirm } from './Modal'
import styles from './Footer.module.less'

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
        const sw = navigator.serviceWorker.controller
        if (sw) {
          const channel = new MessageChannel()
          sw.postMessage(
            {
              type: 'UPDATE',
            },
            [channel.port2],
          )
          channel.port1.onmessage = () => {
            setHasUpdate(true)
          }
        }
      }
    }, 2500)
  }, [])

  if (!version) return null
  return (
    <div className={styles['version']}>
      <img className={styles['icon']} src="./srt-player.svg" />
      <span className={styles['text']}>
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
