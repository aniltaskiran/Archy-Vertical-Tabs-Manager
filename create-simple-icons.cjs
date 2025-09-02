const fs = require('fs');

// Simple transparent PNG as base64 (1x1 pixel)
const transparentPng = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI/kCIhQwAAAABJRU5ErkJggg==';

function createIcon(filename) {
  fs.writeFileSync(filename, Buffer.from(transparentPng, 'base64'));
  console.log(`Created ${filename}`);
}

// Create all required icon sizes
createIcon('icons/icon-16.png');
createIcon('icons/icon-32.png');
createIcon('icons/icon-48.png');
createIcon('icons/icon-128.png');

console.log('All placeholder icons created successfully!');