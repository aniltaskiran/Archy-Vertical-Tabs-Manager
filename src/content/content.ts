// Content script for Archy overlay
let isOpen = false
let overlayContainer: HTMLElement | null = null
let selectedIndex = 0
let visibleTabs: HTMLElement[] = []
let debugLogs: Array<{time: string, level: string, msg: string}> = []
let debugConsoleOpen = false
let debugMinimized = false
let debugModeEnabled = false

// Load debug mode state
chrome.storage.local.get('debugMode', (result) => {
  debugModeEnabled = result.debugMode || false
  console.log('🔧 Debug mode loaded:', debugModeEnabled)
})

// Override console methods to capture logs
const originalLog = console.log
const originalWarn = console.warn
const originalError = console.error
const originalInfo = console.info

function captureLog(level: string, args: any[]) {
  if (!debugModeEnabled) return // Don't capture logs if debug mode is disabled
  
  const time = new Date().toLocaleTimeString()
  const msg = args.map(arg => {
    if (typeof arg === 'object') {
      try {
        return JSON.stringify(arg, null, 2)
      } catch {
        return String(arg)
      }
    }
    return String(arg)
  }).join(' ')
  
  debugLogs.unshift({ time, level, msg })
  if (debugLogs.length > 100) debugLogs = debugLogs.slice(0, 100)
  
  if (debugConsoleOpen) {
    updateDebugConsole()
  }
}

console.log = (...args: any[]) => {
  originalLog.apply(console, args)
  captureLog('log', args)
}

console.warn = (...args: any[]) => {
  originalWarn.apply(console, args)
  captureLog('warn', args)
}

console.error = (...args: any[]) => {
  originalError.apply(console, args)
  captureLog('error', args)
}

console.info = (...args: any[]) => {
  originalInfo.apply(console, args)
  captureLog('info', args)
}

// Track keyboard navigation
document.addEventListener('keydown', (e) => {
  // Check for Cmd+T to open overlay (new tab shortcut)
  if ((e.metaKey || e.ctrlKey) && e.key === 't') {
    e.preventDefault()
    e.stopPropagation()
    if (!isOpen) {
      openOverlay()
    }
    return
  }
  
  // Check for Cmd+Shift+L to toggle debug console (only if debug mode is enabled)
  if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'L') {
    if (debugModeEnabled) {
      e.preventDefault()
      toggleDebugConsole()
    }
    return
  }
  
  if (!isOpen) return
  
  // Check if search input is focused
  const searchInput = document.querySelector('#archy-search-input') as HTMLInputElement
  const isSearchFocused = document.activeElement === searchInput
  
  // Cmd/Ctrl + K - Clear search and focus
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault()
    if (searchInput) {
      searchInput.value = ''
      searchInput.focus()
      handleSearch({ target: searchInput } as any)
    }
    return
  }
  
  // Cmd/Ctrl + Number (1-9) - Quick switch to tab by position
  if ((e.metaKey || e.ctrlKey) && e.key >= '1' && e.key <= '9') {
    e.preventDefault()
    const index = parseInt(e.key) - 1
    if (visibleTabs[index]) {
      highlightTab(index)
      selectCurrentTab()
    }
    return
  }
  
  // Cmd/Ctrl + W - Close selected tab
  if ((e.metaKey || e.ctrlKey) && e.key === 'w') {
    e.preventDefault()
    closeSelectedTab()
    return
  }
  
  // Cmd/Ctrl + Enter - Open selected tab in new window
  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
    e.preventDefault()
    openSelectedTabInNewWindow()
    return
  }
  
  // Delete/Backspace - Close selected tab (only when not in search input)
  if (!isSearchFocused && (e.key === 'Delete' || e.key === 'Backspace')) {
    e.preventDefault()
    closeSelectedTab()
    return
  }
  
  switch(e.key) {
    case 'Escape':
      closeOverlay()
      break
    case 'ArrowDown':
      e.preventDefault()
      navigateDown()
      break
    case 'ArrowUp':
      e.preventDefault()
      navigateUp()
      break
    case 'Tab':
      e.preventDefault()
      if (e.shiftKey) {
        navigateUp()
      } else {
        navigateDown()
      }
      break
    case 'Enter':
      if (!e.metaKey && !e.ctrlKey) {
        e.preventDefault()
        selectCurrentTab()
      }
      break
  }
}, true) // Use capture phase to intercept before other handlers

