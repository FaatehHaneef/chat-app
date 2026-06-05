import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // .env lives at the repo root, but Vite runs from frontend/, so point its
  // env loader at the parent dir. Without this, VITE_* vars are undefined and
  // createClient() throws "supabaseUrl is required" -> blank screen.
  envDir: '..',
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
})
