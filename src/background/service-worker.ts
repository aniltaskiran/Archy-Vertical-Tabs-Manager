// Background service worker for Archy extension

// Track side panel state per window
const sidePanelState = new Map<number, boolean>()

// Track debug mode state
let debugModeEnabled = false

// Load debug mode state
chrome.storage.local.get('debugMode', (result) => {
  debugModeEnabled = result.debugMode || false
})

// Listen for debug mode changes
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local' && changes.debugMode) {
    debugModeEnabled = changes.debugMode.newValue || false
  }
})

// Capture and forward console logs to content script
const originalLog = console.log
const originalWarn = console.warn
const originalError = console.error
const originalInfo = console.info

function forwardLog(level: string, args: any[]) {
  if (!debugModeEnabled) return // Don't forward logs if debug mode is disabled
  
  // Send to all tabs with content script
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach(tab => {
      if (tab.id && tab.url && !tab.url.startsWith('chrome://') && !tab.url.startsWith('chrome-extension://')) {
        chrome.tabs.sendMessage(tab.id, {
          type: 'DEBUG_LOG',
          level,
          args: args.map(arg => {
            if (typeof arg === 'object') {
              try {
                return JSON.stringify(arg, null, 2)
              } catch {
                return String(arg)
              }
            }
            return String(arg)
          })
        }).catch(() => {})
      }
    })
  })
}

console.log = (...args: any[]) => {
  originalLog.apply(console, args)
  // Use setTimeout to avoid recursive calls when forwardLog uses console
  setTimeout(() => forwardLog('log', args), 0)
}

console.warn = (...args: any[]) => {
  originalWarn.apply(console, args)
  setTimeout(() => forwardLog('warn', args), 0)
}

console.error = (...args: any[]) => {
  originalError.apply(console, args)
  setTimeout(() => forwardLog('error', args), 0)
}

console.info = (...args: any[]) => {
  originalInfo.apply(console, args)
  setTimeout(() => forwardLog('info', args), 0)
}

chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('Archy extension installed/updated', details)
  
  // Open welcome page on install or update
  if (details.reason === 'install') {
    // New installation
    chrome.tabs.create({
      url: chrome.runtime.getURL('src/welcome/index.html'),
      active: true
    })
  } else if (details.reason === 'update') {
    // Extension updated
    const currentVersion = chrome.runtime.getManifest().version
    const previousVersion = details.previousVersion
    
    // Only show welcome page for significant updates
    if (previousVersion && previousVersion !== currentVersion) {
      chrome.tabs.create({
        url: chrome.runtime.getURL('src/welcome/index.html'),
        active: true
      })
    }
  }
});

// Check build ID on startup (for development reloads)
// This runs immediately when service worker starts
(async () => {
  // Small delay to ensure everything is initialized
  await new Promise(resolve => setTimeout(resolve, 500))
  
  try {
    // Fetch current build info
    const response = await fetch(chrome.runtime.getURL('build-info.json'))
    const buildInfo = await response.json()
    const currentBuildId = buildInfo.buildId
    
    console.log('Current Build ID:', currentBuildId)
    
    // Check stored build ID and session flag
    const result = await chrome.storage.local.get(['lastBuildId', 'previousVersion'])
    const sessionResult = await chrome.storage.session.get([`welcomeShown_${currentBuildId}`])
    const lastBuildId = result.lastBuildId
    const currentVersion = chrome.runtime.getManifest().version
    const hasShownThisSession = sessionResult[`welcomeShown_${currentBuildId}`]
    
    // Show welcome page if build ID changed AND not shown in this session
    if ((currentBuildId !== lastBuildId || !result.previousVersion) && !hasShownThisSession) {
      console.log('New build detected or first run, showing welcome page')
      console.log('Last Build ID:', lastBuildId, 'Current Build ID:', currentBuildId)
      
      chrome.tabs.create({
        url: chrome.runtime.getURL('src/welcome/index.html'),
        active: true
      })
      
      // Save current build ID, version, and session flag
      await chrome.storage.local.set({ 
        lastBuildId: currentBuildId,
        previousVersion: currentVersion 
      })
      await chrome.storage.session.set({ 
        [`welcomeShown_${currentBuildId}`]: true 
      })
    } else {
      if (hasShownThisSession) {
        console.log('Welcome page already shown for this build in current session')
      } else {
        console.log('Same build, not showing welcome page')
      }
    }
  } catch (error) {
    console.error('Error checking build ID:', error)
    // Fallback to version check
    const result = await chrome.storage.local.get(['previousVersion'])
    const currentVersion = chrome.runtime.getManifest().version
    
    if (!result.previousVersion) {
      console.log('No previous version found (fallback), showing welcome page')
      chrome.tabs.create({
        url: chrome.runtime.getURL('src/welcome/index.html'),
        active: true
      })
      await chrome.storage.local.set({ previousVersion: currentVersion })
    }
  }
})();

