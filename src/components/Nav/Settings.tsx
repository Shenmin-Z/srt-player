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
import styles from './Nav.module.less'

export const Settings: FC<{ show: boolean; onClose: () => void }> = props => {
  const settings = useSelector(s => s.settings)
  const file = useSelector(s => s.files.selected) as string
  const { layout, subtitleAuto } = settings

  const dispatch = useDispatch()

  useEffect(() => {
    if (props.show) {
      window.enableShortcuts = false
    } else {
      window.enableShortcuts = true
    }
  }, [props.show, settings.layout])

  return (
    <Modal {...props} title="Settings">
      <div className={styles['settings']}>
        <div className={styles['title']}>Enable dictionary</div>
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
            <div className={styles['title']}>Dictionary width</div>
            <div className={styles['body']}>
              <NumberInput
                value={settings.dictionaryWidth}
                onChange={v => {
                  dispatch(updateDictionaryWidth(v))
                }}
              />
            </div>
            <div className={styles['title']}>Dictionary URL</div>
            <div className={styles['body']}>
              <TextInput
                value={settings.dictionaryUrl}
                onChange={url => {
                  dispatch(updateDictionaryUrl(url))
                }}
              />
            </div>
            <div className={styles['title']}>Dictionary Left Offset</div>
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
        <div className={styles['title']}>Subtitle width</div>
        <div className={styles['body']}>
          <NumberInput
            value={settings.subtitleWidth}
            onChange={v => {
              dispatch(updateSubtitleWidth(v))
            }}
          />
        </div>
        <div className={styles['br']} />
        <div className={styles['title']}>Auto subtitle</div>
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
            <div className={styles['title']}>Subtitle delay</div>
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
