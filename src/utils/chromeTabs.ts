import { Tab } from '../types'

export async function getAllTabs(): Promise<Tab[]> {
  try {
    const tabs = await chrome.tabs.query({})
    return tabs.filter(tab => 
      tab.url && 
      !tab.url.startsWith('chrome://') && 
      !tab.url.startsWith('chrome-extension://')
    ).map(tab => ({
      id: tab.id || 0,
      title: tab.title || '',
      url: tab.url || '',
      favIconUrl: tab.favIconUrl || '',
      windowId: tab.windowId || 0,
      index: tab.index,
      pinned: tab.pinned || false,
      active: tab.active || false,
      audible: tab.audible || false,
      mutedInfo: tab.mutedInfo,
      groupId: tab.groupId
    }))
  } catch (error) {
    console.error('Error getting all tabs:', error)
    return []
  }
}

export async function getCurrentWindowTabs(): Promise<Tab[]> {
  try {
    const currentWindow = await chrome.windows.getCurrent()
    const tabs = await chrome.tabs.query({ windowId: currentWindow.id })
    
    return tabs.filter(tab => 
      tab.url && 
      !tab.url.startsWith('chrome://') && 
      !tab.url.startsWith('chrome-extension://')
    ).map(tab => ({
      id: tab.id || 0,
      title: tab.title || '',
      url: tab.url || '',
      favIconUrl: tab.favIconUrl || '',
      windowId: tab.windowId || 0,
      index: tab.index,
      pinned: tab.pinned || false,
      active: tab.active || false,
      audible: tab.audible || false,
      mutedInfo: tab.mutedInfo,
      groupId: tab.groupId
    }))
  } catch (error) {
    console.error('Error getting current window tabs:', error)
    return []
  }
}

export async function switchToTab(tabId: number): Promise<void> {
  try {
    const tab = await chrome.tabs.get(tabId)
    await chrome.tabs.update(tabId, { active: true })
    if (tab.windowId) {
      await chrome.windows.update(tab.windowId, { focused: true })
    }
  } catch (error) {
    console.error('Error switching to tab:', error)
  }
}

export async function closeTab(tabId: number): Promise<void> {
  try {
    await chrome.tabs.remove(tabId)
  } catch (error) {
    console.error('Error closing tab:', error)
  }
}

export async function createNewTab(url?: string, windowId?: number): Promise<Tab | null> {
  try {
    const tab = await chrome.tabs.create({ 
      url: url || 'chrome://newtab/',
      windowId: windowId || undefined 
    })
    
    return {
      id: tab.id || 0,
      title: tab.title || '',
      url: tab.url || '',
      favIconUrl: tab.favIconUrl || '',
      windowId: tab.windowId || 0,
      index: tab.index,
      pinned: tab.pinned || false,
      active: tab.active || false,
      audible: tab.audible || false,
      mutedInfo: tab.mutedInfo,
      groupId: tab.groupId
    }
  } catch (error) {
    console.error('Error creating new tab:', error)
    return null
  }
}

export async function pinTab(tabId: number, pinned: boolean): Promise<void> {
  try {
    await chrome.tabs.update(tabId, { pinned })
  } catch (error) {
    console.error('Error pinning/unpinning tab:', error)
  }
}

export async function muteTab(tabId: number, muted: boolean): Promise<void> {
  try {
    await chrome.tabs.update(tabId, { muted })
  } catch (error) {
    console.error('Error muting/unmuting tab:', error)
  }
}

export async function duplicateTab(tabId: number): Promise<Tab | null> {
  try {
    const tab = await chrome.tabs.duplicate(tabId)
    if (!tab) return null
    
    return {
      id: tab.id || 0,
      title: tab.title || '',
      url: tab.url || '',
      favIconUrl: tab.favIconUrl || '',
      windowId: tab.windowId || 0,
      index: tab.index,
      pinned: tab.pinned || false,
      active: tab.active || false,
      audible: tab.audible || false,
      mutedInfo: tab.mutedInfo,
      groupId: tab.groupId
    }
  } catch (error) {
    console.error('Error duplicating tab:', error)
    return null
  }
}

export async function reloadTab(tabId: number, bypassCache = false): Promise<void> {
  try {
    await chrome.tabs.reload(tabId, { bypassCache })
  } catch (error) {
    console.error('Error reloading tab:', error)
  }
}