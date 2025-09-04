import React, { useState, useEffect, useCallback } from 'react'
import { Tab, Bookmark, Section as SectionType, Folder } from '../types'
import Section from '../components/Section'
import SearchBar from '../components/SearchBar'
import { loadSections, saveSections } from '../utils/sections'
import { getAllTabs } from '../utils/chromeTabs'
import { createBookmarkFromTab } from '../utils/chromeBookmarks'
import { Settings, X, Minimize2, Maximize2 } from 'lucide-react'
import '../styles/newtab.css'

export default function NewTabApp() {
  const [sections, setSections] = useState<SectionType[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'fullscreen' | 'sidebar'>('fullscreen')

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        // Load saved sections
        const savedSections = await loadSections()
        
        // Get current tabs
        const allTabs = await getAllTabs()
        
        // Update Today section with current tabs
        const updatedSections = savedSections.map(section => {
          if (section.type === 'today') {
            return {
              ...section,
              items: allTabs
            }
          }
          return section
        })
        
        setSections(updatedSections)
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    loadData()
  }, [])

  // Listen for tab updates
  useEffect(() => {
    const handleTabUpdate = async () => {
      const allTabs = await getAllTabs()
      setSections(prevSections => 
        prevSections.map(section => {
          if (section.type === 'today') {
            return {
              ...section,
              items: allTabs
            }
          }
          return section
        })
      )
    }

    chrome.tabs.onCreated.addListener(handleTabUpdate)
    chrome.tabs.onRemoved.addListener(handleTabUpdate)
    chrome.tabs.onUpdated.addListener(handleTabUpdate)
    chrome.tabs.onMoved.addListener(handleTabUpdate)

    return () => {
      chrome.tabs.onCreated.removeListener(handleTabUpdate)
      chrome.tabs.onRemoved.removeListener(handleTabUpdate)
      chrome.tabs.onUpdated.removeListener(handleTabUpdate)
      chrome.tabs.onMoved.removeListener(handleTabUpdate)
    }
  }, [])

  const handleTabClick = async (tab: Tab) => {
    if (tab.id && tab.id > 0) {
      await chrome.tabs.update(tab.id, { active: true })
      if (tab.windowId) {
        await chrome.windows.update(tab.windowId, { focused: true })
      }
    }
  }

  const handleTabClose = async (tab: Tab) => {
    if (tab.id && tab.id > 0) {
      await chrome.tabs.remove(tab.id)
    }
  }

  const handleBookmarkClick = async (bookmark: Bookmark) => {
    // Open bookmark in current tab
    const [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true })
    if (currentTab.id) {
      await chrome.tabs.update(currentTab.id, { url: bookmark.url })
    }
  }

  const handleBookmarkRemove = async (bookmark: Bookmark) => {
    const updatedSections = sections.map(section => ({
      ...section,
      items: section.items.filter(item => 
        !item || !('id' in item) || item.id !== bookmark.id
      )
    }))
    setSections(updatedSections)
    await saveSections(updatedSections)
  }

  const handleToggleViewMode = () => {
    setViewMode(prev => prev === 'fullscreen' ? 'sidebar' : 'fullscreen')
  }

  const handleOpenSidePanel = async () => {
    const currentWindow = await chrome.windows.getCurrent()
    // @ts-ignore - sidePanel API
    await chrome.sidePanel.open({ windowId: currentWindow.id })
    // Close this tab
    const [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true })
    if (currentTab.id) {
      await chrome.tabs.remove(currentTab.id)
    }
  }

  // Filter sections based on search
  const filteredSections = sections.map(section => ({
    ...section,
    items: section.items.filter(item => {
      const title = item && 'title' in item ? item.title : ''
      const url = item && 'url' in item ? item.url : ''
      const query = searchQuery.toLowerCase()
      return title.toLowerCase().includes(query) || url.toLowerCase().includes(query)
    })
  }))

  if (isLoading) {
    return (
      <div className="newtab-container">
        <div className="newtab-loading">
          <div className="spinner"></div>
          <p>Loading Archy...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`newtab-container ${viewMode}`}>
      <div className="newtab-header">
        <div className="newtab-brand">
          <h1>Archy</h1>
          <span className="newtab-subtitle">Tab Manager</span>
        </div>
        
        <SearchBar 
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
        
        <div className="newtab-controls">
          <button 
            className="newtab-control-btn"
            onClick={handleToggleViewMode}
            title={viewMode === 'fullscreen' ? 'Switch to sidebar view' : 'Switch to fullscreen view'}
          >
            {viewMode === 'fullscreen' ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          
          <button 
            className="newtab-control-btn"
            onClick={handleOpenSidePanel}
            title="Open in side panel"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      <div className="newtab-content">
        <div className={`newtab-sections ${viewMode === 'sidebar' ? 'sidebar-layout' : 'grid-layout'}`}>
          {filteredSections.map(section => {
            const visibleItems = searchQuery 
              ? section.items 
              : section.collapsed 
                ? [] 
                : section.items
                
            return (
              <div key={section.id} className="newtab-section-wrapper">
                <Section
                  section={{ ...section, items: visibleItems }}
                  onTabClick={handleTabClick}
                  onTabClose={handleTabClose}
                  onBookmarkClick={handleBookmarkClick}
                  onBookmarkRemove={handleBookmarkRemove}
                  onToggleCollapse={() => {
                    const updatedSections = sections.map(s =>
                      s.id === section.id ? { ...s, collapsed: !s.collapsed } : s
                    )
                    setSections(updatedSections)
                    saveSections(updatedSections)
                  }}
                />
              </div>
            )
          })}
        </div>
      </div>
      
      <div className="newtab-footer">
        <div className="newtab-stats">
          {sections.find(s => s.type === 'today')?.items.length || 0} tabs • 
          {sections.find(s => s.type === 'favorites')?.items.length || 0} favorites • 
          {sections.find(s => s.type === 'bookmarks')?.items.length || 0} bookmarks
        </div>
        
        <div className="newtab-shortcuts">
          Press <kbd>Cmd</kbd>+<kbd>E</kbd> to toggle side panel
        </div>
      </div>
    </div>
  )
}