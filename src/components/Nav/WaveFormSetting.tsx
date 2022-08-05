import { FC, useState } from 'react'
import { useSelector, useDispatch, updateEnableWaveForm } from '../../state'
import {
  computeAudioSampling,
  getMediaDuration,
  doVideoWithDefault,
  useI18n,
  EnableWaveForm,
  StageEnum,
  getVideo,
  trackCreateWaveform,
} from '../../utils'
import { Modal, message } from '../Modal'
import styles from './Nav.module.less'
import SamplingWorker from '../../web-workers/sampling?worker&inline'
import cn from 'classnames'

interface WaveFormOptionProps {
  type: EnableWaveForm
  disabled: boolean
  setDisabled: (d: boolean) => void
  setStage: (s: StageEnum) => void
}

const WaveFormOption: FC<WaveFormOptionProps> = ({ type, disabled, setDisabled, setStage }) => {
  const dispatch = useDispatch()
  const i18n = useI18n()
  const enableStatus = useSelector(s => s.settings.waveform)
  const file = useSelector(s => s.files.selected) as string
  const videoDuration = doVideoWithDefault(video => video.duration, 0)

  let icon = ''
  let mainText = ''
  let subText = ''
  let cb = async () => {}
  const createSampling = async (ab: ArrayBuffer, duration?: number) => {
    if (!ab) return
    const worker = new SamplingWorker()
    await computeAudioSampling({
      worker,
      arrayBuffer: ab,
      fileName: file,
      audioDuration: duration ?? videoDuration,
      onProgress: s => setStage(s),
    })
  }
  switch (type) {
    case EnableWaveForm.disable: {
      icon = 'hide_source'
      mainText = i18n('nav.waveform.disable')
      break
    }
    case EnableWaveForm.video: {
      icon = 'video_file'
      mainText = i18n('nav.waveform.enable')
      subText = i18n('nav.waveform.with_video')

      cb = async () => {
        setStage(StageEnum.decoding)
        const videoArrayBuffer = await (await getVideo(file))?.file.arrayBuffer()
        await createSampling(videoArrayBuffer as ArrayBuffer)
        trackCreateWaveform('video')
      }
      break
    }
    case EnableWaveForm.audio: {
      icon = 'audio_file'
      mainText = i18n('nav.waveform.enable')
      subText = i18n('nav.waveform.with_audio')

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
        const file = await handles[0].getFile()
        const audioDuration = await getMediaDuration(file)
        const audioArrayBuffer = await file.arrayBuffer()
        await createSampling(audioArrayBuffer, audioDuration)
        trackCreateWaveform('audio')
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
          setStage(StageEnum.stopped)
          await cb()
          setStatus(type)
        } catch (e) {
          let msg = typeof (e as any)?.toString === 'function' ? (e as any).toString() : 'Unexpected error'
          message(msg)
          setStage(StageEnum.stopped)
        } finally {
          setDisabled(false)
        }
      }}
    >
      <div className="material-icons-outlined">{icon}</div>
      <div className={styles['waveform-text']}>
        <div className={styles['main']}>{mainText}</div>
        <div className={styles['sub']}>{subText}</div>
      </div>
    </div>
  )
}

export const WaveForm: FC<{ show: boolean; onClose: () => void }> = props => {
  const i18n = useI18n()
  const [disabled, setDisabled] = useState(false)
  const [stage, setStage] = useState(StageEnum.stopped)

  const commonProps = {
    disabled,
    setDisabled,
    setStage,
  }
  return (
    <Modal {...props} title={i18n('nav.waveform.name')}>
      <div className={styles['waveform']}>
        <WaveFormOption {...commonProps} type={EnableWaveForm.disable} />
        <WaveFormOption {...commonProps} type={EnableWaveForm.video} />
        <WaveFormOption {...commonProps} type={EnableWaveForm.audio} />
      </div>
      <Progress stage={stage} />
    </Modal>
  )
}

const Progress: FC<{ stage?: StageEnum }> = ({ stage = StageEnum.stopped }) => {
  const text = useI18n()('nav.waveform.stages').split(',')?.[stage - 1] || '-'
  const percentage = Math.ceil((stage / StageEnum.done) * 100)
  if (stage === StageEnum.stopped) return null
  return (
    <div className={styles['progress']}>
      <div className={styles['percentage']}>{percentage}%</div>
      <div className={styles['stage']}>{text}</div>
    </div>
  )
}
