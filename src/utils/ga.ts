function track(name: string, params: any) {
  const gtag = (window as any).gtag
  if (gtag) {
    gtag('event', name, params)
  }
}

export function trackImportFiles(num_of_videos: number, numb_of_subtitles: number) {
  track('import_files', {
    num_of_videos,
    numb_of_subtitles,
  })
}

export function trackOpenFile(file: string) {
  track('open_file', {
    type: file.split('.').pop(), // just extension
  })
}

export function trackGoBack() {
  track('go_back', {})
}

export function trackCreateWaveform(type: 'video' | 'audio') {
  track('create_waveform', { type })
}
