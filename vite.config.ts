import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 3334,
    allowedHosts: ['arts-mac-mini.tail877f0a.ts.net'],
  },
})
