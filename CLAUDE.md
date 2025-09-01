# Archy - Vertical Tabs Manager Development Plan

## Project Overview
Archy is an AI-powered vertical tabs manager for Chrome browsers, inspired by SideSpace but with additional features and improvements.

## SideSpace Analysis Summary

**Key Features Analyzed:**
- **AI-Powered Tab Grouping**: Automatically categorizes tabs using AI
- **Vertical Tab Layout**: Sidebar with collapsible groups
- **Space Management**: Multiple workspaces for different contexts
- **Tab Suspension**: Saves memory by suspending inactive tabs
- **Cloud Sync**: Syncs tabs across devices
- **Search**: Fuzzy search across all tabs
- **Session Management**: Save/restore tab sessions
- **Duplicate Detection**: Identifies duplicate tabs
- **Group Guardian**: Custom URL-based grouping rules

## Development Plan for Archy

### Phase 1: Core Extension Setup ✅
1. ✅ Create manifest.json with proper permissions (tabs, storage, sidePanel API)
2. Set up project structure (src/, components/, styles/, utils/)
3. Implement basic side panel UI with React/TypeScript
4. Create background service worker for tab management

### Phase 2: Basic Tab Management
1. Display all open tabs in vertical layout
2. Implement tab switching, closing, and pinning
3. Add drag-and-drop to reorder tabs
4. Show tab favicons and titles
5. Implement tab search functionality

### Phase 3: Tab Grouping
1. Manual tab grouping with drag-and-drop
2. Collapsible/expandable groups
3. Group naming and color coding
4. Save group configurations

### Phase 4: AI-Powered Features
1. Integrate OpenAI API for intelligent tab grouping
2. Implement "Group by AI" functionality
3. Add custom grouping rules (like SideSpace's Group Guardian)
4. Smart suggestions for tab organization

### Phase 5: Advanced Features
1. Tab suspension for memory optimization
2. Multiple workspaces/spaces
3. Session management (save/restore)
4. Duplicate tab detection
5. Cloud sync using Chrome Storage API

### Phase 6: UI/UX Polish
1. Dark/light theme support
2. Customizable sidebar width
3. Keyboard shortcuts
4. Context menus
5. Smooth animations and transitions

## Tech Stack
- **Framework**: React with TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand or Redux Toolkit
- **Build Tool**: Vite
- **AI Integration**: OpenAI API
- **Storage**: Chrome Storage API + IndexedDB for local data

## Project Structure
```
Archy - Vertical Tabs Manager/
├── manifest.json
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.js
├── src/
│   ├── background/
│   │   └── service-worker.ts
│   ├── sidepanel/
│   │   ├── index.html
│   │   ├── index.tsx
│   │   └── App.tsx
│   ├── components/
│   │   ├── TabList.tsx
│   │   ├── TabItem.tsx
│   │   ├── TabGroup.tsx
│   │   ├── SearchBar.tsx
│   │   └── SpaceSelector.tsx
│   ├── styles/
│   │   └── globals.css
│   ├── utils/
│   │   ├── tabManager.ts
│   │   ├── aiGrouping.ts
│   │   └── storage.ts
│   └── types/
│       └── index.ts
├── icons/
│   ├── icon-16.png
│   ├── icon-32.png
│   ├── icon-48.png
│   └── icon-128.png
└── dist/ (build output)
```

## Development Commands
- `npm run dev` - Start development build with watch mode
- `npm run build` - Build for production
- `npm run type-check` - Run TypeScript type checking
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

## Current Status
- [x] Project planning and analysis
- [x] Created manifest.json
- [ ] Set up project structure
- [ ] Configure build system
- [ ] Implement basic UI
- [ ] Add tab management functionality

## Next Steps
1. Create project directory structure
2. Set up package.json with dependencies
3. Configure Vite build system
4. Create basic side panel HTML and React components
5. Implement background service worker for tab management