import { FC } from 'react'
import { Modal } from '../Modal'
import styles from './Nav.module.less'
import { useI18n } from '../../utils'

export const Info: FC<{ show: boolean; onClose: () => void }> = props => {
  const i18n = useI18n()

  return (
    <Modal {...props} title={i18n('nav.info.name')}>
      <div className={styles['4cols']}>
        <div className="column">
          <div className="column-title">{i18n('nav.info.settings.name')}</div>
          <div className={styles['info']}>
            <div className={styles['title']}>Esc</div>
            <div className={styles['body']}>{i18n('nav.info.settings.toggle_settings')}</div>
            <div className={styles['title']}>D</div>
            <div className={styles['body']}>{i18n('nav.info.settings.toggle_dictionary')}</div>
            <div className={styles['title']}>I</div>
            <div className={styles['body']}>{i18n('nav.info.settings.toggle_shortcuts_dialog')}</div>
          </div>
        </div>
        <div className="column">
          <div className="column-title">{i18n('nav.info.video.name')}</div>
          <div className={styles['info']}>
            <div className={styles['title']}>Space</div>
            <div className={styles['body']}>{i18n('nav.info.video.play_pause')}</div>
            <div className={styles['title']}>
              <span className="material-icons">arrow_back</span>
            </div>
            <div className={styles['body']}>{i18n('nav.info.video.back_10_seconds')}</div>
            <div className={styles['title']}>
              Shfit +<span className="material-icons">arrow_back</span>
            </div>
            <div className={styles['body']}>{i18n('nav.info.video.back_3_seconds')}</div>
            <div className={styles['title']}>
              <span className="material-icons">arrow_forward</span>
            </div>
            <div className={styles['body']}>{i18n('nav.info.video.forward_10_seconds')}</div>
            <div className={styles['title']}>
              Shfit +<span className="material-icons">arrow_forward</span>
            </div>
            <div className={styles['body']}>{i18n('nav.info.video.forward_3_seconds')}</div>
          </div>
        </div>
        <div className="column">
          <div className="column-title">{i18n('nav.info.subtitle.name')}</div>
          <div className={styles['info']}>
            <div className={styles['title']}>
              <span className="material-icons">arrow_upward</span>
            </div>
            <div className={styles['body']}>{i18n('nav.info.subtitle.page_up')}</div>
            <div className={styles['title']}>
              <span className="material-icons">arrow_downward</span>
            </div>
            <div className={styles['body']}>{i18n('nav.info.subtitle.page_down')}</div>
            <div className={styles['title']}>A</div>
            <div className={styles['body']}>{i18n('nav.info.subtitle.toggle_auto')}</div>
            <div className={styles['title']}>Ctrl + click</div>
            <div className={styles['body']}>{i18n('nav.info.subtitle.adjust_delay')}</div>
          </div>
        </div>
        <div className="column">
          <div className="column-title">{i18n('nav.info.waveform.name')}</div>
          <div className={styles['info']}>
            <div className={styles['title']}>R</div>
            <div className={styles['body']}>{i18n('nav.info.waveform.replay')}</div>
            <div className={styles['title']}>,</div>
            <div className={styles['body']}>{i18n('nav.info.waveform.replay_position_left')}</div>
            <div className={styles['title']}>{'<'}</div>
            <div className={styles['body']}>{i18n('nav.info.waveform.replay_position_left_quicker')}</div>
            <div className={styles['title']}>.</div>
            <div className={styles['body']}>{i18n('nav.info.waveform.replay_position_right')}</div>
            <div className={styles['title']}>{'>'}</div>
            <div className={styles['body']}>{i18n('nav.info.waveform.replay_position_right_quicker')}</div>
            <div className={styles['title']}>/</div>
            <div className={styles['body']}>{i18n('nav.info.waveform.replay_position_at_current_time')}</div>
          </div>
        </div>
      </div>
    </Modal>
  )
}
