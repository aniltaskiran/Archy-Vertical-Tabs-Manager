# Archy - Vertical Tabs Manager

A powerful Chrome extension for managing tabs vertically with AI-powered organization, inspired by Arc browser's design.

![Version](https://img.shields.io/badge/version-0.3.0-blue)
![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-green)
![License](https://img.shields.io/badge/license-MIT-blue)

## Features

### 🎯 Core Features
- **Welcome Experience**: Interactive welcome page with features overview and what's new on every update
- **Smart Build Detection**: Automatic welcome page on new builds during development
- **Dual View Modes**: Switch between vertical sidebar and overlay mode for different workflows
- **Overlay Mode**: Cmd+T now opens Archy overlay instead of new tab for lightning-fast tab switching
- **Vertical Tab Layout**: Clean, space-efficient vertical tab organization in Chrome's side panel
- **Enhanced Drag & Drop**: Fixed drag and drop into folders, especially for newly created folders
- **Smart Sections**: Automatic organization into Today, Favorites, and Archive sections
- **Folder Management**: Create folders to organize bookmarks with nested structure support
- **Chrome Bookmarks Sync**: Automatic synchronization with Chrome bookmarks
- **Keyboard Navigation**: Full keyboard support with updated shortcuts

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
- Or use the keyboard shortcut: `Cmd+S` (Mac) / `Ctrl+S` (Windows/Linux)

### Keyboard Shortcuts
- `Cmd/Ctrl + S`: Activate Archy (open sidebar)
- `Cmd/Ctrl + T`: Open Archy overlay (replaces new tab)
- `Cmd/Ctrl + Shift + E`: Open Archy in new tab
- `Cmd/Ctrl + Shift + L`: Toggle debug console
- `↑/↓`: Navigate between tabs (in overlay mode)
- `Enter`: Select highlighted tab (in overlay mode)
- `Escape`: Close overlay and clear search

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

### Version 0.3.0 (Current)
#### 🎉 New Features
- ✨ **Welcome Page**: Interactive welcome page that shows on first install, updates, and new builds
- 🎯 **What's New Section**: Displays changelog and version history with visual timeline
- ⌨️ **Updated Keyboard Shortcuts**: Cmd+S to activate, Cmd+T for overlay (replaces new tab)
- 🔧 **Smart Build Detection**: Automatic welcome page during development with unique build IDs
- 📚 **Getting Started Guide**: Step-by-step walkthrough for new users
- 🛠️ **Settings Integration**: Easy access to welcome page via settings menu

#### 🐛 Bug Fixes  
- 🔧 **Fixed Drag & Drop**: Resolved issues with dropping items into newly created folders
- 📁 **Folder Drop Handlers**: Fixed dragProps conflicts that prevented folder drops
- ⚙️ **Service Worker**: Resolved registration errors and syntax issues
- 🎯 **Build System**: Improved ES2020 compatibility for better Chrome support

#### 💫 Improvements
- 📱 **Responsive Welcome UI**: Beautiful responsive design with sidebar navigation
- 🎨 **Visual Polish**: Enhanced hover states, transitions, and visual feedback
- 📖 **Documentation**: Comprehensive keyboard shortcuts reference
- 🔄 **Version Management**: Automatic version detection and update notifications

### Version 0.2.2
#### Bug Fixes
- 🐛 Fixed issue where reactivating extension reopened all saved bookmarks
- 📌 Bookmarks now only open when explicitly clicked by user
- 🔧 Improved extension activation behavior

### Version 0.2.1
#### New Features
- ✨ Enhanced keyboard navigation for overlay mode
- ⌨️ Arrow keys (↑/↓) to navigate between tabs
- ⌨️ Enter key to select highlighted tab
- ⌨️ Number keys (1-9) for quick tab selection
- 🎯 Visual highlighting with smooth animations
- 🔄 Seamless transition between keyboard and mouse navigation
- 📍 Smart scroll-to-view for highlighted tabs

#### Improvements
- Better accessibility with keyboard-only navigation
- Smooth scrolling to keep highlighted tabs in view
- Visual feedback for keyboard navigation
- Maintained all existing overlay features

### Version 0.2.0
#### New Features
- 🎨 Omni-style overlay mode for quick tab switching
- ⌨️ Cmd/Ctrl+Shift+Space to toggle overlay
- 🔍 Instant search with real-time filtering
- ⚡ Lightning-fast tab switching
- 🎯 Click outside or Escape to dismiss
- 📐 Centered overlay with backdrop blur
- 🖱️ Full mouse support with hover effects

### Version 0.1.0
#### New Features
- 🆕 New tab view mode switch (Vertical/Overlay)
- 🎨 Omni-inspired overlay interface
- ⌨️ Quick access with Cmd/Ctrl+Shift+Space
- 🔄 Smooth mode transitions
- 💾 Persistent mode preference
- 🎯 Centered overlay design
- ⚡ Instant tab switching

### Version 0.0.3
#### New Features
- 📚 Enhanced bookmark management system
- 🔄 Real-time Chrome bookmarks synchronization
- 📁 Multi-level nested folder support
- 🎯 Drag and drop bookmarks between folders
- ✏️ Inline editing for bookmark/folder names
- 🗑️ Delete bookmarks and folders
- 🔍 Smart bookmark deduplication

### Version 0.0.2
#### New Features
- ✅ Chrome Tab Groups integration for favorites
- ✅ Nested subfolder support (unlimited levels)
- ✅ Drag tabs directly into folders from Today section
- ✅ Smart differential updates (folders don't collapse on tab changes)
- ✅ Clear All button for Today section
- ✅ Improved drag and drop with proper move semantics
- ✅ Tab group order syncing with favorites

#### Improvements
- Today section is now non-collapsible with separator design
- Favorites excluded from Today section (no duplicates)
- Better state preservation during updates
- Enhanced folder drop zone detection
- Visual indicators for tabs in Archy group

#### Bug Fixes
- Fixed folder drag and drop not saving properly
- Fixed folders collapsing on tab changes
- Fixed move to folder functionality
- Fixed tab group synchronization

### Version 0.0.1 (Initial Release)
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

### Version 0.3.0 (Next)
- [ ] Tab grouping with colors and custom names
- [ ] Tab suspension for memory optimization
- [ ] Import/Export settings and sessions
- [ ] Custom theme support (light/dark/custom)

### Version 1.0.0 (Planned)
- [ ] Multiple workspaces support
- [ ] Advanced search with filters
- [ ] Tab history and recently closed tabs
- [ ] Customizable keyboard shortcuts

### Version 2.0.0 (Future)
- [ ] AI-powered tab organization
- [ ] Smart suggestions for grouping
- [ ] Cloud sync across devices
- [ ] Tab insights and analytics

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