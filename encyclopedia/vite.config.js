import { defineConfig } from 'vite'

export default defineConfig({
  base: '/encyclopedia/',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        // Split Three.js and GSAP into separate cached chunks
        manualChunks: {
          three: ['three'],
          gsap:  ['gsap'],
        },
      },
    },
    chunkSizeWarningLimit: 1200,
  },
  server: {
    port: 3000,
    open: true,
  },
})
