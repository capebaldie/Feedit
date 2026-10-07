import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api/reddit': {
          target: 'https://www.reddit.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/reddit/, ''),
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              if (env.REDDIT_COOKIE) {
                proxyReq.setHeader('Cookie', env.REDDIT_COOKIE)
              }
              proxyReq.setHeader(
                'User-Agent',
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36',
              )
              // Reddit expects these to look like a real browser request
              proxyReq.setHeader('Accept', 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8')
              proxyReq.setHeader('Accept-Language', 'en-US,en;q=0.5')
            })
          },
        },
      },
    },
  }
})
