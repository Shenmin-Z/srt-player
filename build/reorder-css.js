const { resolve } = require('path')
const { readFileSync, writeFileSync } = require('fs')

const filePath = resolve(__dirname, '../dist/index.html')
const html = readFileSync(filePath).toString()

// move css after loading indicator
function reorder(code) {
  let lines = code.split('\n')
  let cssIdx = -1,
    rootIdx = -1
  for (let i = 0; i < lines.length; i++) {
    if (/index\.css/.test(lines[i])) {
      cssIdx = i
    }
    if (/id="root"/.test(lines[i])) {
      rootIdx = i
    }
    if (cssIdx >= 0 && rootIdx >= 0) {
      break
    }
  }
  if (cssIdx === -1 || rootIdx === -1) {
    throw 'Ordering css failed'
  }
  lines.splice(rootIdx, 0, lines[cssIdx])
  lines.splice(cssIdx, 1)

  // simple minify
  lines = lines.map(l => l.trim()).filter(i => i !== '' || /<!--.*-->/.test(i))

  return lines.join('')
}

writeFileSync(filePath, reorder(html))
