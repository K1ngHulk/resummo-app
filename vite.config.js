import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
const apiProxyTarget = globalThis.process?.env?.RESUMMO_API_PROXY_TARGET || 'http://127.0.0.1:3001'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': apiProxyTarget,
      '/content-assets': apiProxyTarget,
    },
  },
})
