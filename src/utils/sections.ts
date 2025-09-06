import { Section, Tab, Bookmark, ArchivedTab, Folder } from '../types'

// Default bookmarks for Favorites
const defaultBookmarks: Bookmark[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    url: 'https://arc.net/getting-started',
    favicon: 'https://arc.net/favicon.ico'
  },
  {
    id: 'arc-resources',
    title: 'Arc Resources',
    url: 'https://resources.arc.net/',
    favicon: 'https://arc.net/favicon.ico'
  },
  {
    id: 'import-logins-bookmarks',
    title: 'Import Logins & Bookmarks',
    url: 'https://arc.net/import',
    favicon: 'https://arc.net/favicon.ico'
  },
  {
    id: 'try-arc-max',
    title: 'Try Arc Max',
    url: 'https://arc.net/max',
    favicon: 'https://arc.net/favicon.ico'
  },
  {
    id: 'the-browser-company',
    title: 'The Browser Company',
    url: 'https://thebrowser.company/',
    favicon: 'https://thebrowser.company/favicon.ico'
  },
  {
    id: 'keeping-tabs',
    title: 'Keeping Tabs',
    url: 'https://arc.net/keeping-tabs',
    favicon: 'https://arc.net/favicon.ico'
  }
]

// Default sections
export const createDefaultSections = (): Section[] => [
  {
    id: 'favorites',
    name: 'Favorites',
    type: 'favorites',
    collapsed: false,
    items: defaultBookmarks
  },
  {
    id: 'today',
    name: 'Today',
    type: 'today',
    collapsed: false,
    items: []
  },
  {
    id: 'archive',
    name: 'Archive Tabs',
    type: 'archive',
    collapsed: true,
    items: []
  }
]

// Load sections from storage
export async function loadSections(): Promise<Section[]> {
  const result = await chrome.storage.local.get('sections')
  return result.sections || createDefaultSections()
}

// Save sections to storage
export async function saveSections(sections: Section[]): Promise<void> {
  await chrome.storage.local.set({ sections })
}

// Load pinned tabs from storage
export async function loadPinnedTabs(): Promise<Tab[]> {
  const result = await chrome.storage.local.get('pinnedTabs')
  return result.pinnedTabs || []
}

// Save pinned tabs to storage
export async function savePinnedTabs(pinnedTabs: Tab[]): Promise<void> {
  await chrome.storage.local.set({ pinnedTabs })
}

// Add a new workspace section
export function createWorkspaceSection(name: string): Section {
  return {
    id: `workspace-${Date.now()}`,
    name,
    type: 'workspace',
    collapsed: false,
    items: []
  }
}

// Add tab to section
export function addTabToSection(sections: Section[], sectionId: string, tab: Tab): Section[] {
  return sections.map(section => {
    if (section.id === sectionId) {
      return {
        ...section,
        items: [...section.items, tab]
      }
    }
    return section
  })
}

// Remove tab from section
export function removeTabFromSection(sections: Section[], sectionId: string, tabId: number): Section[] {
  return sections.map(section => {
    if (section.id === sectionId) {
      return {
        ...section,
        items: section.items.filter(item => 
          item && 'id' in item && typeof item.id === 'number' ? item.id !== tabId : true
        )
      }
    }
    return section
  })
}

// Add bookmark to favorites
export function addBookmarkToFavorites(sections: Section[], bookmark: Bookmark): Section[] {
  return sections.map(section => {
    if (section.type === 'favorites') {
      // Check if bookmark already exists (by URL)
      const exists = section.items.some(item => 
        item && 'url' in item && item.url === bookmark.url
      )
      
      if (exists) {
        console.log('Bookmark already exists in favorites:', bookmark.url)
        return section
      }
      
      console.log('Adding bookmark to favorites:', bookmark)
      return {
        ...section,
        items: [...section.items, bookmark]
      }
    }
    return section
  })
}

// Remove bookmark from favorites
export function removeBookmarkFromFavorites(sections: Section[], bookmarkId: string): Section[] {
  return sections.map(section => {
    if (section.type === 'favorites') {
      return {
        ...section,
        items: section.items.filter(item => 
          item && 'id' in item && typeof item.id === 'string' ? item.id !== bookmarkId : true
        )
      }
    }
    return section
  })
}

// Archive tab
export function archiveTab(sections: Section[], tab: Tab): Section[] {
  const archivedTab: ArchivedTab = {
    ...tab,
    archivedAt: Date.now()
  }

  return sections.map(section => {
    if (section.type === 'archive') {
      return {
        ...section,
        items: [archivedTab, ...section.items]
      }
    }
    return section
  })
}

// Update ONLY the today section with current tabs and stored pinned tabs
// This preserves all other sections (favorites, archives, etc.)
export async function updateTodaySection(sections: Section[], activeTabs: Tab[], archyGroupId?: number | null): Promise<Section[]> {
  const storedPinnedTabs = await loadPinnedTabs()
  
  // Filter out tabs that are in the Archy Favorites group
  const filteredActiveTabs = archyGroupId 
    ? activeTabs.filter(tab => tab.groupId !== archyGroupId)
    : activeTabs
  
  // Create a map of active tabs by URL for quick lookup
  const activeTabsByUrl = new Map<string, Tab>()
  filteredActiveTabs.forEach(tab => {
    if (tab.url) {
      activeTabsByUrl.set(tab.url, tab)
    }
  })
  
  // Merge stored pinned tabs with active tabs
  const mergedTabs: Tab[] = []
  const seenUrls = new Set<string>()
  
  // First add all active pinned tabs (excluding Archy group)
  filteredActiveTabs.forEach(tab => {
    if (tab.pinned) {
      mergedTabs.push(tab)
      seenUrls.add(tab.url)
    }
  })
  
  // Then add stored pinned tabs that aren't currently active
  storedPinnedTabs.forEach(pinnedTab => {
    if (!seenUrls.has(pinnedTab.url)) {
      // Mark as stored/inactive
      mergedTabs.push({
        ...pinnedTab,
        id: pinnedTab.id || -Date.now(), // Negative ID for stored tabs
        pinned: true,
        active: false
      })
      seenUrls.add(pinnedTab.url)
    }
  })
  
  // Finally add all unpinned active tabs (excluding Archy group)
  filteredActiveTabs.forEach(tab => {
    if (!tab.pinned) {
      mergedTabs.push(tab)
    }
  })
  
  // IMPORTANT: Only update the Today section, preserve all other sections
  return sections.map(section => {
    if (section.type === 'today') {
      return {
        ...section,
        items: mergedTabs
      }
    }
    // Return other sections unchanged to preserve favorites, folders, etc.
    return section
  })
}

