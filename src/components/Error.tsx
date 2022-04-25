import { FC } from 'react'
import styles from './Error.module.less'

interface Props {
  main: string
  secondary?: string
}

export const Error: FC<Props> = props => {
  const { main, secondary } = props
  return (
    <div className={styles['container']}>
      <div className={styles['content']}>
        <div className="material-icons-outlined">error</div>
        <div className={styles['main']}>{main}</div>
        {secondary && <div className={styles['secondary']}>{secondary}</div>}
      </div>
    </div>
  )
}
