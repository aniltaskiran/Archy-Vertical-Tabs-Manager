import { useState, useRef, useCallback } from 'react'
import { Tab, Section } from '../types'

export interface DragItem {
  type: 'tab' | 'bookmark'
  item: Tab | any
  sectionId: string
  index: number
}

export interface DropZone {
  sectionId: string
  index?: number
}

interface UseDragAndDropProps {
  onItemMove: (dragItem: DragItem, dropZone: DropZone) => void
}

export function useDragAndDrop({ onItemMove }: UseDragAndDropProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [dragItem, setDragItem] = useState<DragItem | null>(null)
  const [dropZone, setDropZone] = useState<DropZone | null>(null)
  const dragRef = useRef<HTMLElement | null>(null)

  const handleDragStart = useCallback((e: DragEvent, item: DragItem) => {
    setIsDragging(true)
    setDragItem(item)
    dragRef.current = e.currentTarget as HTMLElement
    
    // Add visual feedback
    const element = e.currentTarget as HTMLElement
    element.classList.add('dragging')
    
    // Set drag data for browser compatibility
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move'
      e.dataTransfer.setData('text/plain', JSON.stringify(item))
    }
  }, [])

  const handleDragEnd = useCallback((e: DragEvent) => {
    const element = e.currentTarget as HTMLElement
    element.classList.remove('dragging')
    
    // Execute move if we have both drag item and valid drop zone
    if (dragItem && dropZone) {
      onItemMove(dragItem, dropZone)
    }
    
    setIsDragging(false)
    setDragItem(null)
    setDropZone(null)
    dragRef.current = null
  }, [dragItem, dropZone, onItemMove])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }, [])

  const handleDrop = useCallback((zone: DropZone) => {
    setDropZone(zone)
  }, [])

  const getDragProps = useCallback((item: DragItem) => ({
    draggable: true,
    onDragStart: (e: React.DragEvent<HTMLElement>) => {
      handleDragStart(e.nativeEvent, item)
    },
    onDragEnd: (e: React.DragEvent<HTMLElement>) => {
      handleDragEnd(e.nativeEvent)
    }
  }), [handleDragStart, handleDragEnd])

  const getDropProps = useCallback((zone: DropZone) => ({
    onDragOver: handleDragOver,
    onDrop: (e: React.DragEvent) => {
      e.preventDefault()
      handleDrop(zone)
    },
    className: dropZone?.sectionId === zone.sectionId ? 'drop-active' : ''
  }), [handleDragOver, handleDrop, dropZone])

  return {
    isDragging,
    dragItem,
    getDragProps,
    getDropProps
  }
}