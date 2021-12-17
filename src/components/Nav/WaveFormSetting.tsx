import { FC, useEffect, useState } from 'react'
import { useSelector, useDispatch, getVideo, updateEnableWaveForm } from '../../state'
import { computeAudioSampling, doVideoWithDefault, deleteSampling } from '../../utils'
import { Modal } from '../Modal'
import styles from './Nav.module.less'
import SamplingWorker from '../../web-workers/sampling?worker&inline'

export const WaveForm: FC<{ show: boolean; onClose: () => void }> = props => {
  const dispatch = useDispatch()
  const file = useSelector(s => s.files.selected)
  const enableWaveForm = useSelector(s => s.settings.waveform)
  const [loading, setLoading] = useState(false)
  const [duration, setDuration] = useState(-1)
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
      <Modal {...props} width={500} title="WaveForm">
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
            <label>Disable</label>
          </div>
          <div className={styles['waveform-option']}>
            <input checked={checkbox === 'a2'} onChange={() => {}} type="radio" />
            <label>Enable</label>
          </div>
        </div>
      </Modal>
    )
  }
  return (
    <Modal {...props} width={500} title="WaveForm">
      <div>
        <div className={styles['waveform-option']}>
          <input
            checked={checkbox === 'b1'}
            disabled={loading}
            type="radio"
            onChange={e => {
              if (!e.target.checked) return
              setErrorMsg('')
              setDuration(-1)
              deleteSampling(file as string)
              setCheckbox('b1')
              dispatch(updateEnableWaveForm({ file: file as string, enable: false }))
            }}
          />
          <label>Disable</label>
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
                setDuration(await computeAudioSampling(worker, videoFile))
                dispatch(updateEnableWaveForm({ file: file as string, enable: true }))
              } catch (e) {
                setErrorMsg(e + '')
                setCheckbox('b1')
              } finally {
                setLoading(false)
              }
            }}
          />
          <label>Enable using exsiting video file</label>
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
                setDuration(await computeAudioSampling(worker, audioFile, file as string))
                dispatch(updateEnableWaveForm({ file: file as string, enable: true }))
              } catch (e) {
                setErrorMsg(e + '')
                setCheckbox('b1')
              } finally {
                setLoading(false)
              }
            }}
          />
          <label>Enable using extra audio file</label>
        </div>
      </div>
      {loading && (
        <div className={styles['waveform-loading']}>
          <span className="material-icons">sync</span>
          Re-sampling, this could take a while...
        </div>
      )}
      {errorMsg && <div className={styles['waveform-error-message']}>{errorMsg}</div>}
      {duration > 0 && (
        <div className={styles['waveform-report']}>
          <p className={styles['title']}>Re-sampling done.</p>
          <p className={styles['subtitle']}>
            If the following 2 results differs then the waveform would not be accurate. This is likely to occur when
            directly using video file, try extract audio from the video file using other software and use that audio.
          </p>
          <p>
            Original video duration: <span className={styles['result']}>{videoDuation.toFixed(2)}</span> seconds
          </p>
          <p>
            Re-sampled audio duration: <span className={styles['result']}>{duration.toFixed(2)}</span> seconds
          </p>
        </div>
      )}
    </Modal>
  )
}