// Handle keyboard shortcuts
chrome.commands.onCommand.addListener((command) => {
  if (command === 'open-archy-tab') {
    chrome.tabs.create({ url: chrome.runtime.getURL('src/newtab/index.html') })
  } else if (command === 'open-archy-overlay') {
    // Send message to current tab to toggle overlay
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, { type: 'TOGGLE_OVERLAY' })
      }
    })
  } else if (command === 'toggle-debug-console') {
    // Debug console is now integrated into overlay
    // This command is handled directly in content.ts
  }
})

// Handle extension icon click and keyboard shortcut
// This must be synchronous to preserve user gesture context
chrome.action.onClicked.addListener((tab) => {
  if (!tab.windowId) return
  
  const windowId = tab.windowId
  const isOpen = sidePanelState.get(windowId) || false
  
  if (isOpen) {
    // Panel is likely open, send close message
    // Note: We can't actually close the panel programmatically
    // The best we can do is notify the panel to close itself
    chrome.runtime.sendMessage({ 
      type: 'CLOSE_SIDEPANEL',
      windowId 
    }).catch(() => {})
    
    sidePanelState.set(windowId, false)
    
    // Focus the main window as a visual cue
    chrome.windows.update(windowId, { focused: true })
  } else {
    // Panel is closed, open it
    // This must be called synchronously in the event handler
    chrome.sidePanel.open({ windowId }).then(() => {
      sidePanelState.set(windowId, true)
    }).catch(error => {
      console.error('Error opening side panel:', error)
    })
  }
})

// Listen for tab updates to refresh the side panel
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // Send message to side panel to refresh if it's open
  if (changeInfo.status === 'complete' || changeInfo.title) {
    chrome.runtime.sendMessage({ 
      type: 'TAB_UPDATED', 
      tabId, 
      changeInfo, 
      tab 
    }).catch(() => {
      // Side panel might not be open, ignore error
    })
  }
})

// Listen for new tabs
chrome.tabs.onCreated.addListener((tab) => {
  chrome.runtime.sendMessage({ 
    type: 'TAB_CREATED', 
    tab 
  }).catch(() => {
    // Side panel might not be open, ignore error
  })
})

// Listen for removed tabs
chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
  chrome.runtime.sendMessage({ 
    type: 'TAB_REMOVED', 
    tabId, 
    removeInfo 
  }).catch(() => {
    // Side panel might not be open, ignore error
  })
})

// Listen for tab activation changes
chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.runtime.sendMessage({ 
    type: 'TAB_ACTIVATED', 
    activeInfo 
  }).catch(() => {
    // Side panel might not be open, ignore error
  })
})

// Listen for window focus changes
chrome.windows.onFocusChanged.addListener((windowId) => {
  if (windowId !== chrome.windows.WINDOW_ID_NONE) {
    chrome.runtime.sendMessage({ 
      type: 'WINDOW_FOCUS_CHANGED', 
      windowId 
    }).catch(() => {
      // Side panel might not be open, ignore error
    })
  }
})

