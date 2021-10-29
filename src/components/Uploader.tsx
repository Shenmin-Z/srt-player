import { useState, useEffect } from 'react'
import styles from './Uploader.module.less'
import { uploadFiles, useDispatch } from '../state'

const fileInput = () => document.querySelector('#file-input') as HTMLInputElement

export let Uploader = () => {
  let dispatch = useDispatch()

  let [isUTF8, setIsUTF8] = useState(true)
  let [encoding, setEncoding] = useState('UTF-8')

  useEffect(() => {
    setEncoding(isUTF8 ? 'UTF-8' : encodingList[0])
  }, [isUTF8])

  return (
    <>
      <div
        className={styles['uploader']}
        onClick={() => {
          fileInput().click()
        }}
      >
        Upload
        <input
          type="file"
          id="file-input"
          accept=".srt"
          multiple
          onChange={() => {
            let { files } = fileInput()
            if (files) {
              dispatch(uploadFiles({ files, encoding }))
            }
          }}
        />
      </div>
      <div className={styles['label']}>
        <label htmlFor="not-utf-8">
          <input
            type="checkbox"
            id="not-utf-8"
            checked={!isUTF8}
            onChange={e => {
              setIsUTF8(!e.target.checked)
            }}
          />
          It's not UTF-8
        </label>
      </div>
      <div className={styles['label']} style={{ visibility: isUTF8 ? 'hidden' : 'visible', marginBottom: 10 }}>
        <label htmlFor="encoding">It's</label>
        <select
          id="encoding"
          onChange={e => {
            setEncoding(e.target.value)
          }}
          value={encoding}
        >
          {encodingList.map(i => (
            <option value={i} key={i}>
              {i}
            </option>
          ))}
        </select>
      </div>
    </>
  )
}

const encodingList = [
  'ISO-8859-1',
  'Windows-1251',
  'Windows-1252',
  'GB2312',
  'Shift',
  'GBK',
  'EUC-KR',
  'ISO-8859-9',
  'Windows-1254',
  'EUC-JP',
  'Big5',
]
