import { FC, useEffect } from 'react'
import {
  useSelector,
  useDispatch,
  updateSubtitleWidth,
  updateSubtitleFontSize,
  updateSubtitleAuto,
  updateSubtitleDelay,
} from '../../state'
import { Modal } from '../Modal'
import { NumberInput } from './form'
import { useI18n } from '../../utils'
import styles from './Nav.module.less'

export const SubtitleSetting: FC<{ show: boolean; onClose: () => void }> = props => {
  const settings = useSelector(s => s.settings)
  const file = useSelector(s => s.files.selected) as string
  const { subtitleAuto } = settings
  const dispatch = useDispatch()
  const i18n = useI18n()

  useEffect(() => {
    if (props.show) {
      window.__SRT_ENABLE_SHORTCUTS__ = false
    } else {
      window.__SRT_ENABLE_SHORTCUTS__ = true
    }
  }, [props.show])

  return (
    <Modal {...props} title={i18n('nav.subtitle.name')}>
      <div className={styles['settings']}>
        <div className={styles['title']}>{i18n('nav.subtitle.width')}</div>
        <div className={styles['body']}>
          <NumberInput
            value={settings.subtitleWidth}
            onChange={v => {
              dispatch(updateSubtitleWidth(v))
            }}
          />
        </div>
        <div className={styles['title']}>{i18n('nav.subtitle.font_size')}</div>
        <div className={styles['body']}>
          <NumberInput
            value={settings.subtitleFontSize}
            onChange={v => {
              dispatch(updateSubtitleFontSize(v))
            }}
          />
        </div>
        <label htmlFor="subtitle-settings-auto" className={styles['title']} style={{ cursor: 'pointer' }}>
          {i18n('nav.subtitle.auto')}
        </label>
        <div className={styles['body']}>
          <input
            id="subtitle-settings-auto"
            type="checkbox"
            checked={subtitleAuto}
            onChange={() => {
              dispatch(updateSubtitleAuto({ file }))
            }}
          />
        </div>
        <div className={styles['title']}>{i18n('nav.subtitle.delay')}</div>
        <div className={styles['body']}>
          <NumberInput
            value={settings.subtitleDelay / 1000}
            onChange={v => {
              dispatch(updateSubtitleDelay({ file, delay: Math.round(v * 1000) }))
            }}
            isFloat
          />
          <span
            className="material-icons clear"
            onClick={() => {
              dispatch(updateSubtitleDelay({ file, delay: 0 }))
            }}
          >
            cancel
          </span>
        </div>
      </div>
    </Modal>
  )
}
