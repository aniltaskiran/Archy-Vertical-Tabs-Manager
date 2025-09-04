// Content script for Archy overlay
let isOpen = false
let overlayContainer: HTMLElement | null = null
let selectedIndex = 0
let visibleTabs: HTMLElement[] = []

// Track keyboard navigation
document.addEventListener('keydown', (e) => {
  if (!isOpen) return
  
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
    case 'Enter':
      e.preventDefault()
      selectCurrentTab()
      break
  }
})

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
  
  tabsList.innerHTML = tabs.map((tab, index) => `
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
  
  // Update visible tabs list and highlight first item
  updateVisibleTabs()
  if (visibleTabs.length > 0) {
    highlightTab(0)
  }
  
  // Add click handlers
  document.querySelectorAll('.archy-tab-item').forEach(item => {
    item.addEventListener('click', (e) => {
      const target = e.target as HTMLElement
      if (!target.classList.contains('archy-tab-close')) {
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
  const query = (e.target as HTMLInputElement).value.toLowerCase()
  const items = document.querySelectorAll('.archy-tab-item')
  
  items.forEach(item => {
    const title = item.querySelector('.archy-tab-title')?.textContent?.toLowerCase() || ''
    const url = item.querySelector('.archy-tab-url')?.textContent?.toLowerCase() || ''
    
    if (title.includes(query) || url.includes(query)) {
      (item as HTMLElement).style.display = 'flex'
    } else {
      (item as HTMLElement).style.display = 'none'
    }
  })
  
  // Update visible tabs after filtering
  updateVisibleTabs()
  if (visibleTabs.length > 0) {
    highlightTab(0)
  }
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
    const tabId = parseInt(visibleTabs[selectedIndex].getAttribute('data-tab-id') || '0')
    const windowId = parseInt(visibleTabs[selectedIndex].getAttribute('data-window-id') || '0')
    switchToTab(tabId, windowId)
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
  }
})