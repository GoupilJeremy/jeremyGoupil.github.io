import { defineConfig } from 'vite'

export default defineConfig({
  base: '/encyclopedia/',
  build: {
    outDir: '../dist/encyclopedia',
    emptyOutDir: true,
  },
  server: {
    port: 3000,
    open: true,
  },
})
