import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/focus-timer/',
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        entryFileNames: 'assets/index.js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: ({ name }) => {
          // Check if the file extension matches common image formats
          if (/\.(gif|jpe?g|png|svg|webp|avif)$/.test(name ?? '')) {
            return 'assets/img/[name][extname]'
          }
          // Default folder for CSS and other assets
          return 'assets/[name][extname]'
        },
      }
    }
  }
})
