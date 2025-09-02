import React, { useEffect, useRef } from 'react'
import { Edit, Trash2, ExternalLink, Copy, FolderPlus, MoveRight } from 'lucide-react'
import { Bookmark } from '../types'

interface BookmarkContextMenuProps {
  bookmark: Bookmark
  position: { x: number; y: number }
  onClose: () => void
  onEdit: (bookmark: Bookmark) => void
  onRemove: (bookmark: Bookmark) => void
  onOpenInNewTab: (bookmark: Bookmark) => void
  onCopyUrl: (bookmark: Bookmark) => void
  onCreateFolder: () => void
  onMoveToFolder?: (bookmark: Bookmark) => void
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
  onMoveToFolder
}: BookmarkContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)

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
    ...(onMoveToFolder ? [{
      icon: MoveRight,
      label: 'Move to Folder',
      action: () => {
        onMoveToFolder(bookmark)
        onClose()
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
          className={`context-menu-item ${item.destructive ? 'destructive' : ''}`}
          onClick={item.action}
        >
          <item.icon className="w-4 h-4" />
          <span>{item.label}</span>
        </button>
      ))}
    </div>
  )
}