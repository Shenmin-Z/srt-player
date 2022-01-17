import { FC, useState, useEffect } from 'react'
import { useSelector, useDispatch, updateEnableWaveForm } from '../../state'
import {
  computeAudioSampling,
  doVideoWithDefault,
  useI18n,
  EnableWaveForm,
  StageEnum,
  DurationError,
  getVideo,
} from '../../utils'
import { Modal, message } from '../Modal'
import styles from './Nav.module.less'
import SamplingWorker from '../../web-workers/sampling?worker&inline'
import cn from 'classnames'

interface WaveFormOptionProps {
  type: EnableWaveForm
  disabled: boolean
  setDisabled: (d: boolean) => void
}

const WaveFormOption: FC<WaveFormOptionProps> = ({ type, disabled, setDisabled }) => {
  const dispatch = useDispatch()
  const i18n = useI18n()
  const enableStatus = useSelector(s => s.settings.waveform)
  const file = useSelector(s => s.files.selected) as string
  const videoDuration = doVideoWithDefault(video => video.duration, 0)
  const [stage, setStage] = useState(StageEnum.stopped)

  useEffect(() => {
    if (type !== enableStatus) {
      setStage(StageEnum.stopped)
    }
  }, [type, enableStatus])

  let icon = ''
  let text = ''
  let cb = async () => {}
  const createSampling = async (ab: ArrayBuffer) => {
    if (!ab) return
    const worker = new SamplingWorker()
    await computeAudioSampling({
      worker,
      arrayBuffer: ab,
      fileName: file,
      videoDuration,
      onProgress: s => setStage(s),
    })
  }
  switch (type) {
    case EnableWaveForm.disable: {
      icon = 'hide_source'
      text = i18n('nav.waveform.disable')
      break
    }
    case EnableWaveForm.video: {
      icon = 'video_file'
      text = i18n('nav.waveform.enable_with_video')

      cb = async () => {
        setStage(StageEnum.decoding)
        const videoArrayBuffer = await (await getVideo(file))?.file.arrayBuffer()
        await createSampling(videoArrayBuffer as ArrayBuffer)
      }
      break
    }
    case EnableWaveForm.audio: {
      icon = 'audio_file'
      text = i18n('nav.waveform.enable_with_audio')

      cb = async () => {
        const handles = await showOpenFilePicker({
          id: 'audio-file-for-waveform',
          types: [
            {
              description: 'Audio',
              accept: {
                'audio/*': [],
              },
            },
          ],
        } as OpenFilePickerOptions)
        setStage(StageEnum.decoding)
        const audioArrayBuffer = await (await handles[0].getFile()).arrayBuffer()
        await createSampling(audioArrayBuffer)
      }
      break
    }
  }

  const setStatus = (s: EnableWaveForm) => {
    dispatch(updateEnableWaveForm({ file: file, enable: s }))
  }

  return (
    <div
      className={cn(styles['waveform-option'], { active: enableStatus === type })}
      onClick={async () => {
        if (enableStatus === type) return
        if (disabled) return
        setDisabled(true)
        try {
          await cb()
          setStatus(type)
        } catch (e) {
          let msg = typeof (e as any)?.toString === 'function' ? (e as any).toString() : 'Unexpected error'
          if (e instanceof DurationError) {
            msg = i18n(
              'nav.waveform.duration_error',
              i18n('nav.waveform.enable_with_video'),
              i18n('nav.waveform.enable_with_audio'),
            )
          }
          message(msg)
          setStage(StageEnum.stopped)
        } finally {
          setDisabled(false)
        }
      }}
    >
      <span className="material-icons-outlined">{icon}</span>
      <span className={styles['waveform-text']}>{text}</span>
      <Progress stage={stage} />
    </div>
  )
}

export const WaveForm: FC<{ show: boolean; onClose: () => void }> = props => {
  const i18n = useI18n()
  const [disabled, setDisabled] = useState(false)

  return (
    <Modal {...props} title={i18n('nav.waveform.name')}>
      <div className={styles['waveform']}>
        <WaveFormOption disabled={disabled} setDisabled={setDisabled} type={EnableWaveForm.disable} />
        <WaveFormOption disabled={disabled} setDisabled={setDisabled} type={EnableWaveForm.video} />
        <WaveFormOption disabled={disabled} setDisabled={setDisabled} type={EnableWaveForm.audio} />
      </div>
    </Modal>
  )
}

const DISTANCE = 14

const Progress: FC<{ stage?: StageEnum }> = ({ stage = StageEnum.stopped }) => {
  const text = useI18n()('nav.waveform.stages').split(',')?.[stage - 1] || '-'
  return (
    <div className={styles['progress']} style={{ visibility: stage === StageEnum.stopped ? 'hidden' : undefined }}>
      <svg viewBox={`0 0 ${10 * (2 * DISTANCE + 2)} 20`} xmlns="http://www.w3.org/2000/svg">
        <line
          x1="10"
          y1="10"
          x2={(1 + DISTANCE) * 10}
          y2="10"
          className={cn({ done: stage > StageEnum.resampling, current: stage === StageEnum.resampling })}
        />
        <line
          x1={(1 + DISTANCE) * 10}
          y1="10"
          x2={(1 + DISTANCE * 2) * 10}
          y2="10"
          className={cn({ done: stage > StageEnum.imageGeneration, current: stage === StageEnum.imageGeneration })}
        />

        <circle
          cx="10"
          cy="10"
          r="10"
          className={cn({ done: stage > StageEnum.decoding, current: stage === StageEnum.decoding })}
        />
        <circle
          cx={(1 + DISTANCE) * 10}
          cy="10"
          r="10"
          className={cn({ done: stage > StageEnum.resampling, current: stage === StageEnum.resampling })}
        />
        <circle
          cx={(1 + DISTANCE * 2) * 10}
          cy="10"
          r="10"
          className={cn({ done: stage > StageEnum.imageGeneration, current: stage === StageEnum.imageGeneration })}
        />
      </svg>
      <div>{text}</div>
    </div>
  )
}
