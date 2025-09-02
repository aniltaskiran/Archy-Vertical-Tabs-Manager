import React from 'react'
import { ChevronDown, ChevronRight, Star, Clock, Folder, Archive, MoreHorizontal, Loader2 } from 'lucide-react'
import { Section as SectionType, Tab, Bookmark, Folder as FolderType } from '../types'
import TabItem from './TabItem'
import BookmarkItem from './BookmarkItem'
import FolderItem from './FolderItem'

interface SectionProps {
  section: SectionType
  isLoading?: boolean
  onToggleCollapse: (sectionId: string) => void
  onTabClick?: (tab: Tab) => void
  onTabClose?: (tab: Tab) => void
  onTabContextMenu?: (tab: Tab, position: { x: number; y: number }) => void
  onTabRename?: (tab: Tab, newTitle: string) => void
  onBookmarkClick?: (bookmark: Bookmark) => void
  onBookmarkRemove?: (bookmark: Bookmark) => void
  onBookmarkContextMenu?: (bookmark: Bookmark, position: { x: number; y: number }) => void
  onFolderToggleCollapse?: (folderId: string) => void
  onFolderContextMenu?: (folder: FolderType, position: { x: number; y: number }) => void
  onFolderRename?: (folder: FolderType, newName: string) => void
  onDropIntoFolder?: (folder: FolderType, item: any) => void
  dragProps?: any
  dropProps?: any
  getDragPropsForItem?: (item: Tab | Bookmark | FolderType, index: number) => any
  getDropPropsForItem?: (sectionId: string, index: number) => any
  dropIndicator?: { sectionId: string; index: number } | null
  newFolderId?: string | null
}

const getSectionIcon = (type: SectionType['type']) => {
  switch (type) {
    case 'favorites':
      return <Star className="w-4 h-4" />
    case 'today':
      return <Clock className="w-4 h-4" />
    case 'workspace':
      return <Folder className="w-4 h-4" />
    case 'archive':
      return <Archive className="w-4 h-4" />
    default:
      return <Folder className="w-4 h-4" />
  }
}

