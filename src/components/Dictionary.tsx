import styles from './Dictionary.module.less'
import { useSelector } from '../state'

export let Dictionary = () => {
  let url = useSelector(s => s.settings.dictionaryUrl)
  return <iframe id="dictionary-iframe" src={url} className={styles['dictionary']} />
}
