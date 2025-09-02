import React, { useState } from 'react'
import { ChevronDown, ChevronRight, Folder as FolderIcon, GripVertical } from 'lucide-react'
import { Folder, Bookmark } from '../types'
import BookmarkItem from './BookmarkItem'

interface FolderItemProps {
  folder: Folder
  onToggleCollapse: (folderId: string) => void
  onBookmarkClick?: (bookmark: Bookmark) => void
  onBookmarkRemove?: (bookmark: Bookmark) => void
  onBookmarkContextMenu?: (bookmark: Bookmark, position: { x: number; y: number }) => void
  onFolderContextMenu?: (folder: Folder, position: { x: number; y: number }) => void
  onFolderRename?: (folder: Folder, newName: string) => void
  onDropIntoFolder?: (folder: Folder, item: any) => void
  dragProps?: any
  dropProps?: any
  sectionId?: string
  index?: number
  getDragPropsForBookmark?: (bookmark: Bookmark, index: number) => any
  showDropSeparator?: boolean
  autoEdit?: boolean
}

export default function FolderItem({
  folder,
  onToggleCollapse,
  onBookmarkClick,
  onBookmarkRemove,
  onBookmarkContextMenu,
  onFolderContextMenu,
  onFolderRename,
  onDropIntoFolder,
  dragProps,
  dropProps,
  getDragPropsForBookmark,
  showDropSeparator,
  autoEdit = false
}: FolderItemProps) {
  const [isEditing, setIsEditing] = useState(autoEdit)
  const [editName, setEditName] = useState(folder.name)
  const [isDragOver, setIsDragOver] = useState(false)
  
  // Auto-focus on new folders
  React.useEffect(() => {
    if (autoEdit && folder.name === 'New Folder') {
      setIsEditing(true)
      setEditName('')
    }
  }, [autoEdit, folder.name])

  const handleToggleCollapse = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!isEditing) {
      onToggleCollapse(folder.id)
    }
  }

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (onFolderContextMenu) {
      onFolderContextMenu(folder, { x: e.clientX, y: e.clientY })
    }
  }

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsEditing(true)
    setEditName(folder.name)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveEdit()
    } else if (e.key === 'Escape') {
      handleCancelEdit()
    }
  }

  const handleSaveEdit = () => {
    if (onFolderRename && editName.trim()) {
      onFolderRename(folder, editName.trim())
    }
    setIsEditing(false)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditName(folder.name)
  }

  return (
    <>
      {showDropSeparator && (
        <div className="drop-separator active" />
      )}
      <div 
        className={`folder-item ${isDragOver ? 'drag-over' : ''}`}
        onContextMenu={handleContextMenu}
        {...(dragProps || {})}
      >
        <div 
          className="folder-header group"
          onClick={handleToggleCollapse}
          onDoubleClick={handleDoubleClick}
          onDragOver={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setIsDragOver(true)
            e.dataTransfer.dropEffect = 'copy'
          }}
          onDragLeave={(e) => {
            e.preventDefault()
            e.stopPropagation()
            // Only set to false if leaving the folder entirely
            const rect = e.currentTarget.getBoundingClientRect()
            if (
              e.clientX < rect.left ||
              e.clientX > rect.right ||
              e.clientY < rect.top ||
              e.clientY > rect.bottom
            ) {
              setIsDragOver(false)
            }
          }}
          onDrop={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setIsDragOver(false)
            
            // Handle drop into folder
            if (onDropIntoFolder) {
              try {
                const data = e.dataTransfer.getData('text/plain')
                console.log('Dropped data into folder:', data)
                if (data) {
                  const dragData = JSON.parse(data)
                  onDropIntoFolder(folder, dragData)
                }
              } catch (error) {
                console.error('Error handling drop into folder:', error)
              }
            }
          }}
        >
          {dragProps?.draggable && !isEditing && (
            <div className="drag-handle-container">
              <GripVertical className="w-3 h-3 text-gray-500 drag-handle opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          )}
          
          {!isEditing && (
            <>
              {folder.collapsed ? (
                <ChevronRight className="w-3 h-3 text-gray-500" />
              ) : (
                <ChevronDown className="w-3 h-3 text-gray-500" />
              )}
            </>
          )}
          
          <FolderIcon className="w-5 h-5 text-blue-400 flex-shrink-0" />
          
          {isEditing ? (
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleSaveEdit}
              className="inline-edit-input"
              autoFocus
            />
          ) : (
            <span className="folder-name flex-1">
              {folder.name}
            </span>
          )}
          
          {!isEditing && (
            <span className="text-xs text-gray-500">
              {folder.items.length}
            </span>
          )}
        </div>

        {!folder.collapsed && (
          <div 
            className="folder-content"
            onDragOver={(e) => {
              if (folder.items.length === 0) {
                e.preventDefault()
                e.stopPropagation()
                e.dataTransfer.dropEffect = 'copy'
              }
            }}
            onDrop={(e) => {
              if (folder.items.length === 0) {
                e.preventDefault()
                e.stopPropagation()
                
                // Handle drop into empty folder
                if (onDropIntoFolder) {
                  try {
                    const data = e.dataTransfer.getData('text/plain')
                    console.log('Dropped into empty folder:', data)
                    if (data) {
                      const dragData = JSON.parse(data)
                      onDropIntoFolder(folder, dragData)
                    }
                  } catch (error) {
                    console.error('Error dropping into empty folder:', error)
                  }
                }
              }
            }}
          >
            {folder.items.length === 0 ? (
              <div className="empty-folder drop-zone-empty">
                Drop items here
              </div>
            ) : (
              folder.items.map((bookmark, bookmarkIndex) => {
                // Create drag props with correct folder context
                const bookmarkDragProps = getDragPropsForBookmark ? 
                  getDragPropsForBookmark(bookmark, bookmarkIndex) : undefined
                
                return (
                  <BookmarkItem
                    key={`folder-bookmark-${bookmark.id}`}
                    bookmark={bookmark}
                    onClick={() => onBookmarkClick?.(bookmark)}
                    onRemove={() => onBookmarkRemove?.(bookmark)}
                    onContextMenu={onBookmarkContextMenu}
                    dragProps={bookmarkDragProps}
                    sectionId={`folder-${folder.id}`}
                    index={bookmarkIndex}
                  />
                )
              })
            )}
          </div>
        )}
      </div>
    </>
  )
}