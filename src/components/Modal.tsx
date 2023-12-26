import { FC, ReactNode, useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Subject, useI18n } from '../utils'
import styles from './Modal.module.less'
import cn from 'classnames'

interface ModalProps {
  width?: number
  title?: string
  hideHeader?: boolean
  show: boolean
  onClose: () => void
  children?: ReactNode
  className?: string
  disableShortcuts?: boolean
}

export const Modal: FC<ModalProps> = ({
  width,
  show,
  onClose,
  title,
  hideHeader,
  children,
  className,
  disableShortcuts: disableShortcutWhenShown,
}) => {
  useEffect(() => {
    if (!disableShortcutWhenShown) return
    if (show) {
      window.__SRT_ENABLE_SHORTCUTS__ = false
    } else {
      window.__SRT_ENABLE_SHORTCUTS__ = true
    }
    return () => {
      window.__SRT_ENABLE_SHORTCUTS__ = true
    }
  }, [show])

  if (!show) return null
  return createPortal(
    <div
      className={cn(styles['modal-container'], className)}
      onClick={e => {
        e.stopPropagation()
      }}
    >
      <div className={cn('modal-mask', styles['mask'])} onClick={onClose} />
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
        <div className={styles['body']}>
          <div className={styles['padding']}>{children}</div>
        </div>
      </div>
    </div>,
    document.body,
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
  const i18n = useI18n()
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
        <div className={styles['text']} dangerouslySetInnerHTML={{ __html: text }} />
        <div className={styles['buttons']}>
          <button className={styles['ok']} onClick={onClose}>
            {i18n('message.ok')}
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
  const i18n = useI18n()
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
            {i18n('confirm.ok')}
          </button>
          <button className={styles['cancel']} onClick={onClick(false)}>
            {i18n('confirm.cancel')}
          </button>
        </div>
      </div>
    </Modal>
  )
}
