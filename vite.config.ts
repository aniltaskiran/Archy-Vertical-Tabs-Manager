import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { copyFileSync, mkdirSync, writeFileSync } from 'fs'

// Plugin to copy static files and generate build info
const copyFiles = () => ({
  name: 'copy-files',
  writeBundle() {
    // Generate build info with unique ID
    const buildInfo = {
      buildId: Date.now().toString(36) + Math.random().toString(36).substr(2),
      buildTime: new Date().toISOString(),
      timestamp: Date.now()
    }
    
    // Write build info to dist
    writeFileSync('dist/build-info.json', JSON.stringify(buildInfo, null, 2))
    console.log('Build ID generated:', buildInfo.buildId)
    
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
    // Copy content script assets
    try {
      mkdirSync('dist/src/content', { recursive: true })
      copyFileSync('src/content/overlay.html', 'dist/src/content/overlay.html')
      copyFileSync('src/content/overlay.css', 'dist/src/content/overlay.css')
    } catch (e) {
      console.warn('Content assets not found, skipping...')
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
        newtab: resolve(__dirname, 'src/newtab/index.html'),
        welcome: resolve(__dirname, 'src/welcome/index.html'),
        'service-worker': resolve(__dirname, 'src/background/service-worker.ts'),
        'content': resolve(__dirname, 'src/content/content.ts'),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === 'service-worker') {
            return 'src/background/[name].js'
          }
          if (chunkInfo.name === 'content') {
            return 'src/content/[name].js'
          }
          return 'src/[name]/[name].js'
        },
        chunkFileNames: 'chunks/[name].[hash].js',
        assetFileNames: 'assets/[name].[ext]'
      }
    },
    target: 'es2020',
    minify: false,
    sourcemap: true
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  }
})