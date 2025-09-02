import React, { useState } from 'react'
import { X, Pin, GripVertical, Minus } from 'lucide-react'
import { Tab } from '../types'

interface TabItemProps {
  tab: Tab
  onClick: () => void
  onClose: () => void
  onContextMenu?: (tab: Tab, position: { x: number; y: number }) => void
  onRename?: (tab: Tab, newTitle: string) => void
  dragProps?: any
  dropProps?: any
  sectionId?: string
  index?: number
  showDropSeparator?: boolean
  isTodaySection?: boolean
}

export default function TabItem({ 
  tab, 
  onClick, 
  onClose, 
  onContextMenu, 
  onRename,
  dragProps,
  dropProps,
  showDropSeparator,
  isTodaySection
}: TabItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(tab.title)
  const [isHovered, setIsHovered] = useState(false)

  // Determine if tab exists in actual Chrome tabs
  const [tabExists, setTabExists] = useState(true)

  React.useEffect(() => {
    if (tab.pinned && isTodaySection) {
      // Check if this is a stored tab (negative ID)
      if (tab.id < 0) {
        setTabExists(false)
      } else {
        chrome.tabs.get(tab.id, (chromeTab) => {
          if (chrome.runtime.lastError) {
            setTabExists(false)
          } else {
            setTabExists(!!chromeTab)
          }
        })
      }
    }
  }, [tab.id, tab.pinned, isTodaySection])

  const handleCloseClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onClose()
  }

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (onContextMenu) {
      onContextMenu(tab, { x: e.clientX, y: e.clientY })
    }
  }

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsEditing(true)
    setEditTitle(tab.title)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveEdit()
    } else if (e.key === 'Escape') {
      handleCancelEdit()
    }
  }

  const handleSaveEdit = () => {
    if (onRename && editTitle.trim()) {
      onRename(tab, editTitle.trim())
    }
    setIsEditing(false)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditTitle(tab.title)
  }


  const getFaviconSrc = (tab: Tab) => {
    // First try to use the tab's favicon URL if available
    if (tab.favIconUrl && !tab.favIconUrl.startsWith('chrome://')) {
      return tab.favIconUrl
    }
    
    // For URLs, try to get favicon from the domain
    if (tab.url && !tab.url.startsWith('chrome://')) {
      try {
        const url = new URL(tab.url)
        // Use Google's favicon service as fallback
        return `https://www.google.com/s2/favicons?domain=${url.hostname}&sz=32`
      } catch (e) {
        // Invalid URL, use a default icon
      }
    }
    
    // Return empty string for default browser icon
    return ''
  }

  return (
    <>
      {showDropSeparator && (
        <div className="drop-separator active" />
      )}
      <div 
        className={`tab-item group ${tab.active ? 'active' : ''} ${!tabExists && tab.pinned ? 'stored-pinned' : ''}`}
        onClick={isEditing ? undefined : onClick}
        onContextMenu={handleContextMenu}
        onDoubleClick={handleDoubleClick}
        {...(dragProps || {})}
        {...(dropProps || {})}
        title={isEditing ? undefined : `${tab.title}\n${tab.url}${!tabExists && tab.pinned ? '\n(Stored - Click to open)' : ''}`}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {dragProps?.draggable && !isEditing && (
            <div className="drag-handle-container">
              <GripVertical className="w-3 h-3 text-gray-500 drag-handle opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          )}
          
          {getFaviconSrc(tab) ? (
            <img
              src={getFaviconSrc(tab)}
              alt=""
              className="tab-favicon"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.style.display = 'none'
              }}
            />
          ) : (
            <div className="tab-favicon bg-gray-700 rounded" />
          )}
          
          {tab.pinned && (
            <Pin className="w-3 h-3 text-gray-500 flex-shrink-0" />
          )}
          
          {isEditing ? (
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleSaveEdit}
              className="inline-edit-input"
              autoFocus
            />
          ) : (
            <span className="tab-title">
              {tab.title || 'Untitled'}
            </span>
          )}
        </div>

        {!isEditing && (
          <button
            onClick={handleCloseClick}
            className="tab-close flex items-center justify-center"
            title={tab.pinned && !tabExists ? "Unpin" : "Close tab"}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            {tab.pinned && isTodaySection ? (
              tabExists ? (
                <X className="w-3 h-3" />
              ) : (
                isHovered ? <Minus className="w-3 h-3" /> : null
              )
            ) : (
              <X className="w-3 h-3" />
            )}
          </button>
        )}
      </div>
    </>
  )
}