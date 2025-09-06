import { useState } from 'react'
import { Tab, Bookmark, Folder } from '../types'

export interface DragData {
  type: 'tab' | 'bookmark' | 'folder'
  item: Tab | Bookmark | Folder
  sectionId: string
  index: number
}

interface UseSimpleDragDropProps {
  onMove: (dragData: DragData, targetSectionId: string, targetIndex?: number) => void
}

export function useSimpleDragDrop({ onMove }: UseSimpleDragDropProps) {
  const [dragData, setDragData] = useState<DragData | null>(null)
  const [dropIndicator, setDropIndicator] = useState<{
    sectionId: string
    index: number
  } | null>(null)

  const handleDragStart = (data: DragData) => {
    console.log('🎬 DRAG START - Hook level:', data)
    setDragData(data)
  }

  const handleDragEnd = () => {
    setDragData(null)
    setDropIndicator(null)
  }

  const handleDrop = (targetSectionId: string, targetIndex?: number) => {
    console.log('💧 DROP - Hook level')
    console.log('  Target section:', targetSectionId)
    console.log('  Target index:', targetIndex)
    console.log('  Drag data:', dragData)
    if (dragData) {
      console.log('  Calling onMove...')
      onMove(dragData, targetSectionId, targetIndex)
    } else {
      console.log('  ⚠️ No drag data available!')
    }
    setDragData(null)
    setDropIndicator(null)
  }

  const handleDragOver = (sectionId: string, index?: number) => {
    if (dragData && (dropIndicator?.sectionId !== sectionId || dropIndicator?.index !== index)) {
      setDropIndicator({ sectionId, index: index ?? -1 })
    }
  }

  const createDragHandlers = (data: DragData) => ({
    draggable: true,
    onDragStart: (e: React.DragEvent) => {
      console.log('🎯 onDragStart event triggered')
      console.log('  Data:', data)
      e.stopPropagation()
      handleDragStart(data)
      // Visual feedback
      const element = e.currentTarget as HTMLElement
      element.style.opacity = '0.5'
      element.classList.add('dragging')
      // Set drag data
      e.dataTransfer.setData('text/plain', JSON.stringify(data))
      e.dataTransfer.effectAllowed = 'move'
    },
    onDragEnd: (e: React.DragEvent) => {
      e.stopPropagation()
      // Remove visual feedback
      const element = e.currentTarget as HTMLElement
      element.style.opacity = ''
      element.classList.remove('dragging')
      handleDragEnd()
    }
  })

  const createDropHandlers = (sectionId: string, index?: number) => ({
    onDragOver: (e: React.DragEvent) => {
      e.preventDefault()
      e.dataTransfer.dropEffect = 'move'
      handleDragOver(sectionId, index)
    },
    onDrop: (e: React.DragEvent) => {
      console.log('📍 onDrop event triggered')
      console.log('  Section:', sectionId, 'Index:', index)
      e.preventDefault()
      e.stopPropagation()
      handleDrop(sectionId, index)
    }
  })

  const createItemDropHandlers = (sectionId: string, index: number) => ({
    onDragOver: (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      
      if (!dragData) return
      
      const rect = e.currentTarget.getBoundingClientRect()
      const midPoint = rect.top + rect.height / 2
      const isUpperHalf = e.clientY < midPoint
      
      let dropIndex = isUpperHalf ? index : index + 1
      
      // Don't show indicator if dropping on same position
      if (dragData.sectionId === sectionId && 
          (dropIndex === dragData.index || dropIndex === dragData.index + 1)) {
        setDropIndicator(null)
        return
      }
      
      handleDragOver(sectionId, dropIndex)
    },
    onDrop: (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      
      if (!dragData) return
      
      const rect = e.currentTarget.getBoundingClientRect()
      const midPoint = rect.top + rect.height / 2
      const isUpperHalf = e.clientY < midPoint
      
      let dropIndex = isUpperHalf ? index : index + 1
      
      handleDrop(sectionId, dropIndex)
    }
  })

  return {
    createDragHandlers,
    createDropHandlers,
    createItemDropHandlers,
    isDragging: !!dragData,
    dropIndicator
  }
}