import { FC, useState } from 'react'
import { useSelector, useDispatch, updateLanguage } from '../state'
import styles from './Language.module.less'

const LANGUAGES = [
  { type: 'en-US', name: 'English' },
  { type: 'zh-CN', name: '中文' },
]

export const Language: FC = () => {
  const [show, setShow] = useState(false)
  const language = useSelector(s => s.settings.locale)
  const dispath = useDispatch()

  return (
    <div className={styles['language']}>
      <span
        className="material-icons"
        onClick={() => {
          setShow(true)
        }}
      >
        translate
      </span>
      {show && (
        <>
          <div
            className={styles['mask']}
            onClick={() => {
              setShow(false)
            }}
          />
          <div className={styles['tooltip']}>
            {LANGUAGES.map(i => (
              <div
                key={i.type}
                className={language === i.type ? 'active' : ''}
                onClick={() => {
                  dispath(updateLanguage(i.type))
                  setShow(false)
                }}
              >
                <span className="material-icons">check_circle</span>
                {i.name}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
