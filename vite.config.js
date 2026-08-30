import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    // Three.js bundles are large — suppress the warning threshold
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          // R3F and Three.js go into their own chunk, loaded only when CardFlipScene mounts
          'three-vendor': ['three', '@react-three/fiber', '@react-three/drei'],
          // React core
          'react-vendor': ['react', 'react-dom'],
          // Animation libs
          'anim-vendor': ['framer-motion', 'gsap', 'lenis'],
        },
      },
    },
  },
  server: {
    port: 5173,
    open: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
      }
    }
  },
})
