import { useSelector } from '../state/hooks'
import { locale } from '../locale'

export const INIT_LANG = (() => {
  if (/^zh/i.test(navigator.language)) {
    return 'zh-CN'
  }
  return 'en-US'
})()

export const useI18n = (_language?: string): ((path: string, ...args: string[]) => string) => {
  let language = useSelector(s => s.settings.locale)
  language = _language ?? language
  const text = locale[language]
  if (!text) return () => ''

  return (path: string, ...args: string[]) => {
    const paths = path.split('.')
    let tmp = text
    for (let i = 0; i < paths.length; i++) {
      tmp = tmp[paths[i]]
      if (!tmp) return ''
    }
    if (typeof tmp !== 'string') return ''
    return tmp.replace(/{(\d+)}/g, (match, number) => (typeof args[number] != 'undefined' ? args[number] : match))
  }
}
