import { useReducer, useRef, useState } from 'react'
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'
import styles from './Uploader.module.less'
import { saveVideoSubPair, useDispatch, getList, getFileList } from '../state'
import { confirm } from './Modal'
import { useI18n } from '../utils'
import cn from 'classnames'

export const Uploader = () => {
  const dispatch = useDispatch()
  const i18n = useI18n()

  const subtitleHandles = useRef<FileSystemHandle[]>([])
  const videoHandles = useRef<FileSystemHandle[]>([])
  const [, forceUpdate] = useReducer(s => !s, true)
  const [dragOver, setDragOver] = useState(false)

  const process = async () => {
    const vs = videoHandles.current
    const ss = subtitleHandles.current
    const exist = await checkExist(vs)
    if (exist.length > 0) {
      const overwrite = await confirm(i18n('confirm.overwrite_existing_file', exist.join(', ')))
      if (!overwrite) {
        return
      }
    }
    await Promise.all(vs.map((v, idx) => processPair([v, ss[idx]])))
    videoHandles.current = []
    subtitleHandles.current = []
    forceUpdate()
    dispatch(getList())
  }

  const addToBuf = (vhs: FileSystemHandle[], shs: FileSystemHandle[]) => {
    videoHandles.current = videoHandles.current
      .concat(vhs)
      .filter((v, i, a) => a.findIndex(t => t.name === v.name) === i)
    subtitleHandles.current = subtitleHandles.current
      .concat(shs)
      .filter((v, i, a) => a.findIndex(t => t.name === v.name) === i)
    forceUpdate()
  }

  const hasBuffer = videoHandles.current.length > 0 || subtitleHandles.current.length > 0
  const disabled = videoHandles.current.length !== subtitleHandles.current.length

  return (
    <div className={styles['container']}>
      <div
        className={cn(styles['upload-area'], { 'drag-over': dragOver })}
        onClick={async () => {
          const { videos, subtitles } = await pickFiles()
          addToBuf(videos, subtitles)
        }}
        onDragOver={event => {
          event.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => {
          setDragOver(false)
        }}
        onDrop={async event => {
          setDragOver(false)
          event.preventDefault()
          const items = Array.from(event.dataTransfer.items).filter(i => i.kind === 'file')
          const handles = await Promise.all(items.map(i => i.getAsFileSystemHandle()))
          const { videos, subtitles } = await filterFileHandles(handles as FileSystemFileHandle[])
          addToBuf(videos, subtitles)
        }}
      >
        <span className="material-icons">upload_file</span>
        {i18n('import_video_and_subtitle.click_drop')}
      </div>
      <div className={styles['buffer']} style={{ display: hasBuffer ? undefined : 'none' }}>
        <DragDropContext
          onDragEnd={result => {
            if (!result.destination) {
              return
            }
            videoHandles.current = reorder(videoHandles.current, result.source.index, result.destination.index)
            forceUpdate()
          }}
        >
          <Droppable droppableId="videos">
            {provided => (
              <div className={styles['videos']} {...provided.droppableProps} ref={provided.innerRef}>
                <div className="material-icons">live_tv</div>
                {videoHandles.current
                  .map(v => v.name)
                  .map((v, index) => (
                    <Draggable key={v} draggableId={v} index={index}>
                      {provided => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={cn(styles['file'], { error: subtitleHandles.current[index] === undefined })}
                          title={v}
                        >
                          {v}
                          <span
                            className="material-icons"
                            onClick={() => {
                              videoHandles.current = videoHandles.current.filter(i => i.name !== v)
                              forceUpdate()
                            }}
                          >
                            close
                          </span>
                        </div>
                      )}
                    </Draggable>
                  ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
        <DragDropContext
          onDragEnd={result => {
            if (!result.destination) {
              return
            }
            subtitleHandles.current = reorder(subtitleHandles.current, result.source.index, result.destination.index)
            forceUpdate()
          }}
        >
          <Droppable droppableId="subtitles">
            {provided => (
              <div className={styles['subtitles']} {...provided.droppableProps} ref={provided.innerRef}>
                <div className="material-icons">closed_caption_off</div>
                {subtitleHandles.current
                  .map(s => s.name)
                  .map((s, index) => (
                    <Draggable key={s} draggableId={s} index={index}>
                      {provided => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={cn(styles['file'], { error: videoHandles.current[index] === undefined })}
                          title={s}
                        >
                          {s}
                          <span
                            className="material-icons"
                            onClick={() => {
                              subtitleHandles.current = subtitleHandles.current.filter(i => i.name !== s)
                              forceUpdate()
                            }}
                          >
                            close
                          </span>
                        </div>
                      )}
                    </Draggable>
                  ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>
      <div className={styles['ok']} style={{ display: hasBuffer ? undefined : 'none' }}>
        <button onClick={process} disabled={disabled}>
          {i18n('import_video_and_subtitle.save')}
        </button>
      </div>
    </div>
  )
}

async function pickFiles() {
  try {
    const handles = await showOpenFilePicker({
      id: 'video-and-subtitle',
      multiple: true,
      types: [
        {
          description: 'Videos & Subtitles',
          accept: {
            'audio/*': [],
            'video/*': [],
            'text/plain': ['.srt'],
          },
        },
      ],
    } as OpenFilePickerOptions)
    return filterFileHandles(handles)
  } catch {
    return { videos: [], subtitles: [] }
  }
}

async function filterFileHandles(handles: FileSystemFileHandle[]) {
  const videos = handles.filter(h => !h.name.toLowerCase().endsWith('.srt'))
  const subtitles = handles.filter(h => h.name.toLowerCase().endsWith('.srt'))
  return { videos, subtitles }
}

type FilePair = [FileSystemHandle, FileSystemHandle]

async function processPair(pair: FilePair) {
  const [video, subtitle] = pair
  const subtitleFile: File = await (subtitle as any).getFile()
  const subtitleText = await subtitleFile.text()
  await saveVideoSubPair({ video: video, subtitle: subtitleText })
}

async function checkExist(vs: FileSystemHandle[]): Promise<string[]> {
  const fs = vs.map(i => i.name)
  const fileNames = new Set(await getFileList())
  return fs.filter(i => fileNames.has(i))
}

function reorder<T>(list: T[], startIndex: number, endIndex: number) {
  const result = Array.from(list)
  const [removed] = result.splice(startIndex, 1)
  result.splice(endIndex, 0, removed)

  return result
}
