class LocalValue {
  value: string

  constructor(public type: string, init: string) {
    this.value = this.get() || init
  }

  get() {
    return localStorage.getItem(this.type)
  }

  set(value?: string) {
    localStorage.setItem(this.type, value ?? this.value)
  }
}

class CSSValue extends LocalValue {
  set(value?: string) {
    super.set(value)
    const root = document.documentElement
    root.style.setProperty(this.type, value ?? this.value)
  }
}

export const SubtitleWidthWithDictionary = new CSSValue('--subtitle-width-with-dictionary', '420px')
export const SubtitleWidthWithoutDictionary = new CSSValue('--subtitle-width-without-dictionary', '620px')
export const DictionaryWidth = new CSSValue('--dictionary-width', '600px')
export const DictionaryLeftOffset = new CSSValue('--dictionary-left-offset', '0px')
export const getCSS = (v: CSSValue) => (v.get() as string).replace('px', '')

class DictionaryValue extends LocalValue {
  set(value?: string) {
    super.set(value)
    let iframe = document.getElementById('dictionary-iframe') as HTMLIFrameElement
    if (iframe) {
      iframe.src = value ?? this.value
    }
  }
}

export const DictionaryUrl = new DictionaryValue('dictionary-url', 'https://www.mojidict.com/')

export const EnableDictionary = new LocalValue('enable-dictionary', 'true')
