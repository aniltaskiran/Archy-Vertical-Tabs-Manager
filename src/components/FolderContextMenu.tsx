import React, { useEffect, useRef } from 'react'
import { Edit3, Trash2, FolderPlus, Link } from 'lucide-react'
import { Folder } from '../types'

interface FolderContextMenuProps {
  folder: Folder
  position: { x: number; y: number }
  onClose: () => void
  onRename: (folder: Folder) => void
  onDelete: (folder: Folder) => void
  onCreateSubfolder: (folder: Folder) => void
}

export default function FolderContextMenu({
  folder,
  position,
  onClose,
  onRename,
  onDelete,
  onCreateSubfolder
}: FolderContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose])

  const handleRename = () => {
    onRename(folder)
    onClose()
  }

  const handleDelete = () => {
    onDelete(folder)
    onClose()
  }

  const handleCreateSubfolder = () => {
    onCreateSubfolder(folder)
    onClose()
  }

  return (
    <div
      ref={menuRef}
      className="fixed bg-gray-800 border border-gray-700 rounded-lg shadow-lg py-2 min-w-48 z-50"
      style={{
        left: position.x,
        top: position.y,
      }}
    >
      <button
        onClick={handleRename}
        className="w-full px-4 py-2 text-left hover:bg-gray-700 text-gray-200 flex items-center gap-2"
      >
        <Edit3 className="w-4 h-4" />
        Rename Folder
      </button>

      <button
        onClick={handleCreateSubfolder}
        className="w-full px-4 py-2 text-left hover:bg-gray-700 text-gray-200 flex items-center gap-2"
      >
        <FolderPlus className="w-4 h-4" />
        Create Subfolder
      </button>

      <hr className="border-gray-600 my-1" />

      <button
        onClick={handleDelete}
        className="w-full px-4 py-2 text-left hover:bg-gray-700 text-red-400 flex items-center gap-2"
      >
        <Trash2 className="w-4 h-4" />
        Delete Folder
      </button>
    </div>
  )
}