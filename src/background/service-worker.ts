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

chrome.runtime.onInstalled.addListener(() => {
  console.log('Archy extension installed')
})

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

    case 'SWITCH_TO_TAB':
      switchToTab(message.tabId, message.windowId).then(sendResponse)
      return true

    case 'CLOSE_TAB':
      closeTab(message.tabId).then(sendResponse)
      return true

    case 'CREATE_NEW_TAB':
      createNewTab(message.windowId).then(sendResponse)
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

async function createNewTab(windowId?: number) {
  try {
    const tab = await chrome.tabs.create({ 
      windowId: windowId || undefined 
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