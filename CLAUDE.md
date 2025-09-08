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

## Development Helpers

### Quick Commands & Shortcuts
```bash
# Development workflow
npm run dev:reload    # Build and reload extension in Chrome
npm run dev:debug     # Start with debugging enabled
npm run clean         # Clean build artifacts
npm run test:watch    # Run tests in watch mode
npm run analyze       # Analyze bundle size
npm run zip           # Create extension package for Chrome Web Store
```

### Debugging Utilities
```typescript
// src/utils/debug.ts
export const debug = {
  log: (...args: any[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[Archy]', ...args);
    }
  },
  error: (...args: any[]) => {
    console.error('[Archy Error]', ...args);
  },
  time: (label: string) => {
    if (process.env.NODE_ENV === 'development') {
      console.time(`[Archy] ${label}`);
    }
  },
  timeEnd: (label: string) => {
    if (process.env.NODE_ENV === 'development') {
      console.timeEnd(`[Archy] ${label}`);
    }
  }
};
```

### Chrome Extension Helper Functions
```typescript
// src/utils/chromeHelpers.ts
// Tab management shortcuts
export const tabs = {
  getAll: () => chrome.tabs.query({}),
  getCurrent: () => chrome.tabs.query({ active: true, currentWindow: true }),
  getByGroup: (groupId: number) => chrome.tabs.query({ groupId }),
  create: (url: string) => chrome.tabs.create({ url }),
  update: (tabId: number, props: chrome.tabs.UpdateProperties) => 
    chrome.tabs.update(tabId, props),
  remove: (tabId: number) => chrome.tabs.remove(tabId),
  move: (tabId: number, index: number) => 
    chrome.tabs.move(tabId, { index }),
  group: (tabIds: number[], groupId?: number) => 
    chrome.tabs.group({ tabIds, groupId })
};

// Storage helpers with TypeScript
export const storage = {
  get: <T>(key: string): Promise<T | undefined> => 
    chrome.storage.local.get(key).then(r => r[key]),
  set: <T>(key: string, value: T) => 
    chrome.storage.local.set({ [key]: value }),
  remove: (key: string) => chrome.storage.local.remove(key),
  clear: () => chrome.storage.local.clear()
};

// Message passing helpers
export const messaging = {
  send: (message: any) => chrome.runtime.sendMessage(message),
  onMessage: (handler: (message: any) => void) => 
    chrome.runtime.onMessage.addListener(handler),
  sendToTab: (tabId: number, message: any) => 
    chrome.tabs.sendMessage(tabId, message)
};
```

### Testing Setup
```javascript
// jest.config.js
export default {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  testMatch: ['**/__tests__/**/*.ts?(x)', '**/?(*.)+(spec|test).ts?(x)'],
};

// src/test/setup.ts
global.chrome = {
  tabs: {
    query: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  },
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn(),
    },
  },
  runtime: {
    sendMessage: jest.fn(),
    onMessage: {
      addListener: jest.fn(),
    },
  },
};
```

### Environment Configuration
```bash
# .env.development
VITE_MODE=development
VITE_ENABLE_DEBUG=true
VITE_OPENAI_API_KEY=your-dev-api-key-here
VITE_LOG_LEVEL=debug

# .env.production
VITE_MODE=production
VITE_ENABLE_DEBUG=false
VITE_LOG_LEVEL=error
```

### Performance Monitoring
```typescript
// src/utils/performance.ts
export class PerformanceMonitor {
  private static metrics = new Map<string, number>();
  
  static start(label: string) {
    this.metrics.set(label, performance.now());
  }
  
  static end(label: string): number {
    const start = this.metrics.get(label);
    if (!start) return 0;
    
    const duration = performance.now() - start;
    this.metrics.delete(label);
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance] ${label}: ${duration.toFixed(2)}ms`);
    }
    
    return duration;
  }
  
  static async measure<T>(label: string, fn: () => Promise<T>): Promise<T> {
    this.start(label);
    try {
      return await fn();
    } finally {
      this.end(label);
    }
  }
}
```

### State Management DevTools
```typescript
// src/store/devtools.ts
import { devtools } from 'zustand/middleware';

// Wrap your store with devtools in development
export const createStore = process.env.NODE_ENV === 'development'
  ? devtools(storeConfig, { name: 'Archy Store' })
  : storeConfig;
```

### Hot Reload for Extension
```javascript
// src/background/hotReload.ts
if (process.env.NODE_ENV === 'development') {
  const filesInDirectory = dir => new Promise(resolve =>
    dir.createReader().readEntries(entries =>
      Promise.all(entries.filter(e => e.name[0] !== '.').map(e =>
        e.isDirectory
          ? filesInDirectory(e)
          : new Promise(resolve => e.file(resolve))
      ))
      .then(files => [].concat(...files))
      .then(resolve)
    )
  );

  const timestampForFilesInDirectory = dir =>
    filesInDirectory(dir).then(files =>
      files.map(f => f.name + f.lastModified).join()
    );

  const reload = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      if (tabs[0]) {
        chrome.tabs.reload(tabs[0].id);
      }
      chrome.runtime.reload();
    });
  };

  const watchChanges = (dir, lastTimestamp) => {
    timestampForFilesInDirectory(dir).then(timestamp => {
      if (!lastTimestamp || (lastTimestamp === timestamp)) {
        setTimeout(() => watchChanges(dir, timestamp), 1000);
      } else {
        reload();
      }
    });
  };

  chrome.management.getSelf(self => {
    if (self.installType === 'development') {
      chrome.runtime.getPackageDirectoryEntry(dir => watchChanges(dir));
    }
  });
}
```

### VSCode Settings
```json
// .vscode/settings.json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "files.exclude": {
    "dist": true,
    "node_modules": true
  },
  "search.exclude": {
    "dist": true,
    "*.lock": true
  }
}

// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Launch Chrome Extension",
      "type": "chrome",
      "request": "launch",
      "url": "chrome://extensions/",
      "webRoot": "${workspaceFolder}/src",
      "runtimeArgs": [
        "--load-extension=${workspaceFolder}/dist"
      ]
    }
  ]
}
```

### Git Hooks (with Husky)
```json
// package.json additions
"scripts": {
  "prepare": "husky install",
  "pre-commit": "lint-staged"
},
"lint-staged": {
  "*.{ts,tsx}": [
    "eslint --fix",
    "prettier --write"
  ],
  "*.{css,html,json}": "prettier --write"
}
```

### Bundle Analysis Script
```javascript
// scripts/analyze.js
import { visualizer } from 'rollup-plugin-visualizer';

// Add to vite.config.ts plugins when analyzing
plugins: [
  process.env.ANALYZE && visualizer({
    open: true,
    filename: 'dist/stats.html',
    gzipSize: true,
    brotliSize: true,
  })
]
```

### Extension Packaging Script
```bash
#!/bin/bash
# scripts/package.sh
npm run build
cd dist
zip -r ../archy-extension.zip ./*
cd ..
echo "Extension packaged as archy-extension.zip"
```

### Common Chrome Extension Issues & Solutions
```typescript
// src/utils/extensionHelpers.ts

// Fix for "Unchecked runtime.lastError"
export const safeChrome = {
  tabs: {
    query: (queryInfo: chrome.tabs.QueryInfo): Promise<chrome.tabs.Tab[]> => 
      new Promise((resolve) => {
        chrome.tabs.query(queryInfo, (tabs) => {
          if (chrome.runtime.lastError) {
            console.warn('Tab query error:', chrome.runtime.lastError);
            resolve([]);
          } else {
            resolve(tabs);
          }
        });
      }),
  },
  
  // Handle extension context invalidated
  runtime: {
    isValid: () => {
      try {
        return chrome.runtime?.id !== undefined;
      } catch {
        return false;
      }
    },
    
    reload: () => {
      if (chrome.runtime?.reload) {
        chrome.runtime.reload();
      }
    }
  }
};

// Permission checker
export const checkPermissions = async (permissions: string[]): Promise<boolean> => {
  try {
    return await chrome.permissions.contains({ permissions });
  } catch (error) {
    console.error('Permission check failed:', error);
    return false;
  }
};
```

### Development Workflow Tips
1. **Auto-reload Extension**: Use `npm run dev` with the hot reload script
2. **Debug Background Script**: chrome://extensions → Details → Inspect service worker
3. **Debug Content Script**: Right-click page → Inspect → Console
4. **Debug Side Panel**: Right-click side panel → Inspect
5. **Test Permissions**: Use permission checker before API calls
6. **Monitor Performance**: Use PerformanceMonitor for optimization
7. **State Debugging**: Install Redux DevTools Extension for Zustand
8. **Bundle Size**: Run `npm run analyze` periodically

### Useful Chrome URLs for Development
- `chrome://extensions/` - Manage extensions
- `chrome://extensions/shortcuts` - Configure keyboard shortcuts
- `chrome://inspect/#extensions` - Debug extension pages
- `chrome://policy/` - Check enterprise policies
- `chrome://version/` - Chrome version info
- `chrome://flags/` - Experimental features

### Error Handling Best Practices
```typescript
// src/utils/errorHandler.ts
export class ExtensionError extends Error {
  constructor(
    message: string,
    public code: string,
    public recoverable: boolean = true
  ) {
    super(message);
    this.name = 'ExtensionError';
  }
}

export const handleError = (error: unknown, context?: string) => {
  if (error instanceof ExtensionError) {
    console.error(`[${context || 'Extension'}] ${error.code}:`, error.message);
    
    if (!error.recoverable) {
      // Show user notification for unrecoverable errors
      chrome.notifications.create({
        type: 'basic',
        iconUrl: '/icons/icon-48.png',
        title: 'Archy Error',
        message: error.message
      });
    }
  } else {
    console.error(`[${context || 'Extension'}] Unexpected error:`, error);
  }
};
```