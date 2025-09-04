// Chrome Tab Groups API integration for Archy favorites and folders

const ARCHY_GROUP_TITLE = 'Archy Favorites'
const ARCHY_GROUP_COLOR: chrome.tabGroups.ColorEnum = 'blue'
const FOLDER_GROUP_COLORS: chrome.tabGroups.ColorEnum[] = ['green', 'yellow', 'red', 'pink', 'purple', 'cyan', 'orange', 'grey']

// Get or create a tab group by name
export async function getOrCreateTabGroupByName(windowId: number, groupName: string, color?: chrome.tabGroups.ColorEnum): Promise<number> {
  try {
    // Get all tab groups in the window
    const groups = await chrome.tabGroups.query({ windowId })
    
    // Find existing group by name
    const existingGroup = groups.find(group => group.title === groupName)
    
    if (existingGroup) {
      console.log('Found existing tab group:', groupName, existingGroup.id)
      return existingGroup.id
    }
    
    // Create a new tab for the group (groups need at least one tab)
    const newTab = await chrome.tabs.create({ 
      windowId,
      active: false,
      url: 'chrome://newtab'
    })
    
    // Create new group with the tab
    const groupId = await chrome.tabs.group({ 
      tabIds: [newTab.id!],
      createProperties: {
        windowId
      }
    })
    
    // Pick a color if not provided
    const groupColor = color || FOLDER_GROUP_COLORS[Math.floor(Math.random() * FOLDER_GROUP_COLORS.length)]
    
    // Configure the group
    await chrome.tabGroups.update(groupId, {
      title: groupName,
      color: groupColor,
      collapsed: false
    })
    
    // Close the new tab page we created
    setTimeout(async () => {
      try {
        await chrome.tabs.remove(newTab.id!)
      } catch (e) {
        // Tab might already be closed
      }
    }, 500)
    
    console.log('Created new tab group:', groupName, groupId)
    return groupId
  } catch (error) {
    console.error('Error getting/creating tab group:', error)
    throw error
  }
}

// Get or create the Archy tab group (for backwards compatibility)
export async function getOrCreateArchyTabGroup(windowId: number): Promise<number> {
  return getOrCreateTabGroupByName(windowId, ARCHY_GROUP_TITLE, ARCHY_GROUP_COLOR)
}

// Add tab to Archy favorites group
export async function addTabToArchyGroup(tab: chrome.tabs.Tab): Promise<void> {
  try {
    if (!tab.windowId) {
      console.error('Tab has no windowId')
      return
    }
    
    // Get or create the Archy group
    const groupId = await getOrCreateArchyTabGroup(tab.windowId)
    
    // Check if tab is already in a group
    if (tab.groupId === groupId) {
      console.log('Tab already in Archy group')
      return
    }
    
    // Check if tab already exists in the group (by URL)
    const groupTabs = await chrome.tabs.query({ groupId })
    const exists = groupTabs.some(t => t.url === tab.url && t.id !== tab.id)
    
    if (exists) {
      console.log('URL already exists in Archy group:', tab.url)
      // Close the duplicate tab
      await chrome.tabs.remove(tab.id!)
      return
    }
    
    // Add tab to the group
    await chrome.tabs.group({
      tabIds: [tab.id!],
      groupId
    })
    
    console.log('Added tab to Archy group:', tab.title)
  } catch (error) {
    console.error('Error adding tab to Archy group:', error)
  }
}

// Remove tab from Archy favorites group
export async function removeTabFromArchyGroup(tabId: number): Promise<void> {
  try {
    const tab = await chrome.tabs.get(tabId)
    
    // Check if tab is in Archy group
    if (!tab.groupId) {
      console.log('Tab is not in any group')
      return
    }
    
    const group = await chrome.tabGroups.get(tab.groupId)
    if (group.title !== ARCHY_GROUP_TITLE) {
      console.log('Tab is not in Archy group')
      return
    }
    
    // Ungroup the tab
    await chrome.tabs.ungroup([tabId])
    console.log('Removed tab from Archy group')
  } catch (error) {
    console.error('Error removing tab from Archy group:', error)
  }
}

// Create a new tab in Archy group from URL
export async function createTabInArchyGroup(url: string, title: string, windowId: number): Promise<void> {
  try {
    // Get or create the Archy group
    const groupId = await getOrCreateArchyTabGroup(windowId)
    
    // Check if URL already exists in the group
    const groupTabs = await chrome.tabs.query({ groupId })
    const exists = groupTabs.some(t => t.url === url)
    
    if (exists) {
      console.log('URL already exists in Archy group:', url)
      // Focus the existing tab
      const existingTab = groupTabs.find(t => t.url === url)
      if (existingTab) {
        await chrome.tabs.update(existingTab.id!, { active: true })
      }
      return
    }
    
    // Create new tab
    const newTab = await chrome.tabs.create({ 
      url,
      windowId,
      active: false
    })
    
    // Add to group
    await chrome.tabs.group({
      tabIds: [newTab.id!],
      groupId
    })
    
    console.log('Created new tab in Archy group:', title)
  } catch (error) {
    console.error('Error creating tab in Archy group:', error)
  }
}