// Initialize overlay when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeOverlay)
} else {
  initializeOverlay()
}

function initializeOverlay() {
  // Create overlay container
  overlayContainer = document.createElement('div')
  overlayContainer.id = 'archy-overlay-container'
  overlayContainer.style.display = 'none'
  document.body.appendChild(overlayContainer)
  
  // Load overlay HTML
  fetch(chrome.runtime.getURL('src/content/overlay.html'))
    .then(response => response.text())
    .then(html => {
      if (overlayContainer) {
        overlayContainer.innerHTML = html
        setupOverlayEvents()
      }
    })
}

function setupOverlayEvents() {
  // Close button
  const closeBtn = document.querySelector('#archy-overlay-close')
  if (closeBtn) {
    closeBtn.addEventListener('click', closeOverlay)
  }
  
  // Click outside to close
  overlayContainer?.addEventListener('click', (e) => {
    if (e.target === overlayContainer) {
      closeOverlay()
    }
  })
  
  // Search input
  const searchInput = document.querySelector('#archy-search-input') as HTMLInputElement
  if (searchInput) {
    searchInput.addEventListener('input', handleSearch)
  }
  
  // Debug console controls
  setupDebugControls()
}

function setupDebugControls() {
  const testBtn = document.querySelector('#archy-debug-test')
  const clearBtn = document.querySelector('#archy-debug-clear')
  const copyBtn = document.querySelector('#archy-debug-copy')
  const minimizeBtn = document.querySelector('#archy-debug-minimize')
  
  if (testBtn) {
    testBtn.addEventListener('click', () => {
      console.log('🧪 Test log from overlay')
      console.info('ℹ️ Info message test')
      console.warn('⚠️ Warning message test')
      console.error('❌ Error message test')
      console.log('Debug mode enabled:', debugModeEnabled)
      console.log('Debug console open:', debugConsoleOpen)
      console.log('Total logs captured:', debugLogs.length)
    })
  }
  
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      debugLogs = []
      updateDebugConsole()
    })
  }
  
  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      const logText = debugLogs.map(log => 
        `[${log.time}] ${log.level.toUpperCase()}: ${log.msg}`
      ).join('\n')
      navigator.clipboard.writeText(logText)
    })
  }
  
  if (minimizeBtn) {
    minimizeBtn.addEventListener('click', () => {
      debugMinimized = !debugMinimized
      const debugConsole = document.querySelector('#archy-debug-console') as HTMLElement
      if (debugConsole) {
        if (debugMinimized) {
          debugConsole.classList.add('minimized')
        } else {
          debugConsole.classList.remove('minimized')
        }
      }
    })
  }
}

function toggleDebugConsole() {
  if (!debugModeEnabled) {
    console.log('⚠️ Debug mode is disabled')
    return // Don't allow toggling if debug mode is disabled
  }
  
  debugConsoleOpen = !debugConsoleOpen
  console.log('🔄 Toggling debug console:', debugConsoleOpen)
  
  const debugConsole = document.querySelector('#archy-debug-console') as HTMLElement
  
  if (debugConsole) {
    if (debugConsoleOpen) {
      debugConsole.style.display = 'flex'
      updateDebugConsole()
      console.log('✅ Debug console opened')
    } else {
      debugConsole.style.display = 'none'
      console.log('❌ Debug console closed')
    }
  } else {
    console.error('Debug console element not found!')
  }
}

