import React, { useEffect, useState } from 'react'
import { Search, Settings, Plus, Archive, Star } from 'lucide-react'
import SearchBar from '../components/SearchBar'
import Section from '../components/Section'
import ContextMenu from '../components/ContextMenu'
import BookmarkContextMenu from '../components/BookmarkContextMenu'
import FolderContextMenu from '../components/FolderContextMenu'
import NewWorkspaceButton from '../components/NewWorkspaceButton'
import { Tab, ChromeWindow, Section as SectionType, Bookmark, Folder } from '../types'
import { useSimpleDragDrop, DragData } from '../hooks/useSimpleDragDrop'
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts'
import { 
  addChromeBookmark, 
  removeChromeBookmark, 
  syncFavoritesWithChrome,
  loadFavoritesFromChrome,
  createChromeFolder,
  addBookmarkToFolder
} from '../utils/chromeBookmarks'
import {
  addTabToArchyGroup,
  removeTabFromArchyGroup,
  createTabInArchyGroup,
  getArchyGroupTabs,
  syncFavoritesToTabGroup,
  getArchyGroupId,
  reorderArchyGroupTabs
} from '../utils/chromeTabGroups'
import { 
  loadSections, 
  saveSections, 
  updateTodaySection, 
  toggleSectionCollapse,
  archiveTab,
  createBookmarkFromTab,
  addBookmarkToFavorites,
  removeBookmarkFromFavorites,
  createWorkspaceSection,
  createFolder,
  addFolderToFavorites,
  removeFolder,
  toggleFolderCollapse,
  renameFolder,
  moveBookmarkToFolder,
  loadPinnedTabs,
  savePinnedTabs,
  createDefaultSections
} from '../utils/sections'

