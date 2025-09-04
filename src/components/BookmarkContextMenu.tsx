import React, { useEffect, useRef, useState } from 'react'
import { Edit, Trash2, ExternalLink, Copy, FolderPlus, MoveRight, ChevronRight, Folder } from 'lucide-react'
import { Bookmark, Folder as FolderType } from '../types'

interface BookmarkContextMenuProps {
  bookmark: Bookmark
  position: { x: number; y: number }
  onClose: () => void
  onEdit: (bookmark: Bookmark) => void
  onRemove: (bookmark: Bookmark) => void
  onOpenInNewTab: (bookmark: Bookmark) => void
  onCopyUrl: (bookmark: Bookmark) => void
  onCreateFolder: () => void
  onMoveToFolder?: (bookmark: Bookmark, folder: FolderType) => void
  availableFolders?: FolderType[]
}

export default function BookmarkContextMenu({
  bookmark,
  position,
  onClose,
  onEdit,
  onRemove,
  onOpenInNewTab,
  onCopyUrl,
  onCreateFolder,
  onMoveToFolder,
  availableFolders = []
}: BookmarkContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)
  const [showFolderSubmenu, setShowFolderSubmenu] = useState(false)
  const [submenuPosition, setSubmenuPosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [onClose])

  const handleMoveToFolderHover = (event: React.MouseEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    setSubmenuPosition({
      x: rect.right,
      y: rect.top
    })
    setShowFolderSubmenu(true)
  }

  const handleMoveToFolder = (folder: FolderType) => {
    if (onMoveToFolder) {
      onMoveToFolder(bookmark, folder)
    }
    onClose()
  }

  const menuItems = [
    {
      icon: Edit,
      label: 'Edit Bookmark',
      action: () => {
        onEdit(bookmark)
        onClose()
      }
    },
    {
      icon: ExternalLink,
      label: 'Open in New Tab',
      action: () => {
        onOpenInNewTab(bookmark)
        onClose()
      }
    },
    {
      icon: Copy,
      label: 'Copy URL',
      action: () => {
        onCopyUrl(bookmark)
        onClose()
      }
    },
    {
      icon: FolderPlus,
      label: 'Create Folder',
      action: () => {
        onCreateFolder()
        onClose()
      }
    },
    ...(onMoveToFolder && availableFolders.length > 0 ? [{
      icon: MoveRight,
      label: 'Move to Folder',
      hasSubmenu: true,
      onHover: handleMoveToFolderHover,
      onLeave: () => {
        // Keep submenu open when moving to it
        setTimeout(() => {
          const submenu = document.querySelector('.folder-submenu')
          if (!submenu?.matches(':hover')) {
            setShowFolderSubmenu(false)
          }
        }, 100)
      }
    }] : []),
    {
      icon: Trash2,
      label: 'Remove Bookmark',
      action: () => {
        onRemove(bookmark)
        onClose()
      },
      destructive: true
    }
  ]

  return (
    <>
      <div
        ref={menuRef}
        className="context-menu"
        style={{
          position: 'fixed',
          left: position.x,
          top: position.y,
          zIndex: 1000
        }}
      >
        {menuItems.map((item, index) => (
          <button
            key={index}
            className={`context-menu-item ${item.destructive ? 'destructive' : ''} ${item.hasSubmenu ? 'has-submenu' : ''}`}
            onClick={item.action}
            onMouseEnter={item.onHover}
            onMouseLeave={item.onLeave}
          >
            <item.icon className="w-4 h-4" />
            <span>{item.label}</span>
            {item.hasSubmenu && <ChevronRight className="w-4 h-4 ml-auto" />}
          </button>
        ))}
      </div>

      {/* Folder Submenu */}
      {showFolderSubmenu && availableFolders.length > 0 && (
        <div
          className="context-menu folder-submenu"
          style={{
            position: 'fixed',
            left: submenuPosition.x,
            top: submenuPosition.y,
            zIndex: 1001
          }}
          onMouseLeave={() => setShowFolderSubmenu(false)}
        >
          {availableFolders.length === 0 ? (
            <div className="context-menu-item disabled">
              <span className="text-gray-500">No folders available</span>
            </div>
          ) : (
            availableFolders.map((folder) => (
              <button
                key={folder.id}
                className="context-menu-item"
                onClick={() => handleMoveToFolder(folder)}
              >
                <Folder className="w-4 h-4" />
                <span>{folder.name}</span>
              </button>
            ))
          )}
        </div>
      )}
    </>
  )
}