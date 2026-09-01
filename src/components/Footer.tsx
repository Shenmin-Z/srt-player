import { FC, useState } from 'react'
import { useI18n } from '../utils'
import { Modal } from './Modal'
import styles from './Footer.module.less'

const Feedback: FC = () => {
  const i18n = useI18n()
  const [show, setShow] = useState(false)

  return (
    <div
      className={styles['feedback']}
      onClick={() => {
        setShow(true)
      }}
    >
      <span className="material-icons">bug_report</span>
      {i18n('footer.feedback')}
      <Modal
        title={i18n('footer.feedback')}
        show={show}
        onClose={() => {
          setShow(false)
        }}
        className={styles['modal']}
      >
        <div className={styles['feedback-text']}>{i18n('footer.feedback_email')}</div>
        <div className={styles['email']}>
          <span className="material-icons-outlined">email</span>
          {atob('aac2hlbm1pbnpob3VAZ21haWwuY29t'.substring(2))}
        </div>
        <br />
        <div className={styles['feedback-text']}>{i18n('footer.feedback_video')}</div>
        <div className={styles['video']}>
          <span className="material-icons-outlined">forum</span>
          <a href={i18n('footer.video_url')} target="_blank">
            {i18n('footer.video_url')}
          </a>
        </div>
      </Modal>
    </div>
  )
}

export const Footer: FC = () => {
  return (
    <div className={styles['footer']}>
      <div className={styles['line-2']}>
        <a className={styles['copy-right']} href="https://github.com/Shenmin-Z/srt-player" target="_blank">
          <img src="./github.png" />
          Github
        </a>
        <div className={styles['separate']} />
        <Feedback />
      </div>
    </div>
  )
}
