import React from 'react'
import { X, ExternalLink, GripVertical } from 'lucide-react'
import { Bookmark } from '../types'

interface BookmarkItemProps {
  bookmark: Bookmark
  isActive?: boolean
  onClick: () => void
  onRemove: () => void
  onContextMenu?: (bookmark: Bookmark, position: { x: number; y: number }) => void
  dragProps?: any
  dropProps?: any
  sectionId?: string
  index?: number
  showDropSeparator?: boolean
}

export default function BookmarkItem({ bookmark, isActive, onClick, onRemove, onContextMenu, dragProps, dropProps, showDropSeparator }: BookmarkItemProps) {
  const handleRemoveClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onRemove()
  }

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (onContextMenu) {
      onContextMenu(bookmark, { x: e.clientX, y: e.clientY })
    }
  }


  const getFaviconSrc = (bookmark: Bookmark) => {
    // Use bookmark's favicon if available
    if (bookmark.favicon && !bookmark.favicon.startsWith('chrome://')) {
      return bookmark.favicon
    }
    
    // For URLs, try to get favicon from the domain
    if (bookmark.url && !bookmark.url.startsWith('chrome://')) {
      try {
        const url = new URL(bookmark.url)
        // Use Google's favicon service
        return `https://www.google.com/s2/favicons?domain=${url.hostname}&sz=32`
      } catch (e) {
        // Invalid URL
      }
    }
    
    return ''
  }

  return (
    <>
      {showDropSeparator && (
        <div className="drop-separator active" />
      )}
      <div 
        className={`bookmark-item group ${isActive ? 'active' : ''}`}
        onClick={onClick}
        onContextMenu={handleContextMenu}
        {...(dragProps || {})}
        {...(dropProps || {})}
        title={`${bookmark.title}\n${bookmark.url}`}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {dragProps?.draggable && (
            <div className="drag-handle-container">
              <GripVertical className="w-3 h-3 text-gray-500 drag-handle opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          )}
          
          {getFaviconSrc(bookmark) ? (
            <img
              src={getFaviconSrc(bookmark)}
              alt=""
              className="bookmark-favicon"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.style.display = 'none'
              }}
            />
          ) : (
            <div className="bookmark-favicon bg-gray-700 rounded" />
          )}
          
          <span className="bookmark-title">
            {bookmark.title || bookmark.url}
          </span>
          
          <ExternalLink className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        <button
          onClick={handleRemoveClick}
          className="bookmark-remove flex items-center justify-center"
          title="Remove bookmark"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    </>
  )
}