export default function Section({ 
  section, 
  isLoading = false,
  onToggleCollapse, 
  onTabClick, 
  onTabClose,
  onTabContextMenu,
  onTabRename,
  onBookmarkClick,
  onBookmarkRemove,
  onBookmarkContextMenu,
  onFolderToggleCollapse,
  onFolderContextMenu,
  onFolderRename,
  onDropIntoFolder,
  dropProps,
  getDragPropsForItem,
  getDropPropsForItem,
  dropIndicator,
  newFolderId
}: SectionProps) {
  const handleHeaderClick = () => {
    onToggleCollapse(section.id)
  }

  const isTab = (item: Tab | Bookmark | FolderType): item is Tab => {
    return 'windowId' in item
  }

  const isFolder = (item: Tab | Bookmark | FolderType): item is FolderType => {
    return 'type' in item && item.type === 'folder'
  }

  // Separate pinned and unpinned items for Today section
  const pinnedItems = section.type === 'today' 
    ? section.items.filter(item => isTab(item) && item.pinned)
    : []
  
  const unpinnedItems = section.type === 'today'
    ? section.items.filter(item => !isTab(item) || !item.pinned)
    : section.items

  const allItemsForDisplay = section.type === 'today' 
    ? [...pinnedItems, ...unpinnedItems]
    : section.items

  return (
    <div 
      className="section"
      {...dropProps}
    >
      {/* Section Header - Only hide for favorites */}
      {section.type !== 'favorites' && (
        <div 
          className="section-header group"
          onClick={handleHeaderClick}
        >
          <div className="flex items-center gap-2">
            {section.collapsed ? (
              <ChevronRight className="w-3 h-3 text-gray-500" />
            ) : (
              <ChevronDown className="w-3 h-3 text-gray-500" />
            )}
            {getSectionIcon(section.type)}
            <span className="text-sm font-semibold text-gray-300">
              {section.name}
            </span>
          </div>
        </div>
      )}

      {/* Section Content */}
      {(section.type === 'favorites' || !section.collapsed) && (
        <div className="section-content">
          {isLoading ? (
            <div className="space-y-1">
              {/* Show skeleton loaders for tabs */}
              {[...Array(5)].map((_, i) => (
                <div key={`skeleton-${i}`} className="skeleton-tab" />
              ))}
              <div className="flex items-center justify-center py-2">
                <span className="text-xs text-gray-500">Loading tabs...</span>
              </div>
            </div>
          ) : allItemsForDisplay.length === 0 ? (
            <div className="px-3 py-4 text-center">
              <span className="text-gray-500 text-xs">
                {section.type === 'favorites' && 'No bookmarks'}
                {section.type === 'today' && 'No tabs'}
                {section.type === 'workspace' && 'No tabs'}
                {section.type === 'archive' && 'No archived tabs'}
              </span>
            </div>
          ) : (
            allItemsForDisplay.map((item, displayIndex) => {
              // Calculate the actual index in the original items array
              const index = section.items.indexOf(item)
              
              // Show separator between pinned and unpinned tabs in Today section
              const showSeparator = section.type === 'today' && 
                pinnedItems.length > 0 && 
                displayIndex === pinnedItems.length
              
              const separatorElement = showSeparator ? (
                <div key="separator" className="today-separator">
                  <div className="separator-line" />
                </div>
              ) : null
              const showDropSeparator = dropIndicator?.sectionId === section.id && dropIndicator?.index === index
              
              const elements: React.ReactNode[] = []
              
              if (separatorElement) {
                elements.push(separatorElement)
              }
              
              if (isTab(item)) {
                const dragProps = getDragPropsForItem ? getDragPropsForItem(item, index) : undefined
                const dropProps = getDropPropsForItem ? getDropPropsForItem(section.id, index) : undefined
                elements.push(
                  <TabItem
                    key={`tab-${item.id}`}
                    tab={item}
                    onClick={() => onTabClick?.(item)}
                    onClose={() => onTabClose?.(item)}
                    onContextMenu={onTabContextMenu}
                    onRename={onTabRename}
                    dragProps={dragProps}
                    dropProps={dropProps}
                    sectionId={section.id}
                    index={index}
                    showDropSeparator={showDropSeparator}
                    isTodaySection={section.type === 'today'}
                  />
                )
                return elements
              } else if (isFolder(item)) {
                const dragProps = getDragPropsForItem ? getDragPropsForItem(item, index) : undefined
                const dropProps = getDropPropsForItem ? getDropPropsForItem(section.id, index) : undefined
                elements.push(
                  <FolderItem
                    key={`folder-${item.id}`}
                    folder={item}
                    onToggleCollapse={onFolderToggleCollapse!}
                    onBookmarkClick={onBookmarkClick}
                    onBookmarkRemove={onBookmarkRemove}
                    onBookmarkContextMenu={onBookmarkContextMenu}
                    onFolderContextMenu={onFolderContextMenu}
                    onFolderRename={onFolderRename}
                    onDropIntoFolder={onDropIntoFolder}
                    dragProps={dragProps}
                    dropProps={dropProps}
                    sectionId={section.id}
                    index={index}
                    showDropSeparator={showDropSeparator}
                    getDragPropsForBookmark={(bookmark, bookmarkIndex) => {
                      // Create drag props for bookmarks within folders
                      // We need to maintain the correct context
                      if (getDragPropsForItem) {
                        // Pass bookmark with correct section context
                        return getDragPropsForItem(bookmark, index * 1000 + bookmarkIndex) // Unique index
                      }
                      return undefined
                    }}
                    autoEdit={newFolderId === item.id}
                  />
                )
                return elements
              } else {
                const dragProps = getDragPropsForItem ? getDragPropsForItem(item, index) : undefined
                const dropProps = getDropPropsForItem ? getDropPropsForItem(section.id, index) : undefined
                elements.push(
                  <BookmarkItem
                    key={`bookmark-${item.id}`}
                    bookmark={item}
                    onClick={() => onBookmarkClick?.(item)}
                    onRemove={() => onBookmarkRemove?.(item)}
                    onContextMenu={onBookmarkContextMenu}
                    dragProps={dragProps}
                    dropProps={dropProps}
                    sectionId={section.id}
                    index={index}
                    showDropSeparator={showDropSeparator}
                  />
                )
                return elements
              }
            })
          )}
        </div>
      )}
    </div>
  )
}