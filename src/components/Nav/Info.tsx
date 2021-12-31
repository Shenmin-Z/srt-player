import { FC } from 'react'
import { Modal } from '../Modal'
import styles from './Nav.module.less'
import { useI18n } from '../../utils'

export const Info: FC<{ show: boolean; onClose: () => void }> = props => {
  const i18n = useI18n()

  return (
    <Modal {...props} title={i18n('nav.info.name')}>
      <div className={styles['3cols']}>
        <div className="column">
          <div className="column-title">{i18n('nav.info.video.name')}</div>
          <div className={styles['info']}>
            <div className={styles['title']}>
              <span className={styles['key']}>Space</span>
            </div>
            <div className={styles['body']}>{i18n('nav.info.video.play_pause')}</div>
            <div className={styles['title']}>
              <span className={styles['key']}>
                <span className="material-icons">arrow_back</span>
              </span>
            </div>
            <div className={styles['body']}>{i18n('nav.info.video.back_10_seconds')}</div>
            <div className={styles['title']}>
              <span className={styles['key']}>Shfit</span>
              <span className={styles['key']}>
                <span className="material-icons">arrow_back</span>
              </span>
            </div>
            <div className={styles['body']}>{i18n('nav.info.video.back_3_seconds')}</div>
            <div className={styles['title']}>
              <span className={styles['key']}>
                <span className="material-icons">arrow_forward</span>
              </span>
            </div>
            <div className={styles['body']}>{i18n('nav.info.video.forward_10_seconds')}</div>
            <div className={styles['title']}>
              <span className={styles['key']}>Shfit</span>
              <span className={styles['key']}>
                <span className="material-icons">arrow_forward</span>
              </span>
            </div>
            <div className={styles['body']}>{i18n('nav.info.video.forward_3_seconds')}</div>
          </div>
        </div>
        <div className="column">
          <div className="column-title">{i18n('nav.info.subtitle.name')}</div>
          <div className={styles['info']}>
            <div className={styles['title']}>
              <span className={styles['key']}>
                <span className="material-icons">arrow_upward</span>
              </span>
            </div>
            <div className={styles['body']}>{i18n('nav.info.subtitle.page_up')}</div>
            <div className={styles['title']}>
              <span className={styles['key']}>
                <span className="material-icons">arrow_downward</span>
              </span>
            </div>
            <div className={styles['body']}>{i18n('nav.info.subtitle.page_down')}</div>

            <div className={styles['title']}>
              <span className={styles['key']}>+</span>
            </div>
            <div className={styles['body']}>{i18n('nav.info.subtitle.font_up')}</div>
            <div className={styles['title']}>
              <span className={styles['key']}>-</span>
            </div>
            <div className={styles['body']}>{i18n('nav.info.subtitle.font_down')}</div>

            <div className={styles['title']}>
              <span className={styles['key']}>A</span>
            </div>
            <div className={styles['body']}>{i18n('nav.info.subtitle.toggle_auto')}</div>
            <div className={styles['title']}>
              <span className={styles['key']}>S</span>
            </div>
            <div className={styles['body']}>{i18n('nav.info.subtitle.toggle_settings')}</div>

            <div className={styles['title']}>
              <span className={styles['right-click']}>{i18n('nav.info.subtitle.right_click')}</span>
            </div>
            <div className={styles['body']}>{i18n('nav.info.subtitle.adjust_delay')}</div>
          </div>
        </div>
        <div className="column">
          <div className="column-title">{i18n('nav.info.waveform.name')}</div>
          <div className={styles['info']}>
            <div className={styles['title']}>
              <span className={styles['key']}>W</span>
            </div>
            <div className={styles['body']}>{i18n('nav.info.waveform.toggle_settings')}</div>
            <div className={styles['title']}>
              <span className={styles['key']}>R</span>
            </div>
            <div className={styles['body']}>{i18n('nav.info.waveform.replay')}</div>
            <div className={styles['title']}>
              <span className={styles['key']}>,</span>
            </div>
            <div className={styles['body']}>{i18n('nav.info.waveform.replay_position_left')}</div>
            <div className={styles['title']}>
              <span className={styles['key']}>{'<'}</span>
            </div>
            <div className={styles['body']}>{i18n('nav.info.waveform.replay_position_left_quicker')}</div>
            <div className={styles['title']}>
              <span className={styles['key']}>.</span>
            </div>
            <div className={styles['body']}>{i18n('nav.info.waveform.replay_position_right')}</div>
            <div className={styles['title']}>
              <span className={styles['key']}>{'>'}</span>
            </div>
            <div className={styles['body']}>{i18n('nav.info.waveform.replay_position_right_quicker')}</div>
            <div className={styles['title']}>
              <span className={styles['key']}>/</span>
            </div>
            <div className={styles['body']}>{i18n('nav.info.waveform.replay_position_at_current_time')}</div>
          </div>
        </div>
      </div>
    </Modal>
  )
}