// Get all tabs in Archy group
export async function getArchyGroupTabs(windowId: number): Promise<chrome.tabs.Tab[]> {
  try {
    const groups = await chrome.tabGroups.query({ windowId })
    const archyGroup = groups.find(group => group.title === ARCHY_GROUP_TITLE)
    
    if (!archyGroup) {
      return []
    }
    
    const tabs = await chrome.tabs.query({ groupId: archyGroup.id })
    return tabs
  } catch (error) {
    console.error('Error getting Archy group tabs:', error)
    return []
  }
}

// Toggle Archy group collapse state
export async function toggleArchyGroupCollapse(windowId: number): Promise<void> {
  try {
    const groups = await chrome.tabGroups.query({ windowId })
    const archyGroup = groups.find(group => group.title === ARCHY_GROUP_TITLE)
    
    if (archyGroup) {
      await chrome.tabGroups.update(archyGroup.id, {
        collapsed: !archyGroup.collapsed
      })
    }
  } catch (error) {
    console.error('Error toggling Archy group collapse:', error)
  }
}

// Update Archy group color
export async function updateArchyGroupColor(windowId: number, color: chrome.tabGroups.ColorEnum): Promise<void> {
  try {
    const groups = await chrome.tabGroups.query({ windowId })
    const archyGroup = groups.find(group => group.title === ARCHY_GROUP_TITLE)
    
    if (archyGroup) {
      await chrome.tabGroups.update(archyGroup.id, { color })
    }
  } catch (error) {
    console.error('Error updating Archy group color:', error)
  }
}

// Sync favorites to Chrome tab group (open all favorites as tabs)
export async function syncFavoritesToTabGroup(favorites: Array<{url: string, title: string}>, windowId: number): Promise<void> {
  try {
    if (favorites.length === 0) return
    
    // Get or create the Archy group
    const groupId = await getOrCreateArchyTabGroup(windowId)
    
    // Get existing tabs in the group
    const existingTabs = await chrome.tabs.query({ groupId })
    const existingUrls = new Set(existingTabs.map(tab => tab.url))
    
    // Create tabs for favorites that don't exist yet
    const newTabIds: number[] = []
    for (const favorite of favorites) {
      if (!existingUrls.has(favorite.url)) {
        const newTab = await chrome.tabs.create({
          url: favorite.url,
          windowId,
          active: false
        })
        if (newTab.id) {
          newTabIds.push(newTab.id)
        }
      }
    }
    
    // Add all new tabs to the group at once
    if (newTabIds.length > 0) {
      await chrome.tabs.group({
        tabIds: newTabIds,
        groupId
      })
      console.log(`Added ${newTabIds.length} favorites to Archy tab group`)
    }
    
    // Expand the group to show the tabs
    await chrome.tabGroups.update(groupId, {
      collapsed: false
    })
  } catch (error) {
    console.error('Error syncing favorites to tab group:', error)
  }
}

// Check if a tab is in the Archy group
export async function isTabInArchyGroup(tabId: number): Promise<boolean> {
  try {
    const tab = await chrome.tabs.get(tabId)
    if (!tab.groupId) return false
    
    const group = await chrome.tabGroups.get(tab.groupId)
    return group.title === ARCHY_GROUP_TITLE
  } catch (error) {
    console.error('Error checking if tab is in Archy group:', error)
    return false
  }
}

// Get the Archy group ID for a window
export async function getArchyGroupId(windowId: number): Promise<number | null> {
  try {
    const groups = await chrome.tabGroups.query({ windowId })
    const archyGroup = groups.find(group => group.title === ARCHY_GROUP_TITLE)
    return archyGroup?.id || null
  } catch (error) {
    console.error('Error getting Archy group ID:', error)
    return null
  }
}

