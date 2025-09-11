export interface Tab {
  id: number
  url: string
  title: string
  favIconUrl?: string
  active: boolean
  pinned: boolean
  windowId: number
  index: number
  groupId?: number
}

export interface TabGroup {
  id: number
  title?: string
  color: chrome.tabGroups.ColorEnum
  collapsed: boolean
}

export interface ChromeWindow {
  id: number
  focused: boolean
  type: chrome.windows.WindowType
  state: chrome.windows.WindowState
  tabs: Tab[]
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system'
  showPinnedTabs: boolean
  showTabsGroupedPerWindow: boolean
  showTabsForSelectedWindow: boolean
  sidebarWidth: number
  autoGroupTabs: boolean
  enabledPlugins: string[]
}

export interface Plugin {
  id: string
  name: string
  version: string
  description: string
  author: string
  icon?: string
  code: string
  permissions: string[]
  category: 'productivity' | 'tabs' | 'ui' | 'utility' | 'experimental'
  rating: number
  downloads: number
  lastUpdated: string
}

export interface PluginExecutionContext {
  tabs: Tab[]
  groups: TabGroup[]
  windows: ChromeWindow[]
  settings: AppSettings
  chrome: typeof chrome
}

export interface XbarPlugin {
  id: string
  name: string
  version: string
  description: string
  author: string
  icon?: string
  script: string
  refreshInterval: number // in milliseconds
  permissions: string[]
  category: 'productivity' | 'tabs' | 'ui' | 'utility' | 'experimental'
  lastUpdated: string
  outputFormat: 'text' | 'json'
}

export interface XbarPluginOutput {
  text: string
  lines: XbarPluginLine[]
  lastUpdated: number
}

export interface XbarPluginLine {
  text: string
  dropdown?: boolean
  submenu?: boolean
  level: number
  href?: string
  onclick?: string
  color?: string
  font?: string
  size?: number
}

export interface Section {
  id: string
  name: string
  type: 'favorites' | 'today' | 'workspace' | 'archive'
  collapsed: boolean
  items: (Tab | Bookmark | Folder)[]
}

export interface Bookmark {
  id: string
  title: string
  url: string
  favicon?: string
}

export interface HistoryItem {
  id: string
  title: string
  url: string
  lastVisitTime?: number
  visitCount?: number
}

export interface SearchResult {
  id: string
  title: string
  url: string
  favicon?: string
  type: 'tab' | 'bookmark' | 'history'
  tabId?: number
  windowId?: number
  lastVisitTime?: number
  visitCount?: number
}

export interface Folder {
  id: string
  name: string
  type: 'folder'
  collapsed: boolean
  items: (Bookmark | Folder)[]  // Allow nested folders
}

export interface ArchivedTab extends Tab {
  archivedAt: number
}

export interface TabState {
  tabs: Tab[]
  windows: ChromeWindow[]
  groups: TabGroup[]
  searchQuery: string
  selectedWindowId?: number
  loading: boolean
  settings: AppSettings
}