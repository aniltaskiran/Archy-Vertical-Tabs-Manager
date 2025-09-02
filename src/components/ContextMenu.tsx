import React, { useEffect, useRef } from 'react'
import { Star, Archive, X, ExternalLink, Copy } from 'lucide-react'
import { Tab } from '../types'

interface ContextMenuProps {
  tab: Tab
  position: { x: number; y: number }
  onClose: () => void
  onAddToFavorites: (tab: Tab) => void
  onArchiveTab: (tab: Tab) => void
  onCloseTab: (tab: Tab) => void
  onCopyUrl: (tab: Tab) => void
  onOpenInNewWindow: (tab: Tab) => void
}

export default function ContextMenu({
  tab,
  position,
  onClose,
  onAddToFavorites,
  onArchiveTab,
  onCloseTab,
  onCopyUrl,
  onOpenInNewWindow
}: ContextMenuProps) {
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
      icon: Star,
      label: 'Add to Favorites',
      action: () => {
        onAddToFavorites(tab)
        onClose()
      }
    },
    {
      icon: Archive,
      label: 'Archive Tab',
      action: () => {
        onArchiveTab(tab)
        onClose()
      }
    },
    {
      icon: Copy,
      label: 'Copy URL',
      action: () => {
        onCopyUrl(tab)
        onClose()
      }
    },
    {
      icon: ExternalLink,
      label: 'Open in New Window',
      action: () => {
        onOpenInNewWindow(tab)
        onClose()
      }
    },
    {
      icon: X,
      label: 'Close Tab',
      action: () => {
        onCloseTab(tab)
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