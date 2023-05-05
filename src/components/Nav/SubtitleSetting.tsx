import { FC, useEffect } from 'react'
import cn from 'classnames'
import {
  useSelector,
  useDispatch,
  updateSubtitleWidth,
  updateSubtitleFontSize,
  updateSubtitleAuto,
  updateSubtitleDelay,
  updateSubtitleListeningMode,
  toggleSubtitleShowCN,
} from '../../state'
import { Modal } from '../Modal'
import { NumberInput } from './form'
import { useI18n, Languages } from '../../utils'
import styles from './Nav.module.less'

export const SubtitleSetting: FC<{ show: boolean; onClose: () => void }> = props => {
  const settings = useSelector(s => s.settings)
  const file = useSelector(s => s.files.selected) as string
  const { subtitleAuto, subtitleListeningMode, subtitleLanguagesHided } = settings
  const isCNHided = subtitleLanguagesHided.includes(Languages.CN)
  const dispatch = useDispatch()
  const i18n = useI18n()

  return (
    <Modal {...props} title={i18n('nav.subtitle.name')} disableShortcuts>
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
        <label
          className={styles['title']}
          style={{ cursor: 'pointer' }}
          onClick={() => {
            dispatch(updateSubtitleAuto({ file }))
          }}
        >
          {i18n('nav.subtitle.auto')}
        </label>
        <div className={styles['body']}>
          <span
            className={cn('material-icons', 'checkbox', { checked: subtitleAuto })}
            onClick={() => {
              dispatch(updateSubtitleAuto({ file }))
            }}
          >
            {subtitleAuto ? 'check_box' : 'check_box_outline_blank'}
          </span>
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
        <label
          className={styles['title']}
          style={{ cursor: 'pointer' }}
          onClick={() => {
            dispatch(updateSubtitleListeningMode({ file }))
          }}
        >
          {i18n('nav.subtitle.listening_mode')}
        </label>
        <div className={styles['body']}>
          <span
            className={cn('material-icons', 'checkbox', { checked: subtitleListeningMode })}
            onClick={() => {
              dispatch(updateSubtitleListeningMode({ file }))
            }}
          >
            {subtitleListeningMode ? 'check_box' : 'check_box_outline_blank'}
          </span>
        </div>
        <label
          className={styles['title']}
          style={{ cursor: 'pointer' }}
          onClick={() => {
            dispatch(toggleSubtitleShowCN({ file }))
          }}
        >
          {i18n('nav.subtitle.hide_chinese')}
        </label>
        <div className={styles['body']}>
          <span
            className={cn('material-icons', 'checkbox', { checked: isCNHided })}
            onClick={() => {
              dispatch(toggleSubtitleShowCN({ file }))
            }}
          >
            {isCNHided ? 'check_box' : 'check_box_outline_blank'}
          </span>
        </div>
      </div>
    </Modal>
  )
}
