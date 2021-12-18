import { useSelector } from '../state/hooks'
import { locacle } from '../locale'

export const useI18n = (): ((path: string, ...args: string[]) => string) => {
  const language = useSelector(s => s.settings.language)
  const text = locacle[language]
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
