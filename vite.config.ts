import { defineConfig, Plugin, ResolvedConfig, build } from 'vite'
import react from '@vitejs/plugin-react'
import { readFile } from 'fs/promises'
import { resolve } from 'path'

const SWPlugin = (): Plugin => {
  let config: ResolvedConfig

  return {
    name: 'vite-plugin-sw-middleware',
    config(config, env) {
      if (env.command === 'build') {
        return {
          ...config,
          build: {
            rollupOptions: {
              output: {
                entryFileNames: '[name].js',
                assetFileNames: '[name][extname]',
                chunkFileNames: 'common.js',
                manualChunks: undefined,
              },
            },
          },
        }
      } else {
        return config
      }
    },
    configResolved(resolvedConfig) {
      config = resolvedConfig
    },
    configureServer({ middlewares }) {
      build({
        build: {
          rollupOptions: {
            input: 'sw/sw.ts',
            output: {
              entryFileNames: `[name].js`,
              manualChunks: undefined,
            },
          },
          minify: false,
          watch: {},
        },
      })
      middlewares.use(async (req, res, next) => {
        if (req.originalUrl === config.base + 'sw.js') {
          const sw = await readFile(resolve(__dirname, 'dist/sw.js'))
          res.setHeader('Content-Type', 'text/javascript')
          res.end(sw)
        } else {
          next()
        }
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), SWPlugin()],
  base: '/srt-player/',
})
