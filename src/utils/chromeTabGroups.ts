// Chrome Tab Groups API integration for Archy favorites

const ARCHY_GROUP_TITLE = 'Archy Favorites'
const ARCHY_GROUP_COLOR: chrome.tabGroups.ColorEnum = 'blue'

// Get or create the Archy tab group
export async function getOrCreateArchyTabGroup(windowId: number): Promise<number> {
  try {
    // Get all tab groups in the window
    const groups = await chrome.tabGroups.query({ windowId })
    
    // Find existing Archy group
    const archyGroup = groups.find(group => group.title === ARCHY_GROUP_TITLE)
    
    if (archyGroup) {
      console.log('Found existing Archy tab group:', archyGroup.id)
      return archyGroup.id
    }
    
    // Create a new tab for the group (groups need at least one tab)
    const newTab = await chrome.tabs.create({ 
      windowId,
      active: false 
    })
    
    // Create new group with the tab
    const groupId = await chrome.tabs.group({ 
      tabIds: [newTab.id!],
      createProperties: {
        windowId
      }
    })
    
    // Configure the group
    await chrome.tabGroups.update(groupId, {
      title: ARCHY_GROUP_TITLE,
      color: ARCHY_GROUP_COLOR,
      collapsed: false
    })
    
    console.log('Created new Archy tab group:', groupId)
    return groupId
  } catch (error) {
    console.error('Error getting/creating Archy tab group:', error)
    throw error
  }
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