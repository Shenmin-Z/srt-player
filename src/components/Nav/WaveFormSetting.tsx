import { FC, useEffect, useState } from 'react'
import { useSelector, useDispatch, getVideo, updateEnableWaveForm } from '../../state'
import { computeAudioSampling, doVideoWithDefault, deleteSampling, useI18n } from '../../utils'
import { Modal } from '../Modal'
import styles from './Nav.module.less'
import SamplingWorker from '../../web-workers/sampling?worker&inline'

export const WaveForm: FC<{ show: boolean; onClose: () => void }> = props => {
  const dispatch = useDispatch()
  const i18n = useI18n()
  const file = useSelector(s => s.files.selected)
  const enableWaveForm = useSelector(s => s.settings.waveform)
  const [loading, setLoading] = useState(false)
  const videoDuation = doVideoWithDefault(video => video.duration, 0)
  const [checkbox, setCheckbox] = useState<string | undefined>(undefined)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (!props.show) {
      setCheckbox(undefined)
    }
    if (enableWaveForm) {
      setCheckbox('a2')
    } else {
      setCheckbox('b1')
    }
  }, [props.show])

  if (checkbox === undefined) return null
  if (checkbox.startsWith('a')) {
    return (
      <Modal {...props} width={500} title={i18n('nav.waveform.name')}>
        <div>
          <div className={styles['waveform-option']}>
            <input
              type="radio"
              checked={checkbox === 'b1'}
              onChange={e => {
                if (!e.target.checked) return
                deleteSampling(file as string)
                setCheckbox('b1')
                dispatch(updateEnableWaveForm({ file: file as string, enable: false }))
              }}
            />
            <label>{i18n('nav.waveform.disable')}</label>
          </div>
          <div className={styles['waveform-option']}>
            <input checked={checkbox === 'a2'} onChange={() => {}} type="radio" />
            <label>{i18n('nav.waveform.enable')}</label>
          </div>
        </div>
      </Modal>
    )
  }
  return (
    <Modal {...props} width={500} title={i18n('nav.waveform.name')}>
      <div>
        <div className={styles['waveform-option']}>
          <input
            checked={checkbox === 'b1'}
            disabled={loading}
            type="radio"
            onChange={e => {
              if (!e.target.checked) return
              setErrorMsg('')
              deleteSampling(file as string)
              setCheckbox('b1')
              dispatch(updateEnableWaveForm({ file: file as string, enable: false }))
            }}
          />
          <label>{i18n('nav.waveform.disable')}</label>
        </div>
        <div className={styles['waveform-option']}>
          <input
            disabled={loading}
            checked={checkbox === 'b2'}
            type="radio"
            onChange={async e => {
              try {
                setCheckbox('b2')
                if (!e.target.checked) return
                setErrorMsg('')
                setLoading(true)
                const videoFile = await getVideo(file as string)
                if (!videoFile) return
                const worker = new SamplingWorker()
                await computeAudioSampling(worker, videoFile)
                dispatch(updateEnableWaveForm({ file: file as string, enable: true }))
              } catch (e) {
                setErrorMsg(e + '')
                setCheckbox('b1')
              } finally {
                setLoading(false)
              }
            }}
          />
          <label>{i18n('nav.waveform.enable_with_video')}</label>
        </div>
        <div className={styles['waveform-option']}>
          <input
            disabled={loading}
            checked={checkbox === 'b3'}
            type="radio"
            onChange={async e => {
              try {
                setCheckbox('b3')
                setLoading(true)
                if (!e.target.checked) return
                setErrorMsg('')
                const handles = await showOpenFilePicker({
                  id: 'audio-file-for-waveform',
                  types: [
                    {
                      description: 'Audio',
                      accept: {
                        'audio/*': ['.aac', '.mp3', '.wav'],
                      },
                    },
                  ],
                } as OpenFilePickerOptions)
                const audioFile = await handles[0].getFile()
                if (!audioFile) return
                const worker = new SamplingWorker()
                await computeAudioSampling(worker, audioFile, file as string)
                dispatch(updateEnableWaveForm({ file: file as string, enable: true }))
              } catch (e) {
                setErrorMsg(e + '')
                setCheckbox('b1')
              } finally {
                setLoading(false)
              }
            }}
          />
          <label>{i18n('nav.waveform.enable_with_audio')}</label>
        </div>
      </div>
      {loading && (
        <div className={styles['waveform-loading']}>
          <span className="material-icons">sync</span>
          Re-sampling, this could take a while...
        </div>
      )}
      {errorMsg && <div className={styles['waveform-error-message']}>{errorMsg}</div>}
    </Modal>
  )
}