function updateDebugConsole() {
  const logsContainer = document.querySelector('#archy-debug-logs')
  const countElement = document.querySelector('#archy-debug-count')
  
  if (countElement) {
    countElement.textContent = `(${debugLogs.length})`
  }
  
  if (logsContainer) {
    logsContainer.innerHTML = debugLogs.map(log => {
      const levelIcon = log.level === 'error' ? '❌' : 
                       log.level === 'warn' ? '⚠️' :
                       log.level === 'info' ? 'ℹ️' : '📝'
      
      return `
        <div class="archy-debug-log ${log.level}">
          <span class="archy-debug-log-time">${log.time}</span>
          <span class="archy-debug-log-level">${levelIcon}</span>
          <span class="archy-debug-log-msg">${log.msg}</span>
        </div>
      `
    }).join('')
  }
}

function openOverlay() {
  if (!overlayContainer) return
  
  isOpen = true
  selectedIndex = 0
  overlayContainer.style.display = 'flex'
  overlayContainer.classList.add('archy-opening')
  
  // Focus search input
  setTimeout(() => {
    const searchInput = document.querySelector('#archy-search-input') as HTMLInputElement
    searchInput?.focus()
    overlayContainer?.classList.remove('archy-opening')
  }, 100)
  
  // Load tabs
  loadTabs()
}

function closeOverlay() {
  if (!overlayContainer) return
  
  isOpen = false
  overlayContainer.classList.add('archy-closing')
  
  setTimeout(() => {
    overlayContainer!.style.display = 'none'
    overlayContainer!.classList.remove('archy-closing')
  }, 200)
}

function loadTabs() {
  chrome.runtime.sendMessage({ type: 'GET_TABS_FOR_OVERLAY' }, (response) => {
    if (response && response.tabs) {
      renderTabs(response.tabs)
    }
  })
}

function renderTabs(tabs: any[]) {
  const tabsList = document.querySelector('#archy-tabs-list')
  if (!tabsList) return
  
  // Always add "Create new tab" option at the top
  const createNewTabHtml = `
    <div class="archy-tab-item archy-new-tab-option" data-query="">
      <div class="archy-tab-favicon">➕</div>
      <div class="archy-tab-content">
        <div class="archy-tab-title">Create new tab</div>
        <div class="archy-tab-url">Open a new empty tab</div>
      </div>
    </div>
  `
  
  const tabsHtml = tabs.map((tab, index) => `
    <div class="archy-tab-item" data-tab-id="${tab.id}" data-window-id="${tab.windowId}" data-index="${index}">
      <img src="${tab.favIconUrl || chrome.runtime.getURL('icons/icon-16.png')}" alt="" class="archy-tab-favicon">
      <div class="archy-tab-content">
        <div class="archy-tab-title">${tab.title}</div>
        <div class="archy-tab-url">${tab.url}</div>
      </div>
      <div class="archy-tab-actions">
        <button class="archy-tab-close" data-tab-id="${tab.id}">×</button>
      </div>
    </div>
  `).join('')
  
  // Combine create new tab option with existing tabs
  tabsList.innerHTML = createNewTabHtml + tabsHtml
  
  // Update visible tabs list and highlight first item (Create new tab)
  updateVisibleTabs()
  if (visibleTabs.length > 0) {
    highlightTab(0)
  }
  
  // Add click handlers
  document.querySelectorAll('.archy-tab-item').forEach(item => {
    item.addEventListener('click', (e) => {
      const target = e.target as HTMLElement
      
      // Check if it's the create new tab option
      if (item.classList.contains('archy-new-tab-option')) {
        const query = item.getAttribute('data-query') || ''
        createNewTabWithSearch(query)
      } else if (!target.classList.contains('archy-tab-close')) {
        const tabId = parseInt(item.getAttribute('data-tab-id') || '0')
        const windowId = parseInt(item.getAttribute('data-window-id') || '0')
        switchToTab(tabId, windowId)
      }
    })
  })
  
  document.querySelectorAll('.archy-tab-close').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation()
      const tabId = parseInt(btn.getAttribute('data-tab-id') || '0')
      closeTab(tabId)
    })
  })
}

function switchToTab(tabId: number, windowId: number) {
  chrome.runtime.sendMessage({ 
    type: 'SWITCH_TO_TAB', 
    tabId, 
    windowId 
  })
  closeOverlay()
}