// Reorder tabs in Archy group based on favorites order
export async function reorderArchyGroupTabs(favorites: Array<{url: string, title: string}>, windowId: number): Promise<void> {
  try {
    const groupId = await getArchyGroupId(windowId)
    if (!groupId) return
    
    // Get all tabs in the group
    const groupTabs = await chrome.tabs.query({ groupId })
    if (groupTabs.length === 0) return
    
    // Create a map of URL to desired index
    const urlToIndex = new Map<string, number>()
    favorites.forEach((fav, index) => {
      urlToIndex.set(fav.url, index)
    })
    
    // Sort tabs based on favorites order
    const sortedTabs = [...groupTabs].sort((a, b) => {
      const aIndex = a.url ? urlToIndex.get(a.url) ?? 999 : 999
      const bIndex = b.url ? urlToIndex.get(b.url) ?? 999 : 999
      return aIndex - bIndex
    })
    
    // Move tabs to their correct positions
    for (let i = 0; i < sortedTabs.length; i++) {
      const tab = sortedTabs[i]
      if (tab.id && tab.index !== i) {
        await chrome.tabs.move(tab.id, { index: i })
      }
    }
    
    console.log('Reordered Archy group tabs based on favorites order')
  } catch (error) {
    console.error('Error reordering Archy group tabs:', error)
  }
}

// Folder tab group management functions

// Get or create tab group for a folder
export async function getOrCreateFolderTabGroup(windowId: number, folderName: string): Promise<number> {
  return getOrCreateTabGroupByName(windowId, folderName)
}

// Add bookmark to folder's tab group
export async function addBookmarkToFolderTabGroup(
  bookmark: { url: string; title: string },
  folderName: string,
  windowId: number
): Promise<void> {
  try {
    // Get or create the folder's tab group
    const groupId = await getOrCreateFolderTabGroup(windowId, folderName)
    
    // Check if tab already exists in the group
    const groupTabs = await chrome.tabs.query({ groupId })
    const existingTab = groupTabs.find(t => t.url === bookmark.url)
    
    if (existingTab) {
      console.log('Tab already exists in folder group:', bookmark.url)
      return
    }
    
    // Create new tab in the group
    const newTab = await chrome.tabs.create({
      windowId,
      url: bookmark.url,
      active: false
    })
    
    // Add tab to the folder's group
    await chrome.tabs.group({
      tabIds: [newTab.id!],
      groupId
    })
    
    console.log('Added bookmark to folder tab group:', folderName, bookmark.title)
  } catch (error) {
    console.error('Error adding bookmark to folder tab group:', error)
  }
}

// Sync folder bookmarks with tab group
export async function syncFolderToTabGroup(
  folderName: string,
  bookmarks: Array<{ url: string; title: string }>,
  windowId: number
): Promise<void> {
  try {
    if (bookmarks.length === 0) {
      // If folder is empty, remove the tab group
      await removeFolderTabGroup(folderName, windowId)
      return
    }
    
    // Get or create the folder's tab group
    const groupId = await getOrCreateFolderTabGroup(windowId, folderName)
    
    // Get current tabs in the group
    const groupTabs = await chrome.tabs.query({ groupId })
    
    // Create a set of desired URLs
    const desiredUrls = new Set(bookmarks.map(b => b.url))
    
    // Remove tabs that shouldn't be in the group
    for (const tab of groupTabs) {
      if (tab.url && !desiredUrls.has(tab.url)) {
        await chrome.tabs.remove(tab.id!)
      }
    }
    
    // Add missing tabs
    const existingUrls = new Set(groupTabs.map(t => t.url).filter(Boolean))
    for (const bookmark of bookmarks) {
      if (!existingUrls.has(bookmark.url)) {
        const newTab = await chrome.tabs.create({
          windowId,
          url: bookmark.url,
          active: false
        })
        
        await chrome.tabs.group({
          tabIds: [newTab.id!],
          groupId
        })
      }
    }
    
    console.log('Synced folder to tab group:', folderName)
  } catch (error) {
    console.error('Error syncing folder to tab group:', error)
  }
}

// Remove folder's tab group
export async function removeFolderTabGroup(folderName: string, windowId: number): Promise<void> {
  try {
    const groups = await chrome.tabGroups.query({ windowId })
    const folderGroup = groups.find(g => g.title === folderName)
    
    if (folderGroup) {
      // Get all tabs in the group
      const groupTabs = await chrome.tabs.query({ groupId: folderGroup.id })
      
      // Close all tabs in the group
      const tabIds = groupTabs.map(t => t.id!).filter(id => id !== undefined)
      if (tabIds.length > 0) {
        await chrome.tabs.remove(tabIds)
      }
      
      console.log('Removed folder tab group:', folderName)
    }
  } catch (error) {
    console.error('Error removing folder tab group:', error)
  }
}

// Rename folder's tab group
export async function renameFolderTabGroup(
  oldName: string,
  newName: string,
  windowId: number
): Promise<void> {
  try {
    const groups = await chrome.tabGroups.query({ windowId })
    const folderGroup = groups.find(g => g.title === oldName)
    
    if (folderGroup) {
      await chrome.tabGroups.update(folderGroup.id, {
        title: newName
      })
      console.log('Renamed folder tab group:', oldName, '->', newName)
    }
  } catch (error) {
    console.error('Error renaming folder tab group:', error)
  }
}