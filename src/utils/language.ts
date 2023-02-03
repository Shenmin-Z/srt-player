import { Node } from './subtitle'

export function subtitleInJP(nodes: Node[]) {
  for (let i = 0; i < Math.min(20, nodes.length); i++) {
    const text = nodes[i].text.join('')
    const jpCharacters = text.match(/[ぁ-ゔァ-ヴ]/g) || []
    if (jpCharacters.length >= 5) {
      return true
    }
  }
  return false
}

export function lineInCN(line: string) {
  // contains Chinese but not Kana
  return /\p{Script=Han}/u.test(line) && !/[ぁ-ゔァ-ヴ]+/.test(line)
}
