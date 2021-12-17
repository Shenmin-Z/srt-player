import { FC } from 'react'
import { Modal } from '../Modal'
import styles from './Nav.module.less'

export const Info: FC<{ show: boolean; onClose: () => void }> = props => {
  return (
    <Modal {...props} title="Shortcuts">
      <div className={styles['4cols']}>
        <div className="column">
          <div className="column-title">Settings</div>
          <div className={styles['info']}>
            <div className={styles['title']}>Esc</div>
            <div className={styles['body']}>Toggle settings</div>
            <div className={styles['title']}>D</div>
            <div className={styles['body']}>Toggle dictionary</div>
            <div className={styles['title']}>I</div>
            <div className={styles['body']}>Toggle shortcuts information</div>
          </div>
        </div>
        <div className="column">
          <div className="column-title">Video</div>
          <div className={styles['info']}>
            <div className={styles['title']}>Space</div>
            <div className={styles['body']}>Play / Pasue</div>
            <div className={styles['title']}>
              <span className="material-icons">arrow_back</span>
            </div>
            <div className={styles['body']}>-10s</div>
            <div className={styles['title']}>
              Shfit +<span className="material-icons">arrow_back</span>
            </div>
            <div className={styles['body']}>-3s</div>
            <div className={styles['title']}>
              <span className="material-icons">arrow_forward</span>
            </div>
            <div className={styles['body']}>+10s</div>
            <div className={styles['title']}>
              Shfit +<span className="material-icons">arrow_forward</span>
            </div>
            <div className={styles['body']}>+3s</div>
          </div>
        </div>
        <div className="column">
          <div className="column-title">Subtitle</div>
          <div className={styles['info']}>
            <div className={styles['title']}>
              <span className="material-icons">arrow_upward</span>
            </div>
            <div className={styles['body']}>Pageup</div>
            <div className={styles['title']}>
              <span className="material-icons">arrow_downward</span>
            </div>
            <div className={styles['body']}>Pagedown</div>
            <div className={styles['title']}>A</div>
            <div className={styles['body']}>Toggle auto</div>
            <div className={styles['title']}>Ctrl + click</div>
            <div className={styles['body']}>Adjust delay</div>
          </div>
        </div>
        <div className="column">
          <div className="column-title">Wave Form</div>
          <div className={styles['info']}>
            <div className={styles['title']}>R</div>
            <div className={styles['body']}>Replay</div>
            <div className={styles['title']}>,</div>
            <div className={styles['body']}>Replay position left (slow)</div>
            <div className={styles['title']}>{'<'}</div>
            <div className={styles['body']}>Replay position left (quick)</div>
            <div className={styles['title']}>.</div>
            <div className={styles['body']}>Replay position right (slow)</div>
            <div className={styles['title']}>{'>'}</div>
            <div className={styles['body']}>Replay position right (quick)</div>
            <div className={styles['title']}>/</div>
            <div className={styles['body']}>Replay position at current time</div>
          </div>
        </div>
      </div>
    </Modal>
  )
}
