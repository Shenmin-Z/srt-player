declare global {
  interface Window {
    dataLayer: any
    'ga-disable-G-STHJFZ79XM': boolean
  }
}

const GA_MEASUREMENT_ID = 'G-STHJFZ79XM'
if (location.hostname !== 'shenmin-z.github.io') {
  // disable if not prod env
  window['ga-disable-G-STHJFZ79XM'] = true
}

window.dataLayer = window.dataLayer || []
function gtag(..._: any[]) {
  window.dataLayer.push(arguments)
}
gtag('js', new Date())
gtag('config', GA_MEASUREMENT_ID)

function track(name: string, params: any) {
  gtag('event', name, params)
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
