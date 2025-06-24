import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    allowedHosts: ['.mcontr.dev', 'localhost'],
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  define: {
    'process.env.VITE_API_URL': JSON.stringify(process.env.VITE_API_URL || 'http://localhost:8000'),
    'process.env.VITE_PEXELS_API_KEY': JSON.stringify(process.env.VITE_PEXELS_API_KEY),
    'process.env.VITE_FLICKR_API_KEY': JSON.stringify(process.env.VITE_FLICKR_API_KEY),
    'process.env.VITE_WEATHER_API_KEY': JSON.stringify(process.env.VITE_WEATHER_API_KEY),
  }
})
