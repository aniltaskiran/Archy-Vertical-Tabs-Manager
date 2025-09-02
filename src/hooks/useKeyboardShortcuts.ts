import { useEffect } from 'react'

interface KeyboardShortcutsProps {
  onSearch: () => void
  onNewTab: () => void
  onCloseCurrentTab: () => void
  onNextTab: () => void
  onPreviousTab: () => void
  onFocusSearch: () => void
}

export function useKeyboardShortcuts({
  onSearch,
  onNewTab,
  onCloseCurrentTab,
  onNextTab,
  onPreviousTab,
  onFocusSearch
}: KeyboardShortcutsProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const { key, ctrlKey, metaKey, altKey, shiftKey } = event
      const isModifier = ctrlKey || metaKey

      // Prevent shortcuts when typing in input fields
      const activeElement = document.activeElement
      if (activeElement?.tagName === 'INPUT' || activeElement?.tagName === 'TEXTAREA') {
        // Allow Escape to blur input fields
        if (key === 'Escape') {
          ;(activeElement as HTMLElement).blur()
          event.preventDefault()
        }
        return
      }

      // Search shortcuts
      if (isModifier && key === 'f') {
        event.preventDefault()
        onFocusSearch()
        return
      }

      if (key === '/') {
        event.preventDefault()
        onSearch()
        return
      }

      // Tab management shortcuts
      if (isModifier && key === 't') {
        event.preventDefault()
        onNewTab()
        return
      }

      if (isModifier && key === 'w') {
        event.preventDefault()
        onCloseCurrentTab()
        return
      }

      // Tab navigation shortcuts
      if (isModifier && (key === 'Tab' || key === ']')) {
        event.preventDefault()
        if (shiftKey) {
          onPreviousTab()
        } else {
          onNextTab()
        }
        return
      }

      if (isModifier && key === '[') {
        event.preventDefault()
        onPreviousTab()
        return
      }

      // Number keys for quick tab switching (1-9)
      if (isModifier && /^[1-9]$/.test(key)) {
        event.preventDefault()
        const tabIndex = parseInt(key) - 1
        // Emit custom event for tab switching by index
        window.dispatchEvent(new CustomEvent('switchToTabByIndex', { detail: { index: tabIndex } }))
        return
      }

      // Escape to clear search or close context menus
      if (key === 'Escape') {
        event.preventDefault()
        window.dispatchEvent(new CustomEvent('clearSearchAndMenus'))
        return
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [onSearch, onNewTab, onCloseCurrentTab, onNextTab, onPreviousTab, onFocusSearch])
}