function closeTab(tabId: number) {
  chrome.runtime.sendMessage({ 
    type: 'CLOSE_TAB', 
    tabId 
  })
  // Reload tabs
  setTimeout(loadTabs, 100)
}

function handleSearch(e: Event) {
  const query = (e.target as HTMLInputElement).value
  const originalQuery = query // Keep original case for new tab
  
  if (query.trim() === '') {
    // Show tabs only when no search query
    loadTabs()
    return
  }
  
  // Search across tabs, bookmarks, and history
  chrome.runtime.sendMessage({ 
    type: 'SEARCH_ALL', 
    query: query 
  }, (response) => {
    if (response && response.results) {
      renderSearchResults(response.results, originalQuery)
    }
  })
}

function renderSearchResults(results: any[], originalQuery: string) {
  const tabsList = document.querySelector('#archy-tabs-list')
  if (!tabsList) return
  
  // Always add "Create new tab" option at the top for search
  const createNewTabHtml = `
    <div class="archy-tab-item archy-new-tab-option" data-query="${originalQuery}">
      <div class="archy-tab-favicon">🔍</div>
      <div class="archy-tab-content">
        <div class="archy-tab-title">Search for "${originalQuery}"</div>
        <div class="archy-tab-url">Open new tab with Google search</div>
      </div>
    </div>
  `
  
  const resultTypeIcons = {
    tab: '📄',
    bookmark: '⭐',
    history: '🕒'
  }
  
  const resultsHtml = results.map((result, index) => {
    const typeIcon = resultTypeIcons[result.type as keyof typeof resultTypeIcons] || '📄'
    const isTab = result.type === 'tab'
    const faviconSrc = result.favicon || chrome.runtime.getURL('icons/icon-16.png')
    
    return `
      <div class="archy-tab-item archy-search-result" 
           data-result-type="${result.type}" 
           data-result-id="${result.id}"
           data-tab-id="${result.tabId || ''}" 
           data-window-id="${result.windowId || ''}" 
           data-index="${index}">
        <div class="archy-tab-favicon-container">
          <img src="${faviconSrc}" alt="" class="archy-tab-favicon" onerror="this.src='${chrome.runtime.getURL('icons/icon-16.png')}'">
          <span class="archy-result-type-badge">${typeIcon}</span>
        </div>
        <div class="archy-tab-content">
          <div class="archy-tab-title">${result.title}</div>
          <div class="archy-tab-url">${result.url}</div>
          ${result.visitCount ? `<div class="archy-tab-meta">Visited ${result.visitCount} times</div>` : ''}
        </div>
        ${isTab ? `
          <div class="archy-tab-actions">
            <button class="archy-tab-close" data-tab-id="${result.tabId}">×</button>
          </div>
        ` : ''}
      </div>
    `
  }).join('')
  
  // Combine create new tab option with search results
  tabsList.innerHTML = createNewTabHtml + resultsHtml
  
  // Update visible tabs list and highlight first item
  updateVisibleTabs()
  if (visibleTabs.length > 0) {
    highlightTab(0)
  }
  
  // Add click handlers
  document.querySelectorAll('.archy-tab-item').forEach(item => {
    item.addEventListener('click', (e) => {
      const target = e.target as HTMLElement
      
      // Check if it's the create new tab option
      if (item.classList.contains('archy-new-tab-option')) {
        const query = item.getAttribute('data-query') || ''
        createNewTabWithSearch(query)
      } else if (item.classList.contains('archy-search-result')) {
        if (!target.classList.contains('archy-tab-close')) {
          const resultType = item.getAttribute('data-result-type')
          const resultId = item.getAttribute('data-result-id')
          
          if (resultType === 'tab') {
            const tabId = parseInt(item.getAttribute('data-tab-id') || '0')
            const windowId = parseInt(item.getAttribute('data-window-id') || '0')
            switchToTab(tabId, windowId)
          } else {
            // Open bookmark or history item
            const result = results.find(r => r.id === resultId)
            if (result) {
              openSearchResult(result)
            }
          }
        }
      }
    })
  })
  
  // Add close handlers for tabs
  document.querySelectorAll('.archy-tab-close').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation()
      const tabId = parseInt(btn.getAttribute('data-tab-id') || '0')
      closeTab(tabId)
    })
  })
}

