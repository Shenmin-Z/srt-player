import { FC } from 'react'
import styles from './Modal.module.less'
import cn from 'classnames'

interface ModalProps {
  width?: number
  title?: string
  show: boolean
  onClose: () => void
}

export let Modal: FC<ModalProps> = ({ width, show, onClose, title, children }) => {
  return (
    <div className={styles['modal-container']} style={{ display: show ? undefined : 'none' }}>
      <div className={styles['mask']} onClick={onClose} />
      <div className={styles['modal']} style={{ width }}>
        <div className={styles['header']}>
          <span className={styles['title']}>{title}</span>
          <span />
          <span className={cn('material-icons', styles['icon'])} onClick={onClose}>
            close
          </span>
        </div>
        <div className={styles['body']}>{children}</div>
      </div>
    </div>
  )
}
