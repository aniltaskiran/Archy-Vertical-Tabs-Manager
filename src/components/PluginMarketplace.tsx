import React, { useState, useEffect } from 'react'
import { Plugin, XbarPlugin } from '../types'
import { Download, Star, Shield, Code, Filter, Search, Clock, Zap } from 'lucide-react'

interface PluginMarketplaceProps {
  enabledPlugins: string[]
  onPluginToggle: (pluginId: string, enabled: boolean) => void
  onClose: () => void
}

const SAMPLE_XBAR_PLUGINS: XbarPlugin[] = [
  {
    id: 'tab-counter-xbar',
    name: 'Tab Counter (xbar)',
    version: '1.0.0',
    description: 'Shows current tab count in menu bar style',
    author: 'TabUtils',
    icon: '🔢',
    script: `
// Tab Counter xbar Plugin
const activeTabCount = tabs.filter(tab => !tab.pinned).length;
const pinnedTabCount = tabs.filter(tab => tab.pinned).length;

console.log('Tabs: ' + activeTabCount);
console.log('---');
console.log('Active Tabs: ' + activeTabCount);
console.log('Pinned Tabs: ' + pinnedTabCount);
console.log('Total: ' + tabs.length);

return 'Tabs: ' + activeTabCount;
    `,
    refreshInterval: 5000, // 5 seconds
    permissions: ['tabs'],
    category: 'utility',
    lastUpdated: '2024-01-15',
    outputFormat: 'text'
  },
  {
    id: 'domain-counter-xbar',
    name: 'Domain Counter (xbar)',
    version: '1.1.0', 
    description: 'Shows count of tabs grouped by domain in xbar format',
    author: 'DomainTracker',
    icon: '🌐',
    script: `
// Domain Counter xbar Plugin
const domains = {};
tabs.forEach(tab => {
  try {
    const url = new URL(tab.url);
    const domain = url.hostname;
    domains[domain] = (domains[domain] || 0) + 1;
  } catch (e) {
    domains['other'] = (domains['other'] || 0) + 1;
  }
});

const totalDomains = Object.keys(domains).length;
console.log('Domains: ' + totalDomains);
console.log('---');

// Sort domains by tab count
const sortedDomains = Object.entries(domains)
  .sort(([,a], [,b]) => b - a)
  .slice(0, 10); // Show top 10

sortedDomains.forEach(([domain, count]) => {
  console.log(domain + ': ' + count);
});

return 'Domains: ' + totalDomains;
    `,
    refreshInterval: 10000, // 10 seconds
    permissions: ['tabs'],
    category: 'productivity',
    lastUpdated: '2024-01-12',
    outputFormat: 'text'
  },
  {
    id: 'memory-monitor-xbar',
    name: 'Memory Monitor (xbar)',
    version: '1.2.0',
    description: 'Monitor browser memory usage through tab analysis',
    author: 'PerformanceTools',
    icon: '🧠',
    script: `
// Memory Monitor xbar Plugin
const totalTabs = tabs.length;
const activeTabs = tabs.filter(tab => tab.active).length;
const pinnedTabs = tabs.filter(tab => tab.pinned).length;
const suspendableTabs = tabs.filter(tab => !tab.active && !tab.pinned).length;

// Estimate memory usage (rough calculation)
const estimatedMemory = totalTabs * 50; // ~50MB per tab estimation

console.log('Mem: ' + estimatedMemory + 'MB');
console.log('---');
console.log('Total Tabs: ' + totalTabs);
console.log('Active: ' + activeTabs);
console.log('Pinned: ' + pinnedTabs);
console.log('Suspendable: ' + suspendableTabs);
console.log('---');
console.log('Est. Memory: ' + estimatedMemory + 'MB');
console.log('Avg per tab: 50MB');

if (suspendableTabs > 5) {
  console.log('---');
  console.log('⚠️ Consider suspending ' + suspendableTabs + ' tabs');
}

return 'Mem: ' + estimatedMemory + 'MB';
    `,
    refreshInterval: 15000, // 15 seconds
    permissions: ['tabs'],
    category: 'utility',
    lastUpdated: '2024-01-10',
    outputFormat: 'text'
  }
];

const SAMPLE_PLUGINS: Plugin[] = [
  {
    id: 'tab-organizer-pro',
    name: 'Tab Organizer Pro',
    version: '1.2.0',
    description: 'Advanced tab organization with AI-powered grouping and smart categorization',
    author: 'TabMaster',
    icon: '🗂️',
    code: `
// Tab Organizer Pro Plugin
(function(context) {
  const { tabs, groups, chrome } = context;
  
  // Group tabs by domain
  function groupTabsByDomain() {
    const domains = {};
    tabs.forEach(tab => {
      try {
        const domain = new URL(tab.url).hostname;
        if (!domains[domain]) {
          domains[domain] = [];
        }
        domains[domain].push(tab);
      } catch (e) {
        console.log('Invalid URL:', tab.url);
      }
    });
    
    // Create groups for domains with multiple tabs
    Object.entries(domains).forEach(([domain, domainTabs]) => {
      if (domainTabs.length > 1) {
        chrome.tabs.group({ 
          tabIds: domainTabs.map(tab => tab.id) 
        }, (groupId) => {
          chrome.tabGroups.update(groupId, {
            title: domain,
            color: 'blue'
          });
        });
      }
    });
  }
  
  return {
    name: 'Tab Organizer Pro',
    actions: {
      groupByDomain: groupTabsByDomain
    }
  };
})
    `,
    permissions: ['tabs', 'tabGroups'],
    category: 'productivity',
    rating: 4.8,
    downloads: 15420,
    lastUpdated: '2024-01-15'
  },
  {
    id: 'duplicate-tab-finder',
    name: 'Duplicate Tab Finder',
    version: '1.0.5',
    description: 'Find and close duplicate tabs automatically to save memory',
    author: 'EfficiencyTools',
    icon: '🔍',
    code: `
// Duplicate Tab Finder Plugin
(function(context) {
  const { tabs, chrome } = context;
  
  function findDuplicates() {
    const urlMap = new Map();
    const duplicates = [];
    
    tabs.forEach(tab => {
      if (urlMap.has(tab.url)) {
        duplicates.push(tab.id);
      } else {
        urlMap.set(tab.url, tab.id);
      }
    });
    
    if (duplicates.length > 0) {
      chrome.tabs.remove(duplicates);
      console.log('Removed', duplicates.length, 'duplicate tabs');
    }
  }
  
  return {
    name: 'Duplicate Tab Finder',
    actions: {
      removeDuplicates: findDuplicates
    }
  };
})
    `,
    permissions: ['tabs'],
    category: 'utility',
    rating: 4.5,
    downloads: 8920,
    lastUpdated: '2024-01-10'
  },
  {
    id: 'tab-suspender',
    name: 'Smart Tab Suspender',
    version: '2.1.0',
    description: 'Automatically suspend inactive tabs to save memory and improve performance',
    author: 'MemoryOptimizer',
    icon: '💤',
    code: `
// Smart Tab Suspender Plugin
(function(context) {
  const { tabs, chrome } = context;
  
  function suspendInactiveTabs(timeThreshold = 30 * 60 * 1000) { // 30 minutes
    const now = Date.now();
    
    tabs.forEach(tab => {
      if (!tab.active && !tab.pinned) {
        // In a real implementation, you'd track last access time
        // For demo, we'll suspend non-active tabs
        chrome.tabs.discard(tab.id);
      }
    });
  }
  
  return {
    name: 'Smart Tab Suspender',
    actions: {
      suspendInactive: suspendInactiveTabs
    }
  };
})
    `,
    permissions: ['tabs'],
    category: 'utility',
    rating: 4.7,
    downloads: 12350,
    lastUpdated: '2024-01-12'
  }
]

export default function PluginMarketplace({ enabledPlugins, onPluginToggle, onClose }: PluginMarketplaceProps) {
  const [plugins, setPlugins] = useState<Plugin[]>(SAMPLE_PLUGINS)
  const [xbarPlugins, setXbarPlugins] = useState<XbarPlugin[]>(SAMPLE_XBAR_PLUGINS)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [pluginType, setPluginType] = useState<'all' | 'regular' | 'xbar'>('all')
  const [selectedPlugin, setSelectedPlugin] = useState<Plugin | XbarPlugin | null>(null)

  const categories = [
    { id: 'all', name: 'All Categories' },
    { id: 'productivity', name: 'Productivity' },
    { id: 'tabs', name: 'Tab Management' },
    { id: 'ui', name: 'UI Enhancement' },
    { id: 'utility', name: 'Utilities' },
    { id: 'experimental', name: 'Experimental' }
  ]

  const pluginTypes = [
    { id: 'all', name: 'All Plugins' },
    { id: 'regular', name: 'Extension Plugins' },
    { id: 'xbar', name: 'xbar Plugins' }
  ]

  // Combine all plugins for filtering
  const allPlugins = [
    ...plugins.map(p => ({ ...p, type: 'regular' as const })),
    ...xbarPlugins.map(p => ({ ...p, type: 'xbar' as const }))
  ]

  const filteredPlugins = allPlugins.filter(plugin => {
    const matchesSearch = plugin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         plugin.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || plugin.category === selectedCategory
    const matchesType = pluginType === 'all' || plugin.type === pluginType
    return matchesSearch && matchesCategory && matchesType
  })

  const isPluginEnabled = (pluginId: string) => enabledPlugins.includes(pluginId)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-gray-800 rounded-lg w-full max-w-6xl h-5/6 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">Plugin Marketplace</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-2 hover:bg-gray-700 rounded"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-1/4 border-r border-gray-700 p-4">
            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search plugins..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Plugin Types */}
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Plugin Type
              </h3>
              {pluginTypes.map(type => (
                <button
                  key={type.id}
                  onClick={() => setPluginType(type.id as any)}
                  className={`w-full text-left px-3 py-2 rounded text-sm transition-colors mb-1 ${
                    pluginType === type.id
                      ? 'bg-purple-600 text-white'
                      : 'text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  {type.name}
                </button>
              ))}
            </div>

            {/* Categories */}
            <div>
              <h3 className="text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Categories
              </h3>
              {categories.map(category => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                    selectedCategory === category.id
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex">
            {/* Plugin List */}
            <div className="w-1/2 p-4 overflow-y-auto">
              <div className="space-y-4">
                {filteredPlugins.map(plugin => (
                  <div
                    key={plugin.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      selectedPlugin?.id === plugin.id
                        ? 'border-blue-500 bg-blue-900/20'
                        : 'border-gray-600 hover:border-gray-500 bg-gray-750'
                    }`}
                    onClick={() => setSelectedPlugin(plugin)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">{plugin.icon}</div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-white">{plugin.name}</h3>
                            {plugin.type === 'xbar' && (
                              <span className="px-2 py-0.5 bg-purple-600 text-white text-xs rounded">
                                xbar
                              </span>
                            )}
                          </div>
                          {plugin.type === 'regular' ? (
                            <div className="flex items-center gap-1 text-yellow-400">
                              <Star className="w-3 h-3 fill-current" />
                              <span className="text-xs">{(plugin as any).rating}</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-purple-400">
                              <Clock className="w-3 h-3" />
                              <span className="text-xs">{(plugin as any).refreshInterval / 1000}s</span>
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-gray-400 mb-2">{plugin.description}</p>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>by {plugin.author}</span>
                          {plugin.type === 'regular' ? (
                            <span>{(plugin as any).downloads.toLocaleString()} downloads</span>
                          ) : (
                            <span>Refresh: {(plugin as any).refreshInterval / 1000}s</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Plugin Details */}
            <div className="w-1/2 border-l border-gray-700 p-4 overflow-y-auto">
              {selectedPlugin ? (
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="text-3xl">{selectedPlugin.icon}</div>
                    <div>
                      <h2 className="text-xl font-bold text-white">{selectedPlugin.name}</h2>
                      <p className="text-sm text-gray-400">v{selectedPlugin.version} by {selectedPlugin.author}</p>
                    </div>
                  </div>

                  <p className="text-gray-300 mb-4">{selectedPlugin.description}</p>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    {(selectedPlugin as any).type === 'regular' ? (
                      <>
                        <div className="bg-gray-700 rounded-lg p-3">
                          <div className="flex items-center gap-2 text-yellow-400 mb-1">
                            <Star className="w-4 h-4 fill-current" />
                            <span className="font-medium">{(selectedPlugin as any).rating}</span>
                          </div>
                          <p className="text-xs text-gray-400">Rating</p>
                        </div>
                        <div className="bg-gray-700 rounded-lg p-3">
                          <div className="flex items-center gap-2 text-blue-400 mb-1">
                            <Download className="w-4 h-4" />
                            <span className="font-medium">{(selectedPlugin as any).downloads.toLocaleString()}</span>
                          </div>
                          <p className="text-xs text-gray-400">Downloads</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="bg-gray-700 rounded-lg p-3">
                          <div className="flex items-center gap-2 text-purple-400 mb-1">
                            <Clock className="w-4 h-4" />
                            <span className="font-medium">{(selectedPlugin as any).refreshInterval / 1000}s</span>
                          </div>
                          <p className="text-xs text-gray-400">Refresh Rate</p>
                        </div>
                        <div className="bg-gray-700 rounded-lg p-3">
                          <div className="flex items-center gap-2 text-green-400 mb-1">
                            <Zap className="w-4 h-4" />
                            <span className="font-medium">{(selectedPlugin as any).outputFormat}</span>
                          </div>
                          <p className="text-xs text-gray-400">Output Format</p>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      Permissions
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedPlugin.permissions.map(permission => (
                        <span
                          key={permission}
                          className="px-2 py-1 bg-gray-700 rounded text-xs text-gray-300"
                        >
                          {permission}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                      <Code className="w-4 h-4" />
                      {(selectedPlugin as any).type === 'xbar' ? 'Script Preview' : 'Plugin Code Preview'}
                    </h3>
                    <pre className="bg-gray-900 rounded p-3 text-xs text-gray-300 overflow-x-auto max-h-48 overflow-y-auto">
                      {((selectedPlugin as any).type === 'xbar' 
                        ? (selectedPlugin as any).script 
                        : (selectedPlugin as any).code
                      ).trim()}
                    </pre>
                  </div>

                  <button
                    onClick={() => onPluginToggle(selectedPlugin.id, !isPluginEnabled(selectedPlugin.id))}
                    className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                      isPluginEnabled(selectedPlugin.id)
                        ? 'bg-red-600 hover:bg-red-700 text-white'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {isPluginEnabled(selectedPlugin.id) ? 'Remove Plugin' : 'Install Plugin'}
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  Select a plugin to view details
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}