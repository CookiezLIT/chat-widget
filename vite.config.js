import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'

function mockApiPlugin() {
  return {
    name: 'mock-api',
    configureServer(server) {
      server.middlewares.use('/api/session', async (req, res, next) => {
        if (req.method !== 'POST') return next()
        let body = ''
        await new Promise(resolve => {
          req.on('data', c => { body += c })
          req.on('end', resolve)
        })
        console.log('[mock /api/session]', body)
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ token: 'mock-dev-token' }))
      })

      server.middlewares.use('/api/chat', async (req, res, next) => {
        if (req.method !== 'POST') return next()

        let body = ''
        await new Promise(resolve => {
          req.on('data', c => { body += c })
          req.on('end', resolve)
        })
        console.log('[mock /api/chat]', body)

        res.setHeader('Content-Type', 'text/plain; charset=utf-8')
        res.setHeader('Transfer-Encoding', 'chunked')
        res.setHeader('Cache-Control', 'no-cache')

        const chunks = [
          "Hi there! ",
          "I'm a mock assistant running locally. ",
          "The real backend isn't connected yet, ",
          "but the UI is fully functional. ",
          "Feel free to test the interface!",
        ]
        for (const chunk of chunks) {
          res.write(chunk)
          await new Promise(r => setTimeout(r, 120))
        }
        res.end()
      })
    }
  }
}

export default defineConfig(() => {
  if (process.env.BUILD_TARGET === 'loader') {
    return {
      build: {
        lib: {
          entry: 'src/loader.js',
          name: 'ChatWidget',
          fileName: () => 'loader.js',
          formats: ['iife'],
        },
        outDir: 'dist',
        emptyOutDir: false,
      }
    }
  }

  // Widget app + mock API for local dev.
  // Set CHAT_BACKEND=http://localhost:8000 to proxy /api to a real backend
  // instead of the mock (same-origin via Vite, so no CORS setup needed).
  const backendProxy = process.env.CHAT_BACKEND
  return {
    plugins: [preact(), ...(backendProxy ? [] : [mockApiPlugin()])],
    server: backendProxy
      ? { proxy: { '/api': { target: backendProxy, changeOrigin: true } } }
      : undefined,
    base: '/chat-widget/widget/',
    root: 'src/widget',
    build: {
      outDir: '../../dist/widget',
      emptyOutDir: true,
    }
  }
})
