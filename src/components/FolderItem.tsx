import React, { useState } from 'react'
import { ChevronDown, ChevronRight, Folder as FolderIcon, GripVertical } from 'lucide-react'
import { Folder, Bookmark } from '../types'
import BookmarkItem from './BookmarkItem'

interface FolderItemProps {
  folder: Folder
  activeTabUrl?: string
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
  activeTabUrl,
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
        onDragOver={(e) => {
          // Allow drop on the entire folder
          e.preventDefault()
          e.stopPropagation()
          if (!isDragOver) {
            console.log('🔥 DRAG OVER on folder:', folder.name)
          }
          setIsDragOver(true)
          e.dataTransfer.dropEffect = 'copy'
        }}
        onDragLeave={(e) => {
          e.preventDefault()
          e.stopPropagation()
          // Check if we're actually leaving the folder
          const rect = e.currentTarget.getBoundingClientRect()
          const isLeaving = e.clientX < rect.left || 
                           e.clientX > rect.right || 
                           e.clientY < rect.top || 
                           e.clientY > rect.bottom
          if (isLeaving) {
            setIsDragOver(false)
          }
        }}
        onDrop={(e) => {
          console.log('🎯 DROP EVENT on FolderItem:', folder.name)
          e.preventDefault()
          e.stopPropagation()
          setIsDragOver(false)
          
          // Handle drop into folder
          console.log('📂 onDropIntoFolder exists?', !!onDropIntoFolder)
          if (onDropIntoFolder) {
            try {
              const data = e.dataTransfer.getData('text/plain')
              console.log('📦 Raw dropped data:', data)
              if (data) {
                const dragData = JSON.parse(data)
                console.log('📊 Parsed drag data:', dragData)
                console.log('🚀 Calling onDropIntoFolder...')
                onDropIntoFolder(folder, dragData)
              } else {
                console.log('⚠️ No data in dataTransfer!')
              }
            } catch (error) {
              console.error('❌ Error handling drop into folder:', error)
            }
          } else {
            console.log('⚠️ onDropIntoFolder handler not provided!')
          }
        }}
        {...(dragProps || {})}
      >
        <div 
          className="folder-header group"
          onClick={handleToggleCollapse}
          onDoubleClick={handleDoubleClick}
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
                Drop tabs or bookmarks here
              </div>
            ) : (
              folder.items.map((item, itemIndex) => {
                // Skip null/undefined items
                if (!item) return null
                
                // Check if item is a nested folder
                if ('type' in item && item.type === 'folder') {
                  // Render nested folder recursively
                  return (
                    <FolderItem
                      key={`nested-folder-${item.id}`}
                      folder={item}
                      onToggleCollapse={onToggleCollapse}
                      onBookmarkClick={onBookmarkClick}
                      onBookmarkRemove={onBookmarkRemove}
                      onBookmarkContextMenu={onBookmarkContextMenu}
                      onFolderContextMenu={onFolderContextMenu}
                      onFolderRename={onFolderRename}
                      onDropIntoFolder={onDropIntoFolder}
                      getDragPropsForBookmark={getDragPropsForBookmark}
                      autoEdit={false}
                    />
                  )
                } else {
                  // Render bookmark
                  const bookmarkDragProps = getDragPropsForBookmark ? 
                    getDragPropsForBookmark(item as Bookmark, itemIndex) : undefined
                  
                  return (
                    <BookmarkItem
                      key={`folder-bookmark-${item?.id || itemIndex}`}
                      bookmark={item as Bookmark}
                      isActive={activeTabUrl === (item as Bookmark).url}
                      onClick={() => onBookmarkClick?.(item as Bookmark)}
                      onRemove={() => onBookmarkRemove?.(item as Bookmark)}
                      onContextMenu={onBookmarkContextMenu}
                      dragProps={bookmarkDragProps}
                      sectionId={`folder-${folder.id}`}
                      index={itemIndex}
                    />
                  )
                }
              })
            )}
          </div>
        )}
      </div>
    </>
  )
}