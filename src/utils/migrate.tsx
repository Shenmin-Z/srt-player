import { FC, useEffect, useState } from 'react'
import { Error } from '../components/Error'
import { useI18n, INIT_LANG } from './i18n'
import { setGlobalDb, getDB } from './idb'

export const migrate = (FC: FC): FC => {
  return props => {
    const [migrated, setMigrated] = useState<'init' | 'success' | 'failed'>('init')
    const [errorMsg, setErrorMsg] = useState('')
    const i18n = useI18n(INIT_LANG)

    useEffect(() => {
      ;(async () => {
        try {
          setGlobalDb(await getDB())
          setMigrated('success')
        } catch (_e) {
          setMigrated('failed')
          const e = _e as any
          if (typeof e?.toString === 'function') {
            setErrorMsg(e.toString())
          }
        }
      })()
    }, [])

    if (migrated === 'init') return null
    if (migrated === 'success') return <FC {...props} />
    return <Error main={i18n('error.database_initialize')} secondary={errorMsg} />
  }
}
