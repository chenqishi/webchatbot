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
    host: '0.0.0.0', // 允许外部访问
    cors: true, // 启用CORS
    allowedHosts: [
      '3b9f40c2.r29.cpolar.top',
      '33599462.r29.cpolar.top',
      'localhost',
      '127.0.0.1'
    ], // 允许的主机列表
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


