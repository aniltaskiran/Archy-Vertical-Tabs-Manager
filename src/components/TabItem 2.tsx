import React from 'react'
import { X, Pin } from 'lucide-react'
import { Tab } from '../types'

interface TabItemProps {
  tab: Tab
  onClick: () => void
  onClose: () => void
}

export default function TabItem({ tab, onClick, onClose, isGrouped = false }: TabItemProps) {
  const handleCloseClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onClose()
  }

  const getFaviconSrc = (tab: Tab) => {
    if (tab.favIconUrl && !tab.favIconUrl.includes('chrome://')) {
      return tab.favIconUrl
    }
    return `chrome://favicon/size/16@1x/${tab.url}`
  }

  return (
    <div 
      className={`tab-item group ${tab.active ? 'active' : ''} ${isGrouped ? 'grouped' : ''}`}
      onClick={onClick}
      title={`${tab.title}\n${tab.url}`}
    >
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <img
          src={getFaviconSrc(tab)}
          alt=""
          className="tab-favicon"
          onError={(e) => {
            const target = e.target as HTMLImageElement
            target.style.display = 'none'
          }}
        />
        
        {tab.pinned && (
          <Pin className="w-3 h-3 text-gray-500 flex-shrink-0" />
        )}
        
        <span className="tab-title">
          {tab.title || 'Untitled'}
        </span>
      </div>

      <button
        onClick={handleCloseClick}
        className="tab-close flex items-center justify-center"
        title="Close tab"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  )
}