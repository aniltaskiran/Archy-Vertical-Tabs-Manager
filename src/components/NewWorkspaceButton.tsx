import React, { useState } from 'react'
import { Plus, X } from 'lucide-react'

interface NewWorkspaceButtonProps {
  onCreateWorkspace: (name: string) => void
}

export default function NewWorkspaceButton({ onCreateWorkspace }: NewWorkspaceButtonProps) {
  const [isCreating, setIsCreating] = useState(false)
  const [workspaceName, setWorkspaceName] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (workspaceName.trim()) {
      onCreateWorkspace(workspaceName.trim())
      setWorkspaceName('')
      setIsCreating(false)
    }
  }

  const handleCancel = () => {
    setWorkspaceName('')
    setIsCreating(false)
  }

  if (isCreating) {
    return (
      <div className="new-workspace-form">
        <form onSubmit={handleSubmit} className="flex items-center gap-2 p-3">
          <input
            type="text"
            value={workspaceName}
            onChange={(e) => setWorkspaceName(e.target.value)}
            placeholder="Workspace name..."
            className="flex-1 px-2 py-1 text-sm bg-gray-800 border border-gray-600 rounded text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
            autoFocus
            maxLength={50}
          />
          <button
            type="submit"
            className="p-1 hover:bg-gray-700 rounded text-green-400 hover:text-green-300 transition-colors"
            title="Create workspace"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleCancel}
            className="p-1 hover:bg-gray-700 rounded text-red-400 hover:text-red-300 transition-colors"
            title="Cancel"
          >
            <X className="w-4 h-4" />
          </button>
        </form>
      </div>
    )
  }

  return (
    <button
      onClick={() => setIsCreating(true)}
      className="new-workspace-btn flex items-center gap-2 p-3 hover:bg-gray-800/50 transition-colors text-gray-400 hover:text-gray-200 border-t border-gray-800"
    >
      <Plus className="w-4 h-4" />
      <span className="text-sm">New Workspace</span>
    </button>
  )
}