# Archy - Vertical Tabs Manager

A powerful Chrome extension for managing tabs vertically with AI-powered organization, inspired by Arc browser's design.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-green)
![License](https://img.shields.io/badge/license-MIT-blue)

## Features

### 🎯 Core Features
- **Vertical Tab Layout**: Clean, space-efficient vertical tab organization in Chrome's side panel
- **Drag & Drop**: Intuitive drag and drop to reorder tabs, organize favorites, and manage folders
- **Smart Sections**: Automatic organization into Today, Favorites, and Archive sections
- **Folder Management**: Create folders to organize bookmarks with nested structure support
- **Chrome Bookmarks Sync**: Automatic synchronization with Chrome bookmarks
- **Keyboard Shortcuts**: Quick navigation and actions with keyboard shortcuts

### 📌 Tab Management
- **Pinned Tabs**: Special handling for pinned tabs with visual separation
- **Tab Search**: Fast fuzzy search across all open tabs
- **Quick Actions**: Close, pin/unpin, archive tabs with one click
- **Favicon Support**: Visual tab identification with favicons
- **Active Tab Highlighting**: Clear indication of the currently active tab

### 🎨 User Experience
- **Dark Theme**: Modern dark interface that's easy on the eyes
- **Smooth Animations**: Polished transitions and hover effects
- **Context Menus**: Right-click actions for tabs, bookmarks, and folders
- **Inline Editing**: Edit folder and bookmark names directly
- **Visual Feedback**: Clear drag-over states and drop zones

## Installation

### From Source
1. Clone the repository:
```bash
git clone https://github.com/aniltaskiran/Archy-Vertical-Tabs-Manager.git
cd Archy-Vertical-Tabs-Manager
```

2. Install dependencies:
```bash
npm install
```

3. Build the extension:
```bash
npm run build
```

4. Load in Chrome:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" 
   - Click "Load unpacked"
   - Select the `dist` folder

## Usage

### Opening Archy
- Click the Archy icon in Chrome's toolbar
- Or use the keyboard shortcut: `Cmd+Shift+A` (Mac) / `Ctrl+Shift+A` (Windows/Linux)

### Keyboard Shortcuts
- `Cmd/Ctrl + K`: Open search
- `Cmd/Ctrl + T`: New tab
- `Cmd/Ctrl + W`: Close current tab
- `Tab`: Navigate to next tab
- `Shift + Tab`: Navigate to previous tab
- `1-9`: Jump to tab by number
- `Escape`: Clear search and close menus

### Managing Tabs
- **Drag & Drop**: Click and drag tabs to reorder them
- **Pin/Unpin**: Drag tabs above or below the separator line in Today section
- **Archive**: Right-click and select "Archive Tab" to save for later
- **Add to Favorites**: Right-click and select "Add to Favorites"

### Organizing with Folders
1. Right-click in Favorites section
2. Select "Create Folder"
3. Name your folder
4. Drag bookmarks into folders to organize

## Development

### Setup
```bash
# Install dependencies
npm install

# Start development build with watch mode
npm run dev

# Build for production
npm run build

# Type checking
npm run type-check
```

### Project Structure
```
Archy-Vertical-Tabs-Manager/
├── src/
│   ├── background/       # Background service worker
│   ├── sidepanel/       # Main UI application
│   ├── components/      # React components
│   ├── hooks/          # Custom React hooks
│   ├── utils/          # Utility functions
│   └── types/          # TypeScript type definitions
├── icons/              # Extension icons
├── manifest.json       # Chrome extension manifest
└── dist/              # Build output
```

## Release Notes

### Version 1.0.0 (Current)
#### New Features
- ✅ Vertical tabs in Chrome side panel
- ✅ Drag and drop functionality
- ✅ Pinned tabs with persistent storage
- ✅ Favorites section with bookmarks
- ✅ Folder organization for bookmarks
- ✅ Chrome bookmarks API integration
- ✅ Keyboard shortcuts for navigation
- ✅ Context menus for all items
- ✅ Search functionality
- ✅ Dark theme UI
- ✅ Tab archiving
- ✅ Inline editing for folders

#### Bug Fixes
- Fixed favicon loading in side panel context
- Fixed state persistence for favorites
- Fixed drag and drop into folders
- Fixed Chrome bookmarks sync with nested folders
- Fixed keyboard shortcut toggle functionality

#### Known Issues
- Workspaces feature is planned but not yet implemented
- AI-powered grouping coming in future release

## Roadmap

### Version 1.1.0 (Planned)
- [ ] Multiple workspaces support
- [ ] Tab grouping with colors
- [ ] Import/Export settings
- [ ] Tab suspension for memory optimization

### Version 2.0.0 (Future)
- [ ] AI-powered tab organization
- [ ] Smart suggestions for grouping
- [ ] Cloud sync across devices
- [ ] Custom themes

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Inspired by Arc Browser's vertical tabs design
- Built with React, TypeScript, and Tailwind CSS
- Uses Chrome Extension Manifest V3

## Support

If you encounter any issues or have suggestions, please [open an issue](https://github.com/aniltaskiran/Archy-Vertical-Tabs-Manager/issues) on GitHub.

---

Made with ❤️ by [Anıl Taşkıran](https://github.com/aniltaskiran)