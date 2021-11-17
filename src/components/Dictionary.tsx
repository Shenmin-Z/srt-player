import { useState, useEffect } from 'react'
import styles from './Dictionary.module.less'
import { useSelector } from '../state'

export let Dictionary = () => {
  let url = useSelector(s => s.settings.dictionaryUrl)
  let layout = useSelector(s => s.settings.layout)
  let [load, setLoad] = useState(layout === '3col')
  useEffect(() => {
    if (layout === '3col') {
      setLoad(true)
    }
  }, [layout])

  return load ? <iframe id="dictionary-iframe" src={url} className={styles['dictionary']} /> : <div />
}