function openSearchResult(result: any, newWindow = false) {
  chrome.runtime.sendMessage({ 
    type: 'OPEN_SEARCH_RESULT', 
    result,
    newWindow
  })
  closeOverlay()
}

// Navigation functions
function updateVisibleTabs() {
  visibleTabs = Array.from(document.querySelectorAll('.archy-tab-item'))
    .filter(item => (item as HTMLElement).style.display !== 'none') as HTMLElement[]
}

function highlightTab(index: number) {
  // Remove highlight from all tabs
  document.querySelectorAll('.archy-tab-item').forEach(item => {
    item.classList.remove('archy-selected')
  })
  
  // Add highlight to selected tab
  if (visibleTabs[index]) {
    visibleTabs[index].classList.add('archy-selected')
    selectedIndex = index
    
    // Scroll into view if needed
    visibleTabs[index].scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }
}

function navigateDown() {
  if (visibleTabs.length === 0) return
  const newIndex = (selectedIndex + 1) % visibleTabs.length
  highlightTab(newIndex)
}

function navigateUp() {
  if (visibleTabs.length === 0) return
  const newIndex = selectedIndex === 0 ? visibleTabs.length - 1 : selectedIndex - 1
  highlightTab(newIndex)
}

function selectCurrentTab() {
  if (visibleTabs[selectedIndex]) {
    const selectedTab = visibleTabs[selectedIndex]
    
    // Check if it's the "create new tab" option
    if (selectedTab.classList.contains('archy-new-tab-option')) {
      const query = selectedTab.getAttribute('data-query') || ''
      createNewTabWithSearch(query)
    } else if (selectedTab.classList.contains('archy-search-result')) {
      // Handle search results (bookmarks, history, or tabs)
      const resultType = selectedTab.getAttribute('data-result-type')
      
      if (resultType === 'tab') {
        const tabId = parseInt(selectedTab.getAttribute('data-tab-id') || '0')
        const windowId = parseInt(selectedTab.getAttribute('data-window-id') || '0')
        switchToTab(tabId, windowId)
      } else {
        // For bookmarks and history, open the URL
        const url = selectedTab.querySelector('.archy-tab-url')?.textContent || ''
        if (url) {
          chrome.runtime.sendMessage({
            type: 'OPEN_SEARCH_RESULT',
            result: { url, type: resultType },
            newWindow: false
          })
          closeOverlay()
        }
      }
    } else {
      // Regular tab switching (fallback)
      const tabId = parseInt(selectedTab.getAttribute('data-tab-id') || '0')
      const windowId = parseInt(selectedTab.getAttribute('data-window-id') || '0')
      switchToTab(tabId, windowId)
    }
  }
}

function createNewTabWithSearch(query: string) {
  let url: string | undefined
  
  if (query && query.trim() !== '') {
    const trimmedQuery = query.trim()
    
    // Check if it's already a full URL (has protocol)
    if (trimmedQuery.startsWith('http://') || trimmedQuery.startsWith('https://')) {
      url = trimmedQuery
    }
    // Check if it looks like a domain (contains a dot but no spaces)
    else if (trimmedQuery.includes('.') && !trimmedQuery.includes(' ') && !trimmedQuery.includes('?')) {
      url = 'https://' + trimmedQuery
    }
    // Otherwise treat as search query
    else {
      url = `https://www.google.com/search?q=${encodeURIComponent(trimmedQuery)}`
    }
  }
  // If query is empty, url remains undefined and will open a new empty tab
  
  // Send message to background script to create a new tab
  chrome.runtime.sendMessage({
    type: 'CREATE_NEW_TAB',
    url: url
  })
  
  // Close the overlay
  closeOverlay()
}

