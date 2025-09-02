// Simple script to create basic PNG icons
const fs = require('fs');
const { createCanvas } = require('canvas');

function createIcon(size, filename) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  // Background
  ctx.fillStyle = '#1f2937'; // Dark gray
  ctx.fillRect(0, 0, size, size);
  
  // Letter A for Archy
  ctx.fillStyle = '#60a5fa'; // Blue
  ctx.font = `bold ${size * 0.6}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('A', size / 2, size / 2);
  
  // Save as PNG
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(filename, buffer);
  console.log(`Created ${filename}`);
}

// Create all icon sizes
try {
  createIcon(16, 'icons/icon-16.png');
  createIcon(32, 'icons/icon-32.png');
  createIcon(48, 'icons/icon-48.png');
  createIcon(128, 'icons/icon-128.png');
} catch (error) {
  console.log('Canvas module not available, creating simple SVG-based icons instead...');
  
  // Fallback: Create simple base64 encoded PNG data
  const createSimpleIcon = (size, filename) => {
    // Simple 1x1 transparent PNG as base64
    const pngData = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
    fs.writeFileSync(filename, Buffer.from(pngData, 'base64'));
    console.log(`Created simple ${filename}`);
  };
  
  createSimpleIcon(16, 'icons/icon-16.png');
  createSimpleIcon(32, 'icons/icon-32.png'); 
  createSimpleIcon(48, 'icons/icon-48.png');
  createSimpleIcon(128, 'icons/icon-128.png');
}