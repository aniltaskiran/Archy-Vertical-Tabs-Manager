// Debug Logger for Archy
export interface LogEntry {
  timestamp: string
  level: 'log' | 'warn' | 'error' | 'info'
  message: string
  data?: any
}

class DebugLogger {
  private logs: LogEntry[] = []
  private maxLogs = 100
  private listeners: ((logs: LogEntry[]) => void)[] = []
  private isEnabled = false
  
  constructor() {
    // Load debug mode state from storage
    this.loadDebugState()
    
    // Override console methods
    this.overrideConsole()
  }
  
  private async loadDebugState() {
    try {
      const result = await chrome.storage.local.get('debugMode')
      this.isEnabled = result.debugMode || false
    } catch (error) {
      // Fallback for initial load
      this.isEnabled = false
    }
  }
  
  setEnabled(enabled: boolean) {
    this.isEnabled = enabled
    chrome.storage.local.set({ debugMode: enabled })
    
    if (!enabled) {
      this.clear()
    }
  }
  
  getEnabled() {
    return this.isEnabled
  }
  
  private overrideConsole() {
    const originalLog = console.log
    const originalWarn = console.warn
    const originalError = console.error
    const originalInfo = console.info
    
    console.log = (...args: any[]) => {
      originalLog.apply(console, args)
      if (this.isEnabled) {
        this.addLog('log', args)
      }
    }
    
    console.warn = (...args: any[]) => {
      originalWarn.apply(console, args)
      if (this.isEnabled) {
        this.addLog('warn', args)
      }
    }
    
    console.error = (...args: any[]) => {
      originalError.apply(console, args)
      if (this.isEnabled) {
        this.addLog('error', args)
      }
    }
    
    console.info = (...args: any[]) => {
      originalInfo.apply(console, args)
      if (this.isEnabled) {
        this.addLog('info', args)
      }
    }
  }
  
  private addLog(level: LogEntry['level'], args: any[]) {
    const entry: LogEntry = {
      timestamp: new Date().toLocaleTimeString(),
      level,
      message: args.map(arg => {
        if (typeof arg === 'object') {
          try {
            return JSON.stringify(arg, null, 2)
          } catch {
            return String(arg)
          }
        }
        return String(arg)
      }).join(' '),
      data: args.length > 1 ? args.slice(1) : undefined
    }
    
    this.logs.unshift(entry) // Add to beginning
    
    // Keep only maxLogs entries
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs)
    }
    
    // Notify listeners
    this.notifyListeners()
  }
  
  getLogs() {
    return this.logs
  }
  
  clear() {
    this.logs = []
    this.notifyListeners()
  }
  
  subscribe(listener: (logs: LogEntry[]) => void) {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener)
    }
  }
  
  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.logs))
  }
}

// Singleton instance
export const debugLogger = new DebugLogger()