import { build } from 'vite'
import { resolve, dirname } from 'path'
import { writeFileSync } from 'fs'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

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
writeFileSync(resolve(__dirname, '../dist/sw.js'), output[0].code)
