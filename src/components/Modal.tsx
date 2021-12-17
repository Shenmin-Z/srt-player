import { FC, useState, useEffect, useRef } from 'react'
import { Subject } from '../utils'
import styles from './Modal.module.less'
import cn from 'classnames'

interface ModalProps {
  width?: number
  title?: string
  hideHeader?: boolean
  show: boolean
  onClose: () => void
}

export const Modal: FC<ModalProps> = ({ width, show, onClose, title, hideHeader, children }) => {
  return (
    <div className={styles['modal-container']} style={{ display: show ? undefined : 'none' }}>
      <div className={styles['mask']} onClick={onClose} />
      <div className={styles['modal']} style={{ width }}>
        {hideHeader !== true && (
          <div className={styles['header']}>
            <span className={styles['title']}>{title}</span>
            <span />
            <span className={cn('material-icons', styles['icon'])} onClick={onClose}>
              close
            </span>
          </div>
        )}
        <div className={styles['body']}>{children}</div>
      </div>
    </div>
  )
}

const message$ = new Subject<{ text: string; cb: () => void }>()

export const message = (m: string) => {
  return new Promise<void>(resovle => {
    const cb = () => {
      resovle()
    }
    message$.next({ text: m, cb })
  })
}

export const Message: FC = () => {
  const [show, setShow] = useState(false)
  const [text, setText] = useState('')
  const cbRef = useRef<() => void>(() => {})

  useEffect(
    () =>
      message$.subscribe(({ text, cb }) => {
        setShow(true)
        setText(text)
        cbRef.current = cb
      }),
    [],
  )

  const onClose = () => {
    cbRef.current()
    cbRef.current = () => {}
    setShow(false)
    setText('')
  }

  return (
    <Modal show={show} onClose={onClose} hideHeader>
      <div className={styles['message']}>
        <div className={styles['text']}>{text}</div>
        <div className={styles['buttons']}>
          <button className={styles['ok']} onClick={onClose}>
            OK
          </button>
        </div>
      </div>
    </Modal>
  )
}

const confirm$ = new Subject<{ text: string; cb: (ok: boolean) => void }>()

export const confirm = (c: string) => {
  return new Promise<boolean>(resolve => {
    const cb = (ok: boolean) => {
      resolve(ok)
    }
    confirm$.next({ text: c, cb })
  })
}

export const Confirm: FC = () => {
  const [show, setShow] = useState(false)
  const [text, setText] = useState('')
  const cbRef = useRef<(ok: boolean) => void>(() => {})

  useEffect(
    () =>
      confirm$.subscribe(({ text, cb }) => {
        setShow(true)
        setText(text)
        cbRef.current = cb
      }),
    [],
  )

  const onClick = (ok: boolean) => () => {
    cbRef.current(ok)
    cbRef.current = () => {}
    setShow(false)
    setText('')
  }

  return (
    <Modal show={show} onClose={onClick(false)} hideHeader>
      <div className={styles['confirm']}>
        <div className={styles['text']}>{text}</div>
        <div className={styles['buttons']}>
          <button className={styles['ok']} onClick={onClick(true)}>
            OK
          </button>
          <button className={styles['cancel']} onClick={onClick(false)}>
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  )
}