// Toggle section collapse
export function toggleSectionCollapse(sections: Section[], sectionId: string): Section[] {
  return sections.map(section => {
    if (section.id === sectionId) {
      return {
        ...section,
        collapsed: !section.collapsed
      }
    }
    return section
  })
}

// Create bookmark from tab
export function createBookmarkFromTab(tab: Tab): Bookmark {
  return {
    id: `bookmark-${Date.now()}`,
    title: tab.title,
    url: tab.url,
    favicon: tab.favIconUrl
  }
}

// Create new folder
export function createFolder(name: string): Folder {
  return {
    id: `folder-${Date.now()}`,
    name,
    type: 'folder',
    collapsed: false,
    items: []
  }
}

// Add folder to favorites section
export function addFolderToFavorites(sections: Section[], folder: Folder): Section[] {
  return sections.map(section => {
    if (section.type === 'favorites') {
      return {
        ...section,
        items: [...section.items, folder]
      }
    }
    return section
  })
}

// Remove folder from section
export function removeFolder(sections: Section[], folderId: string): Section[] {
  return sections.map(section => ({
    ...section,
    items: section.items.filter(item => 
      item && 'type' in item && item.type === 'folder' && item.id === folderId ? false : true
    )
  }))
}

// Toggle folder collapse
export function toggleFolderCollapse(sections: Section[], folderId: string): Section[] {
  return sections.map(section => ({
    ...section,
    items: section.items.map(item => {
      if (item && 'type' in item && item.type === 'folder' && item.id === folderId) {
        return {
          ...item,
          collapsed: !item.collapsed
        }
      }
      return item
    })
  }))
}

// Add bookmark to folder
export function addBookmarkToFolder(sections: Section[], folderId: string, bookmark: Bookmark): Section[] {
  console.log('➕ addBookmarkToFolder called')
  console.log('📁 Target folder ID:', folderId)
  console.log('📚 Bookmark to add:', bookmark)
  
  const result = sections.map(section => ({
    ...section,
    items: section.items.map(item => {
      if (item && 'type' in item && item.type === 'folder' && item.id === folderId) {
        console.log('✅ Found target folder:', item.name)
        console.log('📋 Current items in folder:', item.items.length)
        return {
          ...item,
          items: [...item.items, bookmark]
        }
      }
      return item
    })
  }))
  
  console.log('🔄 Updated sections after adding bookmark to folder')
  return result
}

// Remove bookmark from folder
export function removeBookmarkFromFolder(sections: Section[], folderId: string, bookmarkId: string): Section[] {
  return sections.map(section => ({
    ...section,
    items: section.items.map(item => {
      if (item && 'type' in item && item.type === 'folder' && item.id === folderId) {
        return {
          ...item,
          items: item.items.filter(bookmark => bookmark && bookmark.id !== bookmarkId)
        }
      }
      return item
    })
  }))
}

// Move bookmark from one location to folder
export function moveBookmarkToFolder(sections: Section[], bookmarkId: string, targetFolderId: string): Section[] {
  console.log('🔄 moveBookmarkToFolder called')
  console.log('📌 Bookmark ID:', bookmarkId)
  console.log('📁 Target folder ID:', targetFolderId)
  console.log('📊 Sections count:', sections.length)
  
  let bookmarkToMove: Bookmark | null = null
  
  // First, find and remove the bookmark from its current location
  let updatedSections = sections.map(section => ({
    ...section,
    items: section.items.filter(item => {
      if (item && 'url' in item && item.id === bookmarkId) {
        bookmarkToMove = item
        return false
      }
      return true
    }).map(item => {
      // Also check inside folders
      if (item && 'type' in item && item.type === 'folder') {
        const filteredItems = item.items.filter(bookmark => {
          if (bookmark && bookmark.id === bookmarkId) {
            bookmarkToMove = bookmark
            return false
          }
          return true
        })
        return { ...item, items: filteredItems }
      }
      return item
    })
  }))
  
  // Then add it to the target folder
  if (bookmarkToMove) {
    console.log('✅ Found bookmark to move:', bookmarkToMove)
    updatedSections = addBookmarkToFolder(updatedSections, targetFolderId, bookmarkToMove)
  } else {
    console.log('❌ Bookmark not found with ID:', bookmarkId)
  }
  
  console.log('📊 Final sections after move:', updatedSections)
  return updatedSections
}

// Rename folder
export function renameFolder(sections: Section[], folderId: string, newName: string): Section[] {
  return sections.map(section => ({
    ...section,
    items: section.items.map(item => {
      if (item && 'type' in item && item.type === 'folder' && item.id === folderId) {
        return {
          ...item,
          name: newName
        }
      }
      return item
    })
  }))
}