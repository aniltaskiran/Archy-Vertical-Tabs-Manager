#!/bin/bash

# Build the extension
echo "🔨 Building extension..."
npm run build

# Check if build was successful
if [ $? -ne 0 ]; then
  echo "❌ Build failed"
  exit 1
fi

# Create zip file
echo "📦 Creating extension package..."
cd dist
zip -r ../archy-extension.zip ./* -x "*.map" -x ".DS_Store"
cd ..

# Get file size
SIZE=$(du -h archy-extension.zip | cut -f1)

echo "✅ Extension packaged successfully!"
echo "📦 Package: archy-extension.zip (${SIZE})"
echo "📍 Location: $(pwd)/archy-extension.zip"
echo ""
echo "📋 Next steps:"
echo "1. Go to chrome://extensions/"
echo "2. Enable Developer mode"
echo "3. Click 'Load unpacked' and select the 'dist' folder for testing"
echo "4. Or upload 'archy-extension.zip' to Chrome Web Store"