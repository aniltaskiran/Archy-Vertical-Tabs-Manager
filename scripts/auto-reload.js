#!/usr/bin/env node

import { watch } from 'fs';
import { exec } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const distPath = join(__dirname, '..', 'dist');

console.log('🔄 Auto-reload script started');
console.log(`📁 Watching: ${distPath}`);

let reloadTimeout;

const reloadExtension = () => {
  clearTimeout(reloadTimeout);
  
  reloadTimeout = setTimeout(() => {
    console.log('🔄 Reloading extension...');
    
    // Send reload command via Chrome DevTools Protocol
    exec('chrome.runtime.reload()', (error) => {
      if (error) {
        console.log('⚠️  Could not auto-reload. Please reload manually in chrome://extensions');
      } else {
        console.log('✅ Extension reloaded successfully');
      }
    });
  }, 1000);
};

// Watch for changes in dist directory
watch(distPath, { recursive: true }, (eventType, filename) => {
  if (filename) {
    console.log(`📝 Change detected: ${filename}`);
    reloadExtension();
  }
});

console.log('👀 Watching for changes... (Press Ctrl+C to stop)');