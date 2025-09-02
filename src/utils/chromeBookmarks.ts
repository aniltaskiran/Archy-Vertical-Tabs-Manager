// Chrome Bookmarks API integration for Archy favorites

const ARCHY_FOLDER_NAME = 'Archy Favorites'

// Get or create the Archy bookmarks folder
export async function getOrCreateArchyFolder(): Promise<chrome.bookmarks.BookmarkTreeNode> {
  try {
    // Search for existing Archy folder
    const searchResults = await chrome.bookmarks.search({ title: ARCHY_FOLDER_NAME })
    
    // Filter to find folder in bookmarks bar
    const archyFolder = searchResults.find(node => 
      !node.url && node.title === ARCHY_FOLDER_NAME
    )
    
    if (archyFolder) {
      console.log('Found existing Archy folder:', archyFolder)
      return archyFolder
    }
    
    // Create new folder in the bookmarks bar (id: "1")
    const newFolder = await chrome.bookmarks.create({
      parentId: '1', // Bookmarks bar
      title: ARCHY_FOLDER_NAME
    })
    
    console.log('Created new Archy folder:', newFolder)
    return newFolder
  } catch (error) {
    console.error('Error getting/creating Archy folder:', error)
    throw error
  }
}

// Add bookmark to Chrome
export async function addChromeBookmark(
  url: string, 
  title: string,
  parentId?: string
): Promise<chrome.bookmarks.BookmarkTreeNode | null> {
  try {
    const folder = parentId || (await getOrCreateArchyFolder()).id
    
    // Check if bookmark already exists in the folder
    const children = await chrome.bookmarks.getChildren(folder)
    const exists = children.some(child => child.url === url)
    
    if (exists) {
      console.log('Bookmark already exists in Chrome:', url)
      return null
    }
    
    // Create the bookmark
    const bookmark = await chrome.bookmarks.create({
      parentId: folder,
      title,
      url
    })
    
    console.log('Added Chrome bookmark:', bookmark)
    return bookmark
  } catch (error) {
    console.error('Error adding Chrome bookmark:', error)
    return null
  }
}

// Remove bookmark from Chrome
export async function removeChromeBookmark(url: string): Promise<void> {
  try {
    const folder = await getOrCreateArchyFolder()
    const children = await chrome.bookmarks.getChildren(folder.id)
    
    const bookmark = children.find(child => child.url === url)
    if (bookmark) {
      await chrome.bookmarks.remove(bookmark.id)
      console.log('Removed Chrome bookmark:', url)
    }
  } catch (error) {
    console.error('Error removing Chrome bookmark:', error)
  }
}

// Move bookmark within Chrome
export async function moveChromeBookmark(
  url: string,
  newIndex: number
): Promise<void> {
  try {
    const folder = await getOrCreateArchyFolder()
    const children = await chrome.bookmarks.getChildren(folder.id)
    
    const bookmark = children.find(child => child.url === url)
    if (bookmark) {
      await chrome.bookmarks.move(bookmark.id, {
        parentId: folder.id,
        index: newIndex
      })
      console.log('Moved Chrome bookmark:', url, 'to index:', newIndex)
    }
  } catch (error) {
    console.error('Error moving Chrome bookmark:', error)
  }
}

// Sync all favorites with Chrome bookmarks (including folders)
export async function syncFavoritesWithChrome(favoritesSection: any): Promise<void> {
  try {
    const folder = await getOrCreateArchyFolder()
    const children = await chrome.bookmarks.getChildren(folder.id)
    
    // Helper function to sync items recursively
    async function syncItems(items: any[], parentId: string, existingChildren: chrome.bookmarks.BookmarkTreeNode[]) {
      // Track which existing items we've matched
      const matchedIds = new Set<string>()
      
      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        
        if ('type' in item && item.type === 'folder') {
          // Handle folder
          let folderNode = existingChildren.find(child => 
            !child.url && child.title === item.name
          )
          
          if (!folderNode) {
            // Create new folder
            folderNode = await chrome.bookmarks.create({
              parentId,
              title: item.name,
              index: i
            })
            console.log('Created Chrome folder:', item.name)
          } else {
            matchedIds.add(folderNode.id)
            // Update position if needed
            if (folderNode.index !== i) {
              await chrome.bookmarks.move(folderNode.id, {
                parentId,
                index: i
              })
            }
          }
          
          // Recursively sync folder contents
          const folderChildren = await chrome.bookmarks.getChildren(folderNode.id)
          await syncItems(item.items || [], folderNode.id, folderChildren)
        } else if ('url' in item) {
          // Handle bookmark
          let bookmarkNode = existingChildren.find(child => 
            child.url === item.url
          )
          
          if (!bookmarkNode) {
            // Create new bookmark
            await chrome.bookmarks.create({
              parentId,
              title: item.title,
              url: item.url,
              index: i
            })
            console.log('Created Chrome bookmark:', item.title)
          } else {
            matchedIds.add(bookmarkNode.id)
            // Update position and title if needed
            if (bookmarkNode.index !== i) {
              await chrome.bookmarks.move(bookmarkNode.id, {
                parentId,
                index: i
              })
            }
            if (bookmarkNode.title !== item.title) {
              await chrome.bookmarks.update(bookmarkNode.id, {
                title: item.title
              })
            }
          }
        }
      }
      
      // Remove items that no longer exist
      for (const child of existingChildren) {
        if (!matchedIds.has(child.id)) {
          await chrome.bookmarks.remove(child.id)
          console.log('Removed orphaned Chrome item:', child.title)
        }
      }
    }
    
    // Start syncing from the root
    await syncItems(favoritesSection.items || [], folder.id, children)
    
    console.log('Synced favorites with Chrome bookmarks (including folders)')
  } catch (error) {
    console.error('Error syncing with Chrome bookmarks:', error)
  }
}

// Load favorites from Chrome bookmarks
export async function loadFavoritesFromChrome(): Promise<Array<{url: string, title: string, id: string}>> {
  try {
    const folder = await getOrCreateArchyFolder()
    const children = await chrome.bookmarks.getChildren(folder.id)
    
    return children
      .filter(child => child.url) // Only bookmarks, not folders
      .map(child => ({
        id: child.id,
        url: child.url!,
        title: child.title
      }))
  } catch (error) {
    console.error('Error loading favorites from Chrome:', error)
    return []
  }
}

// Create a subfolder in Archy favorites
export async function createChromeFolder(name: string): Promise<chrome.bookmarks.BookmarkTreeNode | null> {
  try {
    const parentFolder = await getOrCreateArchyFolder()
    
    const folder = await chrome.bookmarks.create({
      parentId: parentFolder.id,
      title: name
    })
    
    console.log('Created Chrome folder:', folder)
    return folder
  } catch (error) {
    console.error('Error creating Chrome folder:', error)
    return null
  }
}

// Add bookmark to a specific folder
export async function addBookmarkToFolder(
  url: string,
  title: string,
  folderId: string
): Promise<void> {
  try {
    await chrome.bookmarks.create({
      parentId: folderId,
      title,
      url
    })
    console.log('Added bookmark to folder:', folderId)
  } catch (error) {
    console.error('Error adding bookmark to folder:', error)
  }
}