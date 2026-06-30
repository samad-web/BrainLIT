import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Dev proxy for Groq so the browser is not CORS-blocked in development.
// In production, calls go straight to api.groq.com (see src/lib/groq.js).
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/groq': {
        target: 'https://api.groq.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/groq/, ''),
      },
    },
  },
})