function closeSelectedTab() {
  if (visibleTabs[selectedIndex]) {
    const selectedTab = visibleTabs[selectedIndex]
    
    // Don't close if it's the "create new tab" option
    if (selectedTab.classList.contains('archy-new-tab-option')) {
      return
    }
    
    const tabId = parseInt(selectedTab.getAttribute('data-tab-id') || '0')
    if (tabId) {
      closeTab(tabId)
    }
  }
}

function openSelectedTabInNewWindow() {
  if (visibleTabs[selectedIndex]) {
    const selectedTab = visibleTabs[selectedIndex]
    
    // Handle "create new tab" option - open new window with new tab
    if (selectedTab.classList.contains('archy-new-tab-option')) {
      const query = selectedTab.getAttribute('data-query') || ''
      let url: string | undefined
      
      if (query && query.trim() !== '') {
        const trimmedQuery = query.trim()
        
        // Check if it's already a full URL (has protocol)
        if (trimmedQuery.startsWith('http://') || trimmedQuery.startsWith('https://')) {
          url = trimmedQuery
        }
        // Check if it looks like a domain (contains a dot but no spaces)
        else if (trimmedQuery.includes('.') && !trimmedQuery.includes(' ') && !trimmedQuery.includes('?')) {
          url = 'https://' + trimmedQuery
        }
        // Otherwise treat as search query
        else {
          url = `https://www.google.com/search?q=${encodeURIComponent(trimmedQuery)}`
        }
      }
      
      chrome.runtime.sendMessage({
        type: 'CREATE_NEW_WINDOW',
        url: url
      })
      closeOverlay()
      return
    }
    
    // Handle search results
    if (selectedTab.classList.contains('archy-search-result')) {
      const resultType = selectedTab.getAttribute('data-result-type')
      
      if (resultType === 'tab') {
        // Move existing tab to new window
        const tabId = parseInt(selectedTab.getAttribute('data-tab-id') || '0')
        if (tabId) {
          chrome.runtime.sendMessage({
            type: 'MOVE_TAB_TO_NEW_WINDOW',
            tabId: tabId
          })
          closeOverlay()
        }
      } else {
        // Open bookmark or history item in new window
        const url = selectedTab.querySelector('.archy-tab-url')?.textContent || ''
        if (url) {
          chrome.runtime.sendMessage({
            type: 'OPEN_SEARCH_RESULT',
            result: { url, type: resultType },
            newWindow: true
          })
          closeOverlay()
        }
      }
      return
    }
    
    // For regular tabs, move to new window (fallback)
    const tabId = parseInt(selectedTab.getAttribute('data-tab-id') || '0')
    if (tabId) {
      chrome.runtime.sendMessage({
        type: 'MOVE_TAB_TO_NEW_WINDOW',
        tabId: tabId
      })
      closeOverlay()
    }
  }
}

// Listen for messages from background
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'TOGGLE_OVERLAY') {
    if (isOpen) {
      closeOverlay()
    } else {
      openOverlay()
    }
  } else if (message.type === 'DEBUG_LOG') {
    // Handle debug logs from other parts of the extension (only if debug mode is enabled)
    if (!debugModeEnabled) {
      console.log('Skipping debug log - debug mode disabled')
      return
    }
    
    const time = new Date().toLocaleTimeString()
    const msg = message.args.join(' ')
    
    console.log('📨 Received debug log from background:', message.level, msg)
    
    debugLogs.unshift({ time, level: message.level, msg })
    if (debugLogs.length > 100) debugLogs = debugLogs.slice(0, 100)
    
    if (debugConsoleOpen) {
      updateDebugConsole()
    }
  } else if (message.type === 'DEBUG_MODE_CHANGED') {
    // Update debug mode state
    debugModeEnabled = message.enabled
    
    // If debug mode is disabled, close and hide the debug console
    if (!debugModeEnabled) {
      debugConsoleOpen = false
      const debugConsole = document.querySelector('#archy-debug-console') as HTMLElement
      if (debugConsole) {
        debugConsole.style.display = 'none'
      }
      // Clear logs when debug mode is disabled
      debugLogs = []
    }
  }
})