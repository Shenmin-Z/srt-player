import styles from './Dictionary.module.less'
import { DictionaryUrl } from '../utils'

export let Dictionary = () => {
  return <iframe id="dictionary-iframe" src={DictionaryUrl.get() as string} className={styles['dictionary']} />
}
