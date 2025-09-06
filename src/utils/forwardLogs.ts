// Forward console logs from side panel to background script
const originalLog = console.log
const originalWarn = console.warn
const originalError = console.error
const originalInfo = console.info

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

function forwardLog(level: string, args: any[]) {
  if (!debugModeEnabled) return // Don't forward logs if debug mode is disabled
  
  chrome.runtime.sendMessage({
    type: 'FORWARD_LOG',
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

// Override console methods to forward logs
console.log = (...args: any[]) => {
  originalLog.apply(console, args)
  // Use setTimeout to avoid issues with chrome.runtime.sendMessage
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

export {}