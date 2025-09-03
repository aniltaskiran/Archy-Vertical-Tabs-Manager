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