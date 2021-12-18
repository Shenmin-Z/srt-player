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
    let timeout = 0
    const check = (c: number) => {
      if (c > 3) return
      timeout = setTimeout(async () => {
        const current = await getCurrentVersion()
        const latest = await getLatestVersion()
        if (current === latest) {
          check(c + 1)
        } else {
          console.log(current, latest)
          setHasUpdate(true)
        }
      }, 1500 * c)
    }
    check(1)
    return () => {
      clearTimeout(timeout)
    }
  }, [])

  if (!version) return null
  return (
    <div className={styles['version']}>
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
      <div className={styles['copy-right']}>
        <a className="material-icons" href="https://github.com/Shenmin-Z/srt-player">
          code
        </a>
      </div>
    </div>
  )
}