// Handle messages from the side panel and content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Handle open sidebar request from welcome page
  if (message.type === 'OPEN_SIDEBAR') {
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      if (tabs[0]?.id && tabs[0]?.windowId) {
        // Open the side panel
        await chrome.sidePanel.open({ windowId: tabs[0].windowId })
      }
    })
    sendResponse({ success: true })
    return true
  }
  
  // Forward logs from side panel to content scripts
  if (message.type === 'FORWARD_LOG') {
    forwardLog(message.level, message.args)
    sendResponse({ success: true })
    return true
  }
  
  switch (message.type) {
    case 'GET_ALL_TABS':
      getAllTabs().then(sendResponse)
      return true // Will respond asynchronously

    case 'GET_TABS_FOR_OVERLAY':
      getTabsForOverlay().then(sendResponse)
      return true

    case 'SEARCH_ALL':
      searchAll(message.query).then(sendResponse)
      return true

    case 'SWITCH_TO_TAB':
      switchToTab(message.tabId, message.windowId).then(sendResponse)
      return true

    case 'CLOSE_TAB':
      closeTab(message.tabId).then(sendResponse)
      return true

    case 'CREATE_NEW_TAB':
      createNewTab(message.windowId, message.url).then(sendResponse)
      return true
    
    case 'CREATE_NEW_WINDOW':
      createNewWindow(message.url).then(sendResponse)
      return true
    
    case 'MOVE_TAB_TO_NEW_WINDOW':
      moveTabToNewWindow(message.tabId).then(sendResponse)
      return true

    case 'OPEN_SEARCH_RESULT':
      openSearchResult(message.result, message.newWindow).then(sendResponse)
      return true
      
    case 'PING_SIDEPANEL':
      // Respond to ping to indicate panel is open
      sendResponse({ alive: true })
      return true
      
    case 'SIDEPANEL_OPENED':
      // Track that the panel was opened
      if (message.windowId) {
        sidePanelState.set(message.windowId, true)
      }
      sendResponse({ success: true })
      return true
      
    case 'SIDEPANEL_CLOSED':
      // Track that the panel was closed
      if (message.windowId) {
        sidePanelState.set(message.windowId, false)
      }
      sendResponse({ success: true })
      return true
  }
})

async function getAllTabs() {
  try {
    const windows = await chrome.windows.getAll({ populate: true })
    return windows.filter(window => window.type === 'normal')
  } catch (error) {
    console.error('Error getting all tabs:', error)
    return []
  }
}

async function switchToTab(tabId: number, windowId: number) {
  try {
    await chrome.tabs.update(tabId, { active: true })
    await chrome.windows.update(windowId, { focused: true })
    return { success: true }
  } catch (error) {
    console.error('Error switching to tab:', error)
    return { success: false, error: error.message }
  }
}

async function closeTab(tabId: number) {
  try {
    await chrome.tabs.remove(tabId)
    return { success: true }
  } catch (error) {
    console.error('Error closing tab:', error)
    return { success: false, error: error.message }
  }
}

async function createNewTab(windowId?: number, url?: string) {
  try {
    const tab = await chrome.tabs.create({ 
      windowId: windowId || undefined,
      url: url || undefined 
    })
    return { success: true, tab }
  } catch (error) {
    console.error('Error creating new tab:', error)
    return { success: false, error: error.message }
  }
}

async function getTabsForOverlay() {
  try {
    const tabs = await chrome.tabs.query({})
    return { 
      tabs: tabs.filter(tab => 
        tab.url && 
        !tab.url.startsWith('chrome://') && 
        !tab.url.startsWith('chrome-extension://')
      ).map(tab => ({
        id: tab.id,
        title: tab.title || 'Untitled',
        url: tab.url || '',
        favIconUrl: tab.favIconUrl || '',
        windowId: tab.windowId,
        active: tab.active,
        pinned: tab.pinned
      }))
    }
  } catch (error) {
    console.error('Error getting tabs for overlay:', error)
    return { tabs: [] }
  }
}

async function createNewWindow(url?: string) {
  try {
    const window = await chrome.windows.create({
      url: url || undefined,
      focused: true
    })
    return { success: true, window }
  } catch (error) {
    console.error('Error creating new window:', error)
    return { success: false, error: error.message }
  }
}

async function moveTabToNewWindow(tabId: number) {
  try {
    // First get the tab details
    const tab = await chrome.tabs.get(tabId)
    
    // Create a new window with the tab
    const window = await chrome.windows.create({
      tabId: tabId,
      focused: true
    })
    
    return { success: true, window }
  } catch (error) {
    console.error('Error moving tab to new window:', error)
    return { success: false, error: error.message }
  }
}

async function searchAll(query: string) {
  if (!query || query.trim() === '') {
    return { results: [] }
  }

  const lowerQuery = query.toLowerCase()
  const results: any[] = []

  try {
    // Search tabs
    const tabs = await chrome.tabs.query({})
    const tabResults = tabs
      .filter(tab => 
        tab.url && 
        !tab.url.startsWith('chrome://') && 
        !tab.url.startsWith('chrome-extension://') &&
        (tab.title?.toLowerCase().includes(lowerQuery) || 
         tab.url.toLowerCase().includes(lowerQuery))
      )
      .map(tab => ({
        id: `tab-${tab.id}`,
        title: tab.title || 'Untitled',
        url: tab.url || '',
        favicon: tab.favIconUrl || '',
        type: 'tab' as const,
        tabId: tab.id,
        windowId: tab.windowId
      }))

    results.push(...tabResults)

    // Search bookmarks
    try {
      const bookmarkTree = await chrome.bookmarks.getTree()
      const bookmarks: any[] = []
      
      const traverseBookmarks = (nodes: chrome.bookmarks.BookmarkTreeNode[]) => {
        nodes.forEach(node => {
          if (node.url && !node.url.startsWith('chrome://') && !node.url.startsWith('chrome-extension://')) {
            bookmarks.push({
              id: `bookmark-${node.id}`,
              title: node.title || 'Untitled',
              url: node.url,
              favicon: `chrome://favicon/${node.url}`,
              type: 'bookmark' as const
            })
          }
          if (node.children) {
            traverseBookmarks(node.children)
          }
        })
      }
      
      traverseBookmarks(bookmarkTree)
      
      const bookmarkResults = bookmarks.filter(bookmark =>
        bookmark.title.toLowerCase().includes(lowerQuery) ||
        bookmark.url.toLowerCase().includes(lowerQuery)
      )
      
      results.push(...bookmarkResults)
    } catch (error) {
      console.warn('Could not search bookmarks:', error)
    }

    // Search history
    try {
      const historyItems = await chrome.history.search({
        text: query,
        maxResults: 20
      })
      
      const historyResults = historyItems
        .filter(item => 
          item.url && 
          !item.url.startsWith('chrome://') && 
          !item.url.startsWith('chrome-extension://') &&
          (item.title?.toLowerCase().includes(lowerQuery) || 
           item.url.toLowerCase().includes(lowerQuery))
        )
        .map(item => ({
          id: `history-${item.id}`,
          title: item.title || 'Untitled',
          url: item.url || '',
          favicon: `chrome://favicon/${item.url}`,
          type: 'history' as const,
          lastVisitTime: item.lastVisitTime,
          visitCount: item.visitCount
        }))

      results.push(...historyResults)
    } catch (error) {
      console.warn('Could not search history:', error)
    }

    // Sort results by relevance and type priority
    results.sort((a, b) => {
      // Prioritize tabs first, then bookmarks, then history
      const typePriority = { tab: 0, bookmark: 1, history: 2 }
      if (a.type !== b.type) {
        return typePriority[a.type] - typePriority[b.type]
      }
      
      // For same type, prioritize exact title matches
      const aExactTitle = a.title.toLowerCase() === lowerQuery
      const bExactTitle = b.title.toLowerCase() === lowerQuery
      if (aExactTitle !== bExactTitle) {
        return aExactTitle ? -1 : 1
      }
      
      // Then title starts with query
      const aTitleStarts = a.title.toLowerCase().startsWith(lowerQuery)
      const bTitleStarts = b.title.toLowerCase().startsWith(lowerQuery)
      if (aTitleStarts !== bTitleStarts) {
        return aTitleStarts ? -1 : 1
      }
      
      // For history items, prefer more frequently visited
      if (a.type === 'history' && b.type === 'history') {
        return (b.visitCount || 0) - (a.visitCount || 0)
      }
      
      return 0
    })

    return { results: results.slice(0, 50) } // Limit to 50 results
  } catch (error) {
    console.error('Error searching:', error)
    return { results: [] }
  }
}

async function openSearchResult(result: any, newWindow = false) {
  try {
    if (result.type === 'tab') {
      // Switch to existing tab
      await switchToTab(result.tabId, result.windowId)
      return { success: true }
    } else {
      // Open bookmark or history item as new tab or window
      if (newWindow) {
        await createNewWindow(result.url)
      } else {
        await createNewTab(undefined, result.url)
      }
      return { success: true }
    }
  } catch (error) {
    console.error('Error opening search result:', error)
    return { success: false, error: error.message }
  }
}