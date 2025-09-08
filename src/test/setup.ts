import '@testing-library/jest-dom';

// Mock Chrome API
global.chrome = {
  tabs: {
    query: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    get: jest.fn(),
    move: jest.fn(),
    group: jest.fn(),
    ungroup: jest.fn(),
    highlight: jest.fn(),
    duplicate: jest.fn(),
    sendMessage: jest.fn(),
    onCreated: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
    onUpdated: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
    onRemoved: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
    onActivated: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
  },
  storage: {
    local: {
      get: jest.fn((keys, callback) => {
        if (callback) callback({});
        return Promise.resolve({});
      }),
      set: jest.fn((items, callback) => {
        if (callback) callback();
        return Promise.resolve();
      }),
      remove: jest.fn((keys, callback) => {
        if (callback) callback();
        return Promise.resolve();
      }),
      clear: jest.fn((callback) => {
        if (callback) callback();
        return Promise.resolve();
      }),
    },
    onChanged: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
  },
  runtime: {
    sendMessage: jest.fn(),
    getManifest: jest.fn(() => ({
      version: '1.0.0',
      name: 'Archy Test',
    })),
    getURL: jest.fn((path) => `chrome-extension://test-id/${path}`),
    onMessage: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
    onInstalled: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
    lastError: null,
    id: 'test-extension-id',
    reload: jest.fn(),
  },
  windows: {
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    get: jest.fn(),
    getAll: jest.fn(),
    getCurrent: jest.fn(),
    onCreated: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
    onRemoved: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
  },
  notifications: {
    create: jest.fn(),
    clear: jest.fn(),
    update: jest.fn(),
  },
  permissions: {
    contains: jest.fn(() => Promise.resolve(true)),
    request: jest.fn(() => Promise.resolve(true)),
  },
  management: {
    getSelf: jest.fn((callback) => {
      callback({ installType: 'development' });
    }),
  },
} as any;

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
  takeRecords() {
    return [];
  }
} as any;

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
} as any;