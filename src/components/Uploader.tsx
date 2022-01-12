import { useReducer, useRef, useState } from 'react'
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'
import { supported, fileOpen, FileWithHandle } from 'browser-fs-access'
import styles from './Uploader.module.less'
import { useDispatch, getList } from '../state'
import { confirm } from './Modal'
import { useI18n, saveVideoSubPair, getFileList } from '../utils'
import cn from 'classnames'

export const Uploader = () => {
  const dispatch = useDispatch()
  const i18n = useI18n()

  const subtitleHandles = useRef<FileWithHandle[]>([])
  const videoHandles = useRef<FileWithHandle[]>([])
  const [, forceUpdate] = useReducer(s => !s, true)
  const [dragOver, setDragOver] = useState(false)
  const [saveCache, setSaveCache] = useState(false)

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
    await Promise.all(vs.map((v, idx) => saveVideoSubPair([v, ss[idx]], saveCache)))
    videoHandles.current = []
    subtitleHandles.current = []
    setSaveCache(false)
    forceUpdate()
    dispatch(getList())
  }

  const addToBuf = (vhs: FileWithHandle[], shs: FileWithHandle[]) => {
    videoHandles.current = videoHandles.current
      .concat(vhs)
      .filter((v, i, a) => a.findIndex(t => t.name === v.name) === i)
    subtitleHandles.current = subtitleHandles.current
      .concat(shs)
      .filter((v, i, a) => a.findIndex(t => t.name === v.name) === i)
    forceUpdate()
  }

  const hasBuffer = videoHandles.current.length > 0 || subtitleHandles.current.length > 0
  const uploadStyle = { display: hasBuffer ? undefined : 'none' }
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
          const files: FileWithHandle[] = await Promise.all(
            items.map(async i => {
              const f = i.getAsFile() as File
              const handle = supported
                ? (((await i.getAsFileSystemHandle()) || undefined) as FileSystemFileHandle)
                : undefined
              return { ...f, handle }
            }),
          )
          const { videos, subtitles } = await filterFileHandles(files)
          addToBuf(videos, subtitles)
        }}
      >
        <span className="material-icons">upload_file</span>
        {i18n('import_video_and_subtitle.click_drop')}
      </div>
      <div className={styles['buffer']} style={uploadStyle}>
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
      <div className={styles['save-cache']} style={uploadStyle}>
        <input
          id="upload-save-cache"
          type="checkbox"
          checked={saveCache}
          onChange={e => {
            setSaveCache(e.target.checked)
          }}
        />
        <label htmlFor="upload-save-cache">{i18n('import_video_and_subtitle.save_cache')}</label>
      </div>
      <div className={styles['ok']} style={uploadStyle}>
        <button onClick={process} disabled={disabled}>
          {i18n('import_video_and_subtitle.save')}
        </button>
      </div>
    </div>
  )
}

async function pickFiles() {
  try {
    const option = supported
      ? {
          mimeTypes: ['audio/*', 'video/*', 'text/plain'],
          extensions: ['.srt'],
        }
      : {
          extensions: ['.srt', '.mp4', '.avi', '.mp3', '.aac'],
        }
    const files = await fileOpen({
      description: 'Videos & Subtitles',
      multiple: true,
      id: 'video-and-subtitle',
      ...option,
    })
    return filterFileHandles(files)
  } catch {
    return { videos: [], subtitles: [] }
  }
}

async function filterFileHandles(files: FileWithHandle[]) {
  const videos = files.filter(h => !h.name.toLowerCase().endsWith('.srt'))
  const subtitles = files.filter(h => h.name.toLowerCase().endsWith('.srt'))
  return { videos, subtitles }
}

async function checkExist(vs: FileWithHandle[]): Promise<string[]> {
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
