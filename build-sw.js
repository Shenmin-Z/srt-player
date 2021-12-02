const { build } = require('vite')
const { resolve } = require('path')
const { writeFile } = require('fs/promises')

async function buildSW() {
  const { output } = await build({
    configFile: false,
    build: {
      rollupOptions: {
        input: 'sw/sw.ts',
        output: {
          entryFileNames: `[name].js`,
          manualChunks: undefined,
        },
      },
      write: false,
    },
  })
  const code = output[0].code
  writeFile(resolve(__dirname, 'dist/sw.js'), code)
}

;(async () => {
  await buildSW()
})()
