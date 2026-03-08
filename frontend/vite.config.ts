import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@components': '/src/components',
      '@pages': '/src/pages',
      '@services': '/src/services',
      '@stores': '/src/stores',
      '@types': '/src/types',
      '@utils': '/src/utils',
    },
  },
})
