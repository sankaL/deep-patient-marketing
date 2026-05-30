import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiProxyTarget = env.VITE_API_PROXY_TARGET || 'http://127.0.0.1:8000'
  // Hono auth server handles /api/auth/* (better-auth)
  const authProxyTarget = env.VITE_AUTH_PROXY_TARGET || 'http://127.0.0.1:3001'

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      proxy: {
        // More-specific path first — /api/auth → Hono (better-auth)
        '/api/auth': {
          target: authProxyTarget,
          changeOrigin: true,
        },
        // Everything else under /api → Hono proxy gateway (which validates the session and forwards to the backend)
        '/api': {
          target: authProxyTarget,
          changeOrigin: true,
        },
      },
    },
  }
})
