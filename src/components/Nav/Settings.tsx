import { FC, useEffect } from 'react'
import {
  useSelector,
  useDispatch,
  updateLayout,
  updateDictionaryWidth,
  updateDictionaryUrl,
  updateSubtitleWidth,
  updateDictionaryLeftOffset,
  updateSubtitleAuto,
  updateSubtitleDelay,
} from '../../state'
import { Modal } from '../Modal'
import { NumberInput, TextInput } from './form'
import { useI18n } from '../../utils'
import styles from './Nav.module.less'

export const Settings: FC<{ show: boolean; onClose: () => void }> = props => {
  const settings = useSelector(s => s.settings)
  const file = useSelector(s => s.files.selected) as string
  const { layout, subtitleAuto } = settings
  const dispatch = useDispatch()
  const i18n = useI18n()

  useEffect(() => {
    if (props.show) {
      window.enableShortcuts = false
    } else {
      window.enableShortcuts = true
    }
  }, [props.show, settings.layout])

  return (
    <Modal {...props} title={i18n('nav.settings.name')}>
      <div className={styles['settings']}>
        <div className={styles['title']}>{i18n('nav.settings.enable_dictionary')}</div>
        <div className={styles['body']}>
          <input
            type="checkbox"
            checked={layout === '3col'}
            onChange={e => {
              dispatch(updateLayout(e.target.checked ? '3col' : '2col'))
            }}
          />
        </div>
        {layout === '3col' && (
          <>
            <div className={styles['title']}>{i18n('nav.settings.dictionary_width')}</div>
            <div className={styles['body']}>
              <NumberInput
                value={settings.dictionaryWidth}
                onChange={v => {
                  dispatch(updateDictionaryWidth(v))
                }}
              />
            </div>
            <div className={styles['title']}>{i18n('nav.settings.dictionary_url')}</div>
            <div className={styles['body']}>
              <TextInput
                value={settings.dictionaryUrl}
                onChange={url => {
                  dispatch(updateDictionaryUrl(url))
                }}
              />
            </div>
            <div className={styles['title']}>{i18n('nav.settings.dictionary_left_offset')}</div>
            <div className={styles['body']}>
              <NumberInput
                value={settings.dictionaryLeftOffset}
                onChange={v => {
                  dispatch(updateDictionaryLeftOffset(v))
                }}
              />
            </div>
          </>
        )}
        <div className={styles['br']} />
        <div className={styles['title']}>{i18n('nav.settings.subtitle_width')}</div>
        <div className={styles['body']}>
          <NumberInput
            value={settings.subtitleWidth}
            onChange={v => {
              dispatch(updateSubtitleWidth(v))
            }}
          />
        </div>
        <div className={styles['br']} />
        <div className={styles['title']}>{i18n('nav.settings.auto_subtitle')}</div>
        <div className={styles['body']}>
          <input
            type="checkbox"
            checked={subtitleAuto}
            onChange={() => {
              dispatch(updateSubtitleAuto({ file }))
            }}
          />
        </div>
        {subtitleAuto && (
          <>
            <div className={styles['title']}>{i18n('nav.settings.subtitle_delay')}</div>
            <div className={styles['body']}>
              <NumberInput
                value={settings.subtitleDelay / 1000}
                onChange={v => {
                  dispatch(updateSubtitleDelay({ file, delay: Math.round(v * 1000) }))
                }}
                isFloat
              />
            </div>
          </>
        )}
      </div>
    </Modal>
  )
}
