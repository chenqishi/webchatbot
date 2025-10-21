import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  base: './',
  plugins: [vue()],
  define: {
    global: 'globalThis',
  },
  resolve: {
    alias: {
      buffer: 'buffer',
      stream: 'stream-browserify',
      crypto: 'crypto-browserify',
      util: 'util'
    }
  },
  optimizeDeps: {
    include: ['buffer', 'stream-browserify', 'crypto-browserify', 'util']
  },
  server: {
    port: 5173,
    proxy: {
      '/custom-im': {
        target: 'https://www.lufitglobalselling.com',
        changeOrigin: true,
        secure: true,
        //rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
})


