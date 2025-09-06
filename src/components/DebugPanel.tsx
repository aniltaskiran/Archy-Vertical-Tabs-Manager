import React, { useEffect, useState } from 'react'
import { X, Trash2, Bug, Copy, ChevronDown, ChevronUp } from 'lucide-react'
import { debugLogger, LogEntry } from '../utils/debugLogger'

interface DebugPanelProps {
  onClose: () => void
}

export default function DebugPanel({ onClose }: DebugPanelProps) {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [isMinimized, setIsMinimized] = useState(false)
  const [filter, setFilter] = useState<'all' | 'log' | 'warn' | 'error'>('all')
  const [position, setPosition] = useState({ x: 10, y: 10 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  
  useEffect(() => {
    // Load initial logs
    setLogs(debugLogger.getLogs())
    
    // Subscribe to updates
    const unsubscribe = debugLogger.subscribe((newLogs) => {
      setLogs(newLogs)
    })
    
    return unsubscribe
  }, [])
  
  const handleClear = () => {
    debugLogger.clear()
  }
  
  const handleCopyAll = () => {
    const logText = logs
      .map(log => `[${log.timestamp}] ${log.level.toUpperCase()}: ${log.message}`)
      .join('\n')
    navigator.clipboard.writeText(logText)
  }
  
  const handleCopyLog = (log: LogEntry) => {
    const logText = `[${log.timestamp}] ${log.level.toUpperCase()}: ${log.message}`
    navigator.clipboard.writeText(logText)
  }
  
  const filteredLogs = filter === 'all' 
    ? logs 
    : logs.filter(log => log.level === filter)
  
  const getLogColor = (level: LogEntry['level']) => {
    switch (level) {
      case 'error': return 'text-red-400'
      case 'warn': return 'text-yellow-400'
      case 'info': return 'text-blue-400'
      default: return 'text-gray-300'
    }
  }
  
  const getLogIcon = (level: LogEntry['level']) => {
    switch (level) {
      case 'error': return '❌'
      case 'warn': return '⚠️'
      case 'info': return 'ℹ️'
      default: return '📝'
    }
  }
  
  const handleMouseDown = (e: React.MouseEvent) => {
    // Only drag from header
    if (!(e.target as HTMLElement).closest('.debug-header')) return
    
    setIsDragging(true)
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    })
  }
  
  useEffect(() => {
    if (!isDragging) return
    
    const handleMouseMove = (e: MouseEvent) => {
      const newX = Math.max(10, Math.min(window.innerWidth - 400, e.clientX - dragStart.x))
      const newY = Math.max(10, Math.min(window.innerHeight - 200, e.clientY - dragStart.y))
      setPosition({ x: newX, y: newY })
    }
    
    const handleMouseUp = () => {
      setIsDragging(false)
    }
    
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, dragStart])
  
  return (
    <div 
      className={`debug-panel ${isMinimized ? 'minimized' : ''} ${isDragging ? 'dragging' : ''}`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        right: 'auto',
        width: 'calc(100% - 20px)',
        maxWidth: '600px'
      }}
      onMouseDown={handleMouseDown}
    >
      <div className="debug-header">
        <div className="flex items-center gap-2">
          <Bug className="w-4 h-4 text-green-400" />
          <span className="text-sm font-medium text-gray-300">Debug Console</span>
          <span className="text-xs text-gray-500">({filteredLogs.length} logs)</span>
        </div>
        
        <div className="flex items-center gap-1">
          {/* Filter buttons */}
          <button
            onClick={() => setFilter('all')}
            className={`debug-filter-btn ${filter === 'all' ? 'active' : ''}`}
            title="All logs"
          >
            All
          </button>
          <button
            onClick={() => setFilter('log')}
            className={`debug-filter-btn ${filter === 'log' ? 'active' : ''}`}
            title="Logs only"
          >
            📝
          </button>
          <button
            onClick={() => setFilter('warn')}
            className={`debug-filter-btn ${filter === 'warn' ? 'active' : ''}`}
            title="Warnings only"
          >
            ⚠️
          </button>
          <button
            onClick={() => setFilter('error')}
            className={`debug-filter-btn ${filter === 'error' ? 'active' : ''}`}
            title="Errors only"
          >
            ❌
          </button>
          
          <div className="w-px h-4 bg-gray-700 mx-1" />
          
          <button
            onClick={handleCopyAll}
            className="debug-action-btn"
            title="Copy all logs"
          >
            <Copy className="w-3 h-3" />
          </button>
          <button
            onClick={handleClear}
            className="debug-action-btn"
            title="Clear logs"
          >
            <Trash2 className="w-3 h-3" />
          </button>
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="debug-action-btn"
            title={isMinimized ? 'Expand' : 'Minimize'}
          >
            {isMinimized ? (
              <ChevronDown className="w-3 h-3" />
            ) : (
              <ChevronUp className="w-3 h-3" />
            )}
          </button>
          <button
            onClick={onClose}
            className="debug-action-btn text-red-400 hover:text-red-300"
            title="Close debug panel"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>
      
      {!isMinimized && (
        <div className="debug-content">
          {filteredLogs.length === 0 ? (
            <div className="debug-empty">
              <span className="text-gray-500 text-xs">No logs yet...</span>
            </div>
          ) : (
            <div className="debug-logs">
              {filteredLogs.map((log, index) => (
                <div 
                  key={index} 
                  className="debug-log-entry group"
                  onDoubleClick={() => handleCopyLog(log)}
                >
                  <span className="debug-log-time">{log.timestamp}</span>
                  <span className="debug-log-icon">{getLogIcon(log.level)}</span>
                  <span className={`debug-log-message ${getLogColor(log.level)}`}>
                    {log.message}
                  </span>
                  <button
                    onClick={() => handleCopyLog(log)}
                    className="debug-copy-btn opacity-0 group-hover:opacity-100"
                    title="Copy this log"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}