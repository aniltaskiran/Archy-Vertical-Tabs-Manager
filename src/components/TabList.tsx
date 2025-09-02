import React from 'react'
import TabItem from './TabItem'
import { Tab } from '../types'

interface TabListProps {
  tabs: Tab[]
  onTabClick: (tab: Tab) => void
  onTabClose: (tab: Tab) => void
}

export default function TabList({ tabs, onTabClick, onTabClose }: TabListProps) {
  const pinnedTabs = tabs.filter(tab => tab.pinned)
  const regularTabs = tabs.filter(tab => !tab.pinned)

  return (
    <div className="p-2 space-y-1">
      {pinnedTabs.length > 0 && (
        <div className="mb-4">
          <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 px-2">
            Pinned Tabs
          </div>
          {pinnedTabs.map(tab => (
            <TabItem
              key={tab.id}
              tab={tab}
              onClick={() => onTabClick(tab)}
              onClose={() => onTabClose(tab)}
            />
          ))}
          <div className="border-b border-gray-200 dark:border-gray-700 my-3" />
        </div>
      )}

      {regularTabs.length > 0 && (
        <div>
          {regularTabs.map(tab => (
            <TabItem
              key={tab.id}
              tab={tab}
              onClick={() => onTabClick(tab)}
              onClose={() => onTabClose(tab)}
            />
          ))}
        </div>
      )}

      {tabs.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No tabs found
        </div>
      )}
    </div>
  )
}