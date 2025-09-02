// Background service worker for Archy extension

// Track side panel state per window
const sidePanelState = new Map<number, boolean>()

chrome.runtime.onInstalled.addListener(() => {
  console.log('Archy extension installed')
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

// Handle messages from the side panel
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'GET_ALL_TABS':
      getAllTabs().then(sendResponse)
      return true // Will respond asynchronously

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