export default function App() {
  const [tabs, setTabs] = useState<Tab[]>([])
  const [windows, setWindows] = useState<ChromeWindow[]>([])
  const [sections, setSections] = useState<SectionType[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [loading, setLoading] = useState(false)
  const [tabsLoading, setTabsLoading] = useState(true)
  const [isInitialized, setIsInitialized] = useState(false)
  const [contextMenu, setContextMenu] = useState<{
    tab: Tab
    position: { x: number; y: number }
  } | null>(null)
  const [bookmarkContextMenu, setBookmarkContextMenu] = useState<{
    bookmark: Bookmark
    position: { x: number; y: number }
  } | null>(null)
  const [folderContextMenu, setFolderContextMenu] = useState<{
    folder: Folder
    position: { x: number; y: number }
  } | null>(null)
  const [newFolderId, setNewFolderId] = useState<string | null>(null)
  // Debug logging disabled
  const debugLogs: string[] = []
  const addDebugLog = (_message: string) => {
    // Debug logging disabled
  }

  const loadTabs = async (preserveState: boolean = true) => {
    try {
      setTabsLoading(true)
      const chromeWindows = await chrome.windows.getAll({ populate: true })
      const processedWindows: ChromeWindow[] = []
      const allTabs: Tab[] = []
      const pinnedTabs: Tab[] = []

      for (const window of chromeWindows) {
        if (window.type === 'normal' && window.tabs) {
          const windowTabs: Tab[] = window.tabs.map(tab => ({
            id: tab.id!,
            url: tab.url || '',
            title: tab.title || 'Untitled',
            favIconUrl: tab.favIconUrl,
            active: tab.active,
            pinned: tab.pinned,
            windowId: tab.windowId,
            index: tab.index,
            groupId: tab.groupId === -1 ? undefined : tab.groupId
          }))

          processedWindows.push({
            id: window.id!,
            focused: window.focused,
            type: window.type,
            state: window.state!,
            tabs: windowTabs
          })

          allTabs.push(...windowTabs)
          
          // Collect pinned tabs to save
          pinnedTabs.push(...windowTabs.filter(tab => tab.pinned))
        }
      }

      setWindows(processedWindows)
      setTabs(allTabs)
      
      // Save pinned tabs to storage
      await savePinnedTabs(pinnedTabs)
      
      // Get Archy group ID
      const currentWindow = await chrome.windows.getCurrent()
      const archyGroupId = await getArchyGroupId(currentWindow.id)
      
      // Get current sections or load from storage
      let currentSections = sections
      if (currentSections.length === 0) {
        currentSections = await loadSections()
      }
      
      // Preserve folder collapse states if requested
      const folderStates = new Map<string, boolean>()
      if (preserveState) {
        currentSections.forEach(section => {
          if (section.type === 'favorites') {
            section.items.forEach(item => {
              if ('type' in item && item.type === 'folder') {
                folderStates.set(item.id, item.collapsed)
              }
            })
          }
        })
      }
      
      // Update ONLY the today section, preserving favorites and other sections
      // Pass archyGroupId to exclude those tabs from Today
      const updatedSections = await updateTodaySection(currentSections, allTabs, archyGroupId)
      
      // Restore folder collapse states
      if (preserveState && folderStates.size > 0) {
        const finalSections = updatedSections.map(section => {
          if (section.type === 'favorites') {
            return {
              ...section,
              items: section.items.map(item => {
                if ('type' in item && item.type === 'folder' && folderStates.has(item.id)) {
                  return {
                    ...item,
                    collapsed: folderStates.get(item.id)!
                  }
                }
                return item
              })
            }
          }
          return section
        })
        setSections(finalSections)
      } else {
        setSections(updatedSections)
      }
      // Don't save sections here as it would overwrite user changes to favorites
      // Only save when user explicitly makes changes
      
    } catch (error) {
      console.error('Error loading tabs:', error)
    } finally {
      setTabsLoading(false)
    }
  }

  const loadAppData = async () => {
    // Always load sections from storage to preserve user changes
    const sectionsData = await loadSections()
    
    const currentWindow = await chrome.windows.getCurrent()
    
    // First, sync existing favorites to Chrome tab group
    const favoritesSection = sectionsData.find(s => s.type === 'favorites')
    if (favoritesSection) {
      // Get all bookmark URLs from favorites (excluding folders)
      const favoriteBookmarks = favoritesSection.items
        .filter(item => 'url' in item && !('type' in item && item.type === 'folder'))
        .map(item => ({
          url: (item as Bookmark).url,
          title: (item as Bookmark).title
        }))
      
      // Also get bookmarks from folders
      favoritesSection.items.forEach(item => {
        if ('type' in item && item.type === 'folder') {
          const folder = item as Folder
          folder.items.forEach(bookmark => {
            favoriteBookmarks.push({
              url: bookmark.url,
              title: bookmark.title
            })
          })
        }
      })
      
      // Open all favorites as tabs in the Archy group
      if (favoriteBookmarks.length > 0) {
        console.log('Syncing favorites to Chrome tab group:', favoriteBookmarks)
        await syncFavoritesToTabGroup(favoriteBookmarks, currentWindow.id)
      }
    }
    
    // Get tabs from Archy group
    const archyTabs = await getArchyGroupTabs(currentWindow.id)
    
    // Update favorites section with tabs from Archy group
    const updatedSections = sectionsData.map(section => {
      if (section.type === 'favorites') {
        // Keep existing folders and bookmarks, add new ones from tab group
        const existingUrls = new Set(
          section.items
            .filter(item => 'url' in item)
            .map(item => (item as Bookmark).url)
        )
        
        // Add tabs from Archy group that aren't already in favorites
        const newBookmarks = archyTabs
          .filter(tab => tab.url && !existingUrls.has(tab.url))
          .map(tab => ({
            id: `bookmark-${Date.now()}-${Math.random()}`,
            title: tab.title || 'Untitled',
            url: tab.url!,
            favicon: tab.favIconUrl
          }))
        
        return {
          ...section,
          items: [...section.items, ...newBookmarks]
        }
      }
      return section
    })
    
    setSections(updatedSections)
    
    // Sync with Chrome bookmarks
    const updatedFavoritesSection = updatedSections.find(s => s.type === 'favorites')
    if (updatedFavoritesSection) {
      await syncFavoritesWithChrome(updatedFavoritesSection)
    }
  }

  const handleTabClick = async (tab: Tab) => {
    try {
      // Check if this is a stored pinned tab (negative ID)
      if (tab.id < 0 || !tab.windowId) {
        // This is a stored pinned tab, open it in a new tab
        await chrome.tabs.create({ url: tab.url, pinned: true })
      } else {
        // This is an active tab, switch to it
        const chromeTab = await chrome.tabs.get(tab.id).catch(() => null)
        if (chromeTab) {
          await chrome.tabs.update(tab.id, { active: true })
          await chrome.windows.update(tab.windowId, { focused: true })
        } else {
          // Tab doesn't exist anymore, open it
          await chrome.tabs.create({ url: tab.url, pinned: tab.pinned })
        }
      }
      // Reload tabs after action
      setTimeout(() => loadTabs(true), 100)
    } catch (error) {
      console.error('Error switching to tab:', error)
    }
  }

  const handleTabClose = async (tab: Tab) => {
    try {
      // For stored pinned tabs (negative ID) or tabs without windowId
      if (tab.id < 0 || !tab.windowId) {
        // Remove from pinned storage
        const pinnedTabs = await loadPinnedTabs()
        const updatedPinnedTabs = pinnedTabs.filter(t => t.url !== tab.url)
        await savePinnedTabs(updatedPinnedTabs)
        
        // Update sections to remove the tab
        const updatedSections = sections.map(section => {
          if (section.type === 'today') {
            return {
              ...section,
              items: section.items.filter(item => 
                !('url' in item) || item.url !== tab.url
              )
            }
          }
          return section
        })
        setSections(updatedSections)
        await saveSections(updatedSections)
      } else {
        // Check if tab exists
        const chromeTab = await chrome.tabs.get(tab.id).catch(() => null)
        
        if (chromeTab) {
          // Tab exists - close it
          await chrome.tabs.remove(tab.id)
        }
      }
      
      loadTabs(true)
    } catch (error) {
      console.error('Error closing/unpinning tab:', error)
    }
  }

  const handleTabRename = async (tab: Tab, newTitle: string) => {
    // Note: Chrome doesn't allow changing tab titles directly
    // This would typically require a content script or extension API
    console.log('Tab rename requested:', tab.title, '->', newTitle)
    // For demo purposes, we could store custom titles in chrome storage
  }

  const handleNewTab = async () => {
    try {
      const currentWindow = await chrome.windows.getCurrent()
      await chrome.tabs.create({ windowId: currentWindow.id })
    } catch (error) {
      console.error('Error creating new tab:', error)
    }
  }

  const handleSectionToggle = async (sectionId: string) => {
    // Don't allow toggling the Today section
    const section = sections.find(s => s.id === sectionId)
    if (section?.type === 'today') return
    
    const updatedSections = toggleSectionCollapse(sections, sectionId)
    setSections(updatedSections)
    await saveSections(updatedSections)
  }

  const handleAddToFavorites = async (tab: Tab) => {
    console.log('Adding to favorites (tab group):', tab)
    
    try {
      // Add tab to Chrome's Archy tab group
      const chromeTab = await chrome.tabs.get(tab.id)
      await addTabToArchyGroup(chromeTab)
      
      // Also add to our favorites section for display in sidebar
      const bookmark = createBookmarkFromTab(tab)
      
      // Ensure we have sections loaded
      let currentSections = sections
      if (currentSections.length === 0) {
        console.log('No sections found, loading from storage')
        currentSections = await loadSections()
      }
      
      // Check if favorites section exists
      const hasFavorites = currentSections.some(s => s.type === 'favorites')
      if (!hasFavorites) {
        console.log('No favorites section found, creating default sections')
        currentSections = createDefaultSections()
      }
      
      const updatedSections = addBookmarkToFavorites(currentSections, bookmark)
      console.log('Updated sections:', updatedSections)
      setSections(updatedSections)
      await saveSections(updatedSections)
      
      console.log('Added tab to Archy group and saved to storage')
      
      // Reload tabs to remove from Today section (since it's now in Archy group)
      // Use a small delay to ensure Chrome has updated the tab group
      setTimeout(() => {
        loadTabs(true) // Preserve folder states
      }, 200)
    } catch (error) {
      console.error('Error adding to favorites:', error)
    }
  }

  const handleBookmarkClick = async (bookmark: Bookmark) => {
    try {
      // Check if tab already exists in Archy group
      const currentWindow = await chrome.windows.getCurrent()
      const archyTabs = await getArchyGroupTabs(currentWindow.id)
      const existingTab = archyTabs.find(t => t.url === bookmark.url)
      
      if (existingTab) {
        // Switch to existing tab
        await chrome.tabs.update(existingTab.id!, { active: true })
      } else {
        // Create new tab in Archy group
        await createTabInArchyGroup(bookmark.url, bookmark.title, currentWindow.id)
      }
    } catch (error) {
      console.error('Error opening bookmark:', error)
    }
  }

  const handleBookmarkRemove = async (bookmark: Bookmark) => {
    const updatedSections = removeBookmarkFromFavorites(sections, bookmark.id)
    setSections(updatedSections)
    await saveSections(updatedSections)
    
    // Remove from Chrome bookmarks
    await removeChromeBookmark(bookmark.url)
  }

  const handleArchiveTab = async (tab: Tab) => {
    try {
      await chrome.tabs.remove(tab.id)
      const updatedSections = archiveTab(sections, tab)
      setSections(updatedSections)
      await saveSections(updatedSections)
      // Reload with state preservation
      setTimeout(() => {
        loadTabs(true)
      }, 200)
    } catch (error) {
      console.error('Error archiving tab:', error)
    }
  }

  const handleTabContextMenu = (tab: Tab, position: { x: number; y: number }) => {
    setContextMenu({ tab, position })
  }

  const handleBookmarkContextMenu = (bookmark: Bookmark, position: { x: number; y: number }) => {
    setBookmarkContextMenu({ bookmark, position })
  }

  const handleCopyUrl = async (tab: Tab) => {
    try {
      await navigator.clipboard.writeText(tab.url)
    } catch (error) {
      console.error('Error copying URL:', error)
    }
  }

  const handleOpenInNewWindow = async (tab: Tab) => {
    try {
      await chrome.windows.create({ url: tab.url })
    } catch (error) {
      console.error('Error opening in new window:', error)
    }
  }

  // Bookmark context menu handlers
  const handleEditBookmark = (bookmark: Bookmark) => {
    const newTitle = prompt('Edit bookmark title:', bookmark.title)
    if (newTitle && newTitle.trim()) {
      const updatedSections = sections.map(section => ({
        ...section,
        items: section.items.map(item => 
          'id' in item && item.id === bookmark.id 
            ? { ...item, title: newTitle.trim() }
            : item
        )
      }))
      setSections(updatedSections)
      saveSections(updatedSections)
    }
  }

  const handleBookmarkCopyUrl = async (bookmark: Bookmark) => {
    try {
      await navigator.clipboard.writeText(bookmark.url)
    } catch (error) {
      console.error('Error copying bookmark URL:', error)
    }
  }

  const handleBookmarkOpenInNewTab = async (bookmark: Bookmark) => {
    try {
      await chrome.tabs.create({ url: bookmark.url })
    } catch (error) {
      console.error('Error opening bookmark:', error)
    }
  }

  const handleCreateFolder = async () => {
    // Create folder with default name, user can edit inline
    const newFolder = createFolder('New Folder')
    const updatedSections = addFolderToFavorites(sections, newFolder)
    setSections(updatedSections)
    await saveSections(updatedSections)
    
    // Track the new folder ID to trigger auto-edit
    setNewFolderId(newFolder.id)
    // Clear it after a moment
    setTimeout(() => setNewFolderId(null), 100)
    
    return newFolder.id
  }
  
  const handleCreateSubfolder = async (parentFolder: Folder) => {
    // Create a new subfolder
    const newSubfolder = createFolder('New Subfolder')
    
    // Add subfolder to parent folder
    const updatedSections = sections.map(section => {
      if (section.type === 'favorites') {
        const updateFolderRecursively = (items: any[]): any[] => {
          return items.map(item => {
            if ('type' in item && item.type === 'folder' && item.id === parentFolder.id) {
              // Found the parent folder, add subfolder
              return {
                ...item,
                items: [...item.items, newSubfolder]
              }
            } else if ('type' in item && item.type === 'folder') {
              // Recursively check nested folders
              return {
                ...item,
                items: updateFolderRecursively(item.items)
              }
            }
            return item
          })
        }
        
        return {
          ...section,
          items: updateFolderRecursively(section.items)
        }
      }
      return section
    })
    
    setSections(updatedSections)
    await saveSections(updatedSections)
    
    // Track the new folder ID to trigger auto-edit
    setNewFolderId(newSubfolder.id)
    setTimeout(() => setNewFolderId(null), 100)
    
    return newSubfolder.id
  }

  const handleFolderContextMenu = (folder: Folder, position: { x: number; y: number }) => {
    setFolderContextMenu({ folder, position })
  }

  const handleFolderToggleCollapse = async (folderId: string) => {
    const updatedSections = toggleFolderCollapse(sections, folderId)
    setSections(updatedSections)
    await saveSections(updatedSections)
  }

  const handleRenameFolder = async (folder: Folder) => {
    // This will be handled by inline editing now
    // Trigger inline edit mode for the folder
    return folder.id
  }

  const handleFolderRename = async (folder: Folder, newName: string) => {
    const updatedSections = renameFolder(sections, folder.id, newName)
    setSections(updatedSections)
    await saveSections(updatedSections)
  }

  const handleDeleteFolder = async (folder: Folder) => {
    if (confirm(`Are you sure you want to delete "${folder.name}" folder and all its bookmarks?`)) {
      const updatedSections = removeFolder(sections, folder.id)
      setSections(updatedSections)
      await saveSections(updatedSections)
    }
  }

  const handleDropIntoFolder = async (folder: Folder, dragData: any) => {
    console.log('Dropping into folder:', folder.name, dragData)
    
    // Handle dropping items into folders
    const { item, type, sectionId, index } = dragData
    
    if (type === 'bookmark' || type === 'tab') {
      let bookmarkToAdd: Bookmark
      
      if (type === 'tab') {
        // Convert tab to bookmark
        bookmarkToAdd = createBookmarkFromTab(item as Tab)
      } else {
        // Use existing bookmark
        bookmarkToAdd = item as Bookmark
      }
      
      console.log('Bookmark to add:', bookmarkToAdd)
      
      // If it's a bookmark from favorites, use moveBookmarkToFolder
      if (type === 'bookmark' && sectionId === 'favorites') {
        const updatedSections = moveBookmarkToFolder(sections, bookmarkToAdd.id, folder.id)
        setSections(updatedSections)
        await saveSections(updatedSections)
        console.log('Moved bookmark to folder using moveBookmarkToFolder')
        
        // Sync with Chrome bookmarks and reorder tab group
        const updatedFavoritesSection = updatedSections.find(s => s.type === 'favorites')
        if (updatedFavoritesSection) {
          await syncFavoritesWithChrome(updatedFavoritesSection)
          
          // Reorder tabs in Archy group
          const currentWindow = await chrome.windows.getCurrent()
          const favoriteBookmarks: Array<{url: string, title: string}> = []
          
          // Get all bookmarks from favorites (including folders)
          updatedFavoritesSection.items.forEach(item => {
            if ('url' in item && !('type' in item && item.type === 'folder')) {
              favoriteBookmarks.push({
                url: (item as Bookmark).url,
                title: (item as Bookmark).title
              })
            } else if ('type' in item && item.type === 'folder') {
              const folder = item as Folder
              folder.items.forEach(bookmark => {
                favoriteBookmarks.push({
                  url: bookmark.url,
                  title: bookmark.title
                })
              })
            }
          })
          
          await reorderArchyGroupTabs(favoriteBookmarks, currentWindow.id)
        }
        return
      }
      
      // For tabs from Today section or new bookmarks, add them to the folder
      const updatedSections = sections.map(section => {
        if (section.type === 'favorites') {
          const addToFolderRecursively = (items: any[]): any[] => {
            return items.map(item => {
              if ('type' in item && item.type === 'folder' && item.id === folder.id) {
                // Check if bookmark already exists in this folder
                const alreadyExists = item.items.some((folderItem: any) => 
                  'url' in folderItem && folderItem.url === bookmarkToAdd.url
                )
                
                if (alreadyExists) {
                  console.log('Item already exists in folder')
                  return item
                }
                
                console.log('Adding to folder:', folder.name)
                return {
                  ...item,
                  items: [...item.items, bookmarkToAdd]
                }
              } else if ('type' in item && item.type === 'folder') {
                // Recursively check nested folders
                return {
                  ...item,
                  items: addToFolderRecursively(item.items)
                }
              }
              return item
            })
          }
          
          return {
            ...section,
            items: addToFolderRecursively(section.items)
          }
        }
        return section
      })
      
      console.log('Updated sections:', updatedSections)
      setSections(updatedSections)
      await saveSections(updatedSections)
      console.log('Saved to storage')
      
      // Sync with Chrome bookmarks and reorder tab group
      const updatedFavoritesSection = updatedSections.find(s => s.type === 'favorites')
      if (updatedFavoritesSection) {
        await syncFavoritesWithChrome(updatedFavoritesSection)
        console.log('Synced with Chrome bookmarks')
        
        // Reorder tabs in Archy group
        const currentWindow = await chrome.windows.getCurrent()
        const favoriteBookmarks: Array<{url: string, title: string}> = []
        
        // Get all bookmarks from favorites (including folders)
        updatedFavoritesSection.items.forEach(item => {
          if ('url' in item && !('type' in item && item.type === 'folder')) {
            favoriteBookmarks.push({
              url: (item as Bookmark).url,
              title: (item as Bookmark).title
            })
          } else if ('type' in item && item.type === 'folder') {
            const folder = item as Folder
            folder.items.forEach(bookmark => {
              favoriteBookmarks.push({
                url: bookmark.url,
                title: bookmark.title
              })
            })
          }
        })
        
        await reorderArchyGroupTabs(favoriteBookmarks, currentWindow.id)
      }
    }
  }
  
  const handleMoveBookmarkToFolder = async (bookmark: Bookmark) => {
    // Get available folders
    const availableFolders: Folder[] = []
    sections.forEach(section => {
      if (section.type === 'favorites') {
        section.items.forEach(item => {
          if ('type' in item && item.type === 'folder') {
            availableFolders.push(item)
          }
        })
      }
    })

    if (availableFolders.length === 0) {
      alert('No folders available. Create a folder first.')
      return
    }

    const folderNames = availableFolders.map(f => f.name).join('\n')
    const selectedFolderName = prompt(`Select folder to move bookmark to:\n\n${folderNames}\n\nEnter folder name:`)
    
    if (selectedFolderName) {
      const targetFolder = availableFolders.find(f => f.name === selectedFolderName)
      if (targetFolder) {
        const updatedSections = moveBookmarkToFolder(sections, bookmark.id, targetFolder.id)
        setSections(updatedSections)
        await saveSections(updatedSections)
      } else {
        alert('Folder not found.')
      }
    }
  }

  // Simple drag and drop handlers
  const handleDragMove = async (dragData: DragData, targetSectionId: string, targetIndex?: number) => {
    // Don't move if dropping on same item
    if (dragData.sectionId === targetSectionId && targetIndex !== undefined && 
        (targetIndex === dragData.index || targetIndex === dragData.index + 1)) {
      return
    }
    
    // Special handling for pinned tabs in Today section
    if (dragData.sectionId === 'today' && targetSectionId === 'today' && 'windowId' in dragData.item) {
      const tab = dragData.item as Tab
      const todaySection = sections.find(s => s.id === 'today')
      if (!todaySection) return
      
      const pinnedCount = todaySection.items.filter(item => 
        'windowId' in item && item.pinned
      ).length
      
      // If dragging a pinned tab below the separator, unpin it
      if (tab.pinned && targetIndex !== undefined && targetIndex >= pinnedCount) {
        try {
          // For active tabs, unpin via Chrome API
          if (tab.id > 0) {
            await chrome.tabs.update(tab.id, { pinned: false })
          }
          
          // Also remove from pinned storage
          const pinnedTabs = await loadPinnedTabs()
          const updatedPinnedTabs = pinnedTabs.filter(t => t.url !== tab.url)
          await savePinnedTabs(updatedPinnedTabs)
          
          setTimeout(() => loadTabs(true), 100)
          return
        } catch (error) {
          console.error('Error unpinning tab:', error)
        }
      }
      
      // If dragging an unpinned tab above the separator, pin it
      if (!tab.pinned && targetIndex !== undefined && targetIndex < pinnedCount) {
        try {
          await chrome.tabs.update(tab.id, { pinned: true })
          setTimeout(() => loadTabs(true), 100)
          return
        } catch (error) {
          console.error('Error pinning tab:', error)
        }
      }
    }
    
    // Special handling for Today section (real Chrome tabs)
    if (dragData.sectionId === 'today' && targetSectionId === 'today' && 'windowId' in dragData.item) {
      const tab = dragData.item as Tab
      try {
        let newIndex = targetIndex !== undefined ? targetIndex : 0
        // Adjust index if moving down within same section
        if (targetIndex !== undefined && targetIndex > dragData.index) {
          newIndex = targetIndex - 1
        }
        
        // Move the actual Chrome tab
        await chrome.tabs.move(tab.id, { index: newIndex })
        
        // Reload tabs to reflect the change
        setTimeout(() => loadTabs(true), 100)
        return
      } catch (error) {
        console.error('Error moving Chrome tab:', error)
        return
      }
    }
    
    if (dragData.sectionId === targetSectionId) {
      // Reordering within same section (non-Today sections)
      const updatedSections = sections.map(section => {
        if (section.id === dragData.sectionId) {
          const items = [...section.items]
          const draggedItem = items.splice(dragData.index, 1)[0]
          
          let newIndex = targetIndex !== undefined ? targetIndex : items.length
          // Adjust index if moving down within same section
          if (targetIndex !== undefined && targetIndex > dragData.index) {
            newIndex = targetIndex - 1
          }
          
          items.splice(newIndex, 0, draggedItem)
          return { ...section, items }
        }
        return section
      })
      setSections(updatedSections)
      await saveSections(updatedSections)
    } else {
      // Moving between sections
      let draggedItem: Tab | Bookmark | Folder | null = null
      
      // First pass: remove item from source
      const sectionsAfterRemove = sections.map(section => {
        if (section.id === dragData.sectionId) {
          const items = [...section.items]
          draggedItem = items.splice(dragData.index, 1)[0]
          return { ...section, items }
        }
        return section
      })
      
      // Convert tab to bookmark if moving to favorites
      if (draggedItem && targetSectionId === 'favorites' && 'windowId' in draggedItem) {
        console.log('Converting tab to bookmark for favorites:', draggedItem)
        draggedItem = createBookmarkFromTab(draggedItem as Tab)
      }
      
      // Second pass: add item to target
      const updatedSections = sectionsAfterRemove.map(section => {
        if (section.id === targetSectionId && draggedItem) {
          // Check for duplicates in favorites
          if (section.type === 'favorites' && 'url' in draggedItem) {
            const exists = section.items.some(item => 
              'url' in item && item.url === draggedItem.url
            )
            if (exists) {
              console.log('Item already exists in favorites')
              return section
            }
          }
          
          const items = [...section.items]
          const newIndex = targetIndex !== undefined ? targetIndex : items.length
          items.splice(newIndex, 0, draggedItem)
          return { ...section, items }
        }
        return section
      })
      
      setSections(updatedSections)
      await saveSections(updatedSections)
      
      // Sync with Chrome bookmarks and tab group if favorites section was modified
      if (targetSectionId === 'favorites' || dragData.sectionId === 'favorites') {
        const favoritesSection = updatedSections.find(s => s.type === 'favorites')
        if (favoritesSection) {
          await syncFavoritesWithChrome(favoritesSection)
          
          // Reorder tabs in Archy group based on new favorites order
          const currentWindow = await chrome.windows.getCurrent()
          const favoriteBookmarks = favoritesSection.items
            .filter(item => 'url' in item && !('type' in item && item.type === 'folder'))
            .map(item => ({
              url: (item as Bookmark).url,
              title: (item as Bookmark).title
            }))
          
          // Also include bookmarks from folders
          favoritesSection.items.forEach(item => {
            if ('type' in item && item.type === 'folder') {
              const folder = item as Folder
              folder.items.forEach(bookmark => {
                favoriteBookmarks.push({
                  url: bookmark.url,
                  title: bookmark.title
                })
              })
            }
          })
          
          await reorderArchyGroupTabs(favoriteBookmarks, currentWindow.id)
        }
      }
    }
  }

  const { createDragHandlers, createDropHandlers, createItemDropHandlers, isDragging, dropIndicator } = useSimpleDragDrop({
    onMove: handleDragMove
  })

  const handleCreateWorkspace = async (name: string) => {
    const newWorkspace = createWorkspaceSection(name)
    const updatedSections = [...sections, newWorkspace]
    setSections(updatedSections)
    await saveSections(updatedSections)
  }

  // Keyboard shortcuts
  const handleNextTab = () => {
    const activeTabs = tabs.filter(tab => !tab.pinned)
    const currentIndex = activeTabs.findIndex(tab => tab.active)
    const nextIndex = (currentIndex + 1) % activeTabs.length
    if (activeTabs[nextIndex]) {
      handleTabClick(activeTabs[nextIndex])
    }
  }

  const handlePreviousTab = () => {
    const activeTabs = tabs.filter(tab => !tab.pinned)
    const currentIndex = activeTabs.findIndex(tab => tab.active)
    const prevIndex = currentIndex === 0 ? activeTabs.length - 1 : currentIndex - 1
    if (activeTabs[prevIndex]) {
      handleTabClick(activeTabs[prevIndex])
    }
  }

  const handleCloseCurrentTab = () => {
    const activeTab = tabs.find(tab => tab.active)
    if (activeTab) {
      handleTabClose(activeTab)
    }
  }

  const handleFocusSearch = () => {
    setShowSearch(true)
    // Focus search input after state update
    setTimeout(() => {
      const searchInput = document.querySelector('.search-input') as HTMLInputElement
      if (searchInput) {
        searchInput.focus()
      }
    }, 100)
  }

  useKeyboardShortcuts({
    onSearch: () => setShowSearch(true),
    onNewTab: handleNewTab,
    onCloseCurrentTab: handleCloseCurrentTab,
    onNextTab: handleNextTab,
    onPreviousTab: handlePreviousTab,
    onFocusSearch: handleFocusSearch
  })

  // Initial load effect
  useEffect(() => {
    if (!isInitialized) {
      // Load saved sections immediately (including favorites/folders)
      loadAppData()
      
      // Load tabs asynchronously after a short delay
      const loadTabsAsync = async () => {
        await new Promise(resolve => setTimeout(resolve, 100))
        await loadTabs(false) // Don't preserve state on initial load
        setIsInitialized(true)
      }
      loadTabsAsync()
      
      // Notify background that panel is open
      chrome.windows.getCurrent().then(window => {
        chrome.runtime.sendMessage({ 
          type: 'SIDEPANEL_OPENED',
          windowId: window.id 
        }).catch(() => {})
      })
    }
  }, [])
  
  // Handle messages from background script
  useEffect(() => {
    const handleMessage = (message: any) => {
      if (message.type === 'PING_SIDEPANEL') {
        // Respond to ping
        return Promise.resolve({ alive: true })
      } else if (message.type === 'CLOSE_SIDEPANEL') {
        // Close the panel (this will naturally happen when window closes)
        window.close()
      }
    }
    
    chrome.runtime.onMessage.addListener(handleMessage)
    
    return () => {
      chrome.runtime.onMessage.removeListener(handleMessage)
      
      // Notify background that panel is closing
      chrome.windows.getCurrent().then(window => {
        chrome.runtime.sendMessage({ 
          type: 'SIDEPANEL_CLOSED',
          windowId: window.id 
        }).catch(() => {})
      })
    }
  }, [])

  // Tab listeners effect with debouncing and smart updates
  useEffect(() => {
    if (!isInitialized) return

    let updateTimeout: NodeJS.Timeout
    let pendingUpdates = new Set<string>()
    
    const debouncedLoadTabs = (updateType: string) => {
      pendingUpdates.add(updateType)
      clearTimeout(updateTimeout)
      updateTimeout = setTimeout(() => {
        // Check what kind of updates we need
        const needsFullReload = pendingUpdates.has('created') || 
                               pendingUpdates.has('removed') || 
                               pendingUpdates.has('pinned')
        
        if (needsFullReload) {
          loadTabs(true) // Preserve folder states
        } else {
          // Just update active states without full reload
          updateActiveStates()
        }
        
        pendingUpdates.clear()
      }, 300) // Debounce for 300ms
    }
    
    const updateActiveStates = async () => {
      try {
        const chromeWindows = await chrome.windows.getAll({ populate: true })
        const allTabs: Tab[] = []
        
        for (const window of chromeWindows) {
          if (window.type === 'normal' && window.tabs) {
            window.tabs.forEach(tab => {
              allTabs.push({
                id: tab.id!,
                url: tab.url || '',
                title: tab.title || 'Untitled',
                favIconUrl: tab.favIconUrl,
                active: tab.active,
                pinned: tab.pinned,
                windowId: tab.windowId,
                index: tab.index,
                groupId: tab.groupId === -1 ? undefined : tab.groupId
              })
            })
          }
        }
        
        // Only update the active states in existing sections
        setSections(prevSections => {
          return prevSections.map(section => {
            if (section.type === 'today') {
              return {
                ...section,
                items: section.items.map(item => {
                  if ('windowId' in item) {
                    const updatedTab = allTabs.find(t => t.id === item.id)
                    if (updatedTab) {
                      return { ...item, active: updatedTab.active }
                    }
                  }
                  return item
                })
              }
            }
            return section
          })
        })
      } catch (error) {
        console.error('Error updating active states:', error)
      }
    }

    const handleTabUpdated = (tabId: number, changeInfo: chrome.tabs.TabChangeInfo, tab: chrome.tabs.Tab) => {
      // Categorize the type of change
      if (changeInfo.pinned !== undefined) {
        debouncedLoadTabs('pinned')
      } else if (changeInfo.status === 'complete' || changeInfo.title || changeInfo.favIconUrl) {
        debouncedLoadTabs('updated')
      }
    }
    
    const handleTabCreated = () => debouncedLoadTabs('created')
    const handleTabRemoved = () => debouncedLoadTabs('removed')
    const handleTabActivated = () => debouncedLoadTabs('activated')

    chrome.tabs.onUpdated.addListener(handleTabUpdated)
    chrome.tabs.onCreated.addListener(handleTabCreated)
    chrome.tabs.onRemoved.addListener(handleTabRemoved)
    chrome.tabs.onActivated.addListener(handleTabActivated)

    return () => {
      clearTimeout(updateTimeout)
      chrome.tabs.onUpdated.removeListener(handleTabUpdated)
      chrome.tabs.onCreated.removeListener(handleTabCreated)
      chrome.tabs.onRemoved.removeListener(handleTabRemoved)
      chrome.tabs.onActivated.removeListener(handleTabActivated)
    }
  }, [isInitialized])

  // Keyboard event listeners
  useEffect(() => {
    const handleSwitchToTabByIndex = (e: Event) => {
      const customEvent = e as CustomEvent
      const { index } = customEvent.detail
      const visibleTabs = tabs.filter(tab => !tab.pinned)
      if (visibleTabs[index]) {
        handleTabClick(visibleTabs[index])
      }
    }

    const handleClearSearchAndMenus = () => {
      setSearchQuery('')
      setShowSearch(false)
      setContextMenu(null)
      setBookmarkContextMenu(null)
      setFolderContextMenu(null)
    }
    
    window.addEventListener('switchToTabByIndex', handleSwitchToTabByIndex)
    window.addEventListener('clearSearchAndMenus', handleClearSearchAndMenus)

    return () => {
      window.removeEventListener('switchToTabByIndex', handleSwitchToTabByIndex)
      window.removeEventListener('clearSearchAndMenus', handleClearSearchAndMenus)
    }
  }, [tabs])

  const filteredSections = sections.map(section => ({
    ...section,
    items: section.items.filter(item => {
      const title = 'title' in item ? item.title : ''
      const url = 'url' in item ? item.url : ''
      const query = searchQuery.toLowerCase()
      return title.toLowerCase().includes(query) || url.toLowerCase().includes(query)
    })
  })).filter(section => searchQuery === '' || section.items.length > 0)

  // Remove the full-screen loading state

  return (
    <div className="h-full flex flex-col bg-gray-900">
      <div className="sidebar-header">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold text-gray-100">
            Archy
          </h1>
          <span className="text-sm text-gray-400">
            ({sections.reduce((total, section) => total + section.items.length, 0)})
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="p-2 hover:bg-gray-800 rounded-md transition-colors text-gray-400 hover:text-gray-200"
            title="Search tabs"
          >
            <Search className="w-4 h-4" />
          </button>
          <button
            onClick={handleNewTab}
            className="p-2 hover:bg-gray-800 rounded-md transition-colors text-gray-400 hover:text-gray-200"
            title="New tab"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            className="p-2 hover:bg-gray-800 rounded-md transition-colors text-gray-400 hover:text-gray-200"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>


      {showSearch && (
        <div className="p-4 border-b border-gray-700 bg-gray-900">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search tabs..."
          />
        </div>
      )}

      <div className="sidebar-content">
        {filteredSections.map((section) => {
          // Show loading state for Today section while tabs are loading
          const isTodayLoading = section.type === 'today' && tabsLoading
          
          return (
            <Section
              key={section.id}
              section={section}
              isLoading={isTodayLoading}
              onToggleCollapse={handleSectionToggle}
              onTabClick={handleTabClick}
              onTabClose={handleTabClose}
              onTabContextMenu={handleTabContextMenu}
              onTabRename={handleTabRename}
              onBookmarkClick={handleBookmarkClick}
              onBookmarkRemove={handleBookmarkRemove}
              onBookmarkContextMenu={handleBookmarkContextMenu}
              onFolderToggleCollapse={handleFolderToggleCollapse}
              onFolderContextMenu={handleFolderContextMenu}
              onFolderRename={handleFolderRename}
              onDropIntoFolder={handleDropIntoFolder}
              dropProps={createDropHandlers(section.id)}
              getDragPropsForItem={(item, index) => createDragHandlers({
                type: 'windowId' in item ? 'tab' : ('type' in item && item.type === 'folder') ? 'folder' : 'bookmark',
                item,
                sectionId: section.id,
                index
              })}
              getDropPropsForItem={(sectionId, index) => createItemDropHandlers(sectionId, index)}
              dropIndicator={dropIndicator}
              newFolderId={newFolderId}
            />
          )
        })}
        
        {filteredSections.length === 0 && searchQuery && (
          <div className="p-4 text-center text-gray-400">
            No results found for "{searchQuery}"
          </div>
        )}

        {/* New Tab Button - Arc Style */}
        <div className="px-3 py-3">
          <button
            onClick={handleNewTab}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-800/70 transition-all duration-150 text-gray-400 hover:text-gray-200"
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm font-medium">New Tab</span>
          </button>
        </div>

        {/* New Workspace Button */}
        <NewWorkspaceButton onCreateWorkspace={handleCreateWorkspace} />
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          tab={contextMenu.tab}
          position={contextMenu.position}
          onClose={() => setContextMenu(null)}
          onAddToFavorites={handleAddToFavorites}
          onArchiveTab={handleArchiveTab}
          onCloseTab={handleTabClose}
          onCopyUrl={handleCopyUrl}
          onOpenInNewWindow={handleOpenInNewWindow}
        />
      )}

      {/* Bookmark Context Menu */}
      {bookmarkContextMenu && (
        <BookmarkContextMenu
          bookmark={bookmarkContextMenu.bookmark}
          position={bookmarkContextMenu.position}
          onClose={() => setBookmarkContextMenu(null)}
          onEdit={handleEditBookmark}
          onRemove={handleBookmarkRemove}
          onOpenInNewTab={handleBookmarkOpenInNewTab}
          onCopyUrl={handleBookmarkCopyUrl}
          onCreateFolder={handleCreateFolder}
          onMoveToFolder={handleMoveBookmarkToFolder}
        />
      )}

      {/* Folder Context Menu */}
      {folderContextMenu && (
        <FolderContextMenu
          folder={folderContextMenu.folder}
          position={folderContextMenu.position}
          onClose={() => setFolderContextMenu(null)}
          onRename={handleRenameFolder}
          onDelete={handleDeleteFolder}
          onCreateSubfolder={(parentFolder) => handleCreateSubfolder(parentFolder)}
        />
      )}
    </div>
  )
}