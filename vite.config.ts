import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/kotodama/',
  optimizeDeps: {
    exclude: [
      '**/.git/**',
      '**/node_modules/**',
      '**/submodules/**',
      '**/.agents/**',
    ]
  },
  plugins: [react()],
  server: {
    watch: {
      ignored: [
        '**/.git/**',
        '**/node_modules/**',
        '**/submodules/**',
        '**/.agents/**',
      ],
    }
  }
})
