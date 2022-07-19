function track(name: string, params: any) {
  const gtag = (window as any).gtag
  if (gtag) {
    gtag('event', name, params)
  }
}

export function trackImportFiles(num_of_videos: number, num_of_subtitles: number) {
  track('import_files', {
    num_of_videos,
    num_of_subtitles,
  })
}

export function trackOpenFile(file: string) {
  track('open_file', {
    open_file_type: file.split('.').pop(), // just extension
  })
}

export function trackGoBack() {
  track('go_back', { click_go_back: 'back to main page' })
}

export function trackCreateWaveform(type: 'video' | 'audio') {
  track('create_waveform', { create_waveform_type: type })
}
