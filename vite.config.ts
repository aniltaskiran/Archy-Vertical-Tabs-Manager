import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { copyFileSync, mkdirSync } from 'fs'

// Plugin to copy static files
const copyFiles = () => ({
  name: 'copy-files',
  writeBundle() {
    // Copy manifest.json to dist
    copyFileSync('manifest.json', 'dist/manifest.json')
    // Copy icons to dist
    try {
      mkdirSync('dist/icons', { recursive: true })
      copyFileSync('icons/icon-16.png', 'dist/icons/icon-16.png')
      copyFileSync('icons/icon-32.png', 'dist/icons/icon-32.png')
      copyFileSync('icons/icon-48.png', 'dist/icons/icon-48.png')
      copyFileSync('icons/icon-128.png', 'dist/icons/icon-128.png')
    } catch (e) {
      console.warn('Icons not found, skipping...')
    }
  }
})

export default defineConfig({
  plugins: [react(), copyFiles()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        sidepanel: resolve(__dirname, 'src/sidepanel/index.html'),
        'service-worker': resolve(__dirname, 'src/background/service-worker.ts'),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === 'service-worker') {
            return 'src/background/[name].js'
          }
          return 'src/[name]/[name].js'
        },
        chunkFileNames: 'chunks/[name].[hash].js',
        assetFileNames: 'assets/[name].[ext]'
      }
    },
    target: 'esnext',
    minify: false,
    sourcemap: true
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  }
})