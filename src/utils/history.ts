const MAP: {[s:string]: WatchHistory} = {}

export class WatchHistory {
  videoTime = 0;
  subtitleTop = 0;

  constructor(private file: string) {
    if (MAP[file]) return MAP[file]
    try {
      let history = JSON.parse(localStorage.getItem(file) || `{}`)
      this.videoTime = history.videoTime ?? 0
      this.subtitleTop = history.subtitleTop ?? 0
    } catch {
    }
    MAP[file] = this
    this.keyListener = this.keyListener.bind(this)
  }

  keyListener(e: KeyboardEvent) {
    if (e.code === 'KeyS') {
      this.save()
    }
  }

  get() {
    let subtitle = document.getElementById('srt-player-subtitle') as HTMLDivElement | undefined
    let video = document.getElementById('srt-player-video') as HTMLVideoElement | undefined
    return {subtitle, video}
  }

  save() {
    let {subtitle, video} = this.get()
    if (subtitle) {
      this.subtitleTop = Math.floor(subtitle.scrollTop)
    }
    if (video) {
      this.videoTime = Math.floor(video.currentTime)
    }
    localStorage.setItem(this.file, JSON.stringify({ videoTime: this.videoTime, subtitleTop: this.subtitleTop}))
  }

  restoreSubtitle() {
    let { subtitle } = this.get()
    if (subtitle) {
      subtitle.scroll({ top: this.subtitleTop, behavior: 'auto' })
    }
  }

  restoreVideo() {
    let { video } = this.get()
    if (video) {
      video.currentTime = this.videoTime
    }
  }
}
