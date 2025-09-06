import React, { useEffect, useState } from 'react'
import { 
  Layers, 
  Command, 
  Folder, 
  Search, 
  Archive, 
  Star, 
  MousePointer,
  Keyboard,
  Sparkles,
  ChevronRight,
  Check,
  ExternalLink
} from 'lucide-react'

interface VersionInfo {
  version: string
  previousVersion?: string
  isNewInstall: boolean
}

export default function WelcomeApp() {
  const [versionInfo, setVersionInfo] = useState<VersionInfo>({
    version: chrome.runtime.getManifest().version,
    isNewInstall: true
  })
  const [activeSection, setActiveSection] = useState('features')

  useEffect(() => {
    // Check if this is a new install or update
    chrome.storage.local.get(['previousVersion'], (result) => {
      const currentVersion = chrome.runtime.getManifest().version
      const previousVersion = result.previousVersion
      
      setVersionInfo({
        version: currentVersion,
        previousVersion: previousVersion,
        isNewInstall: !previousVersion
      })
      
      // Save current version
      chrome.storage.local.set({ previousVersion: currentVersion })
    })
  }, [])

  const features = [
    {
      icon: <Layers className="w-6 h-6" />,
      title: 'Vertical Tabs',
      description: 'Organize your tabs in a vertical sidebar for better visibility and management'
    },
    {
      icon: <Folder className="w-6 h-6" />,
      title: 'Smart Folders',
      description: 'Create folders to group related bookmarks and tabs together'
    },
    {
      icon: <Search className="w-6 h-6" />,
      title: 'Quick Search',
      description: 'Find any tab or bookmark instantly with powerful search'
    },
    {
      icon: <Archive className="w-6 h-6" />,
      title: 'Tab Archive',
      description: 'Archive tabs for later without keeping them open'
    },
    {
      icon: <Star className="w-6 h-6" />,
      title: 'Favorites',
      description: 'Keep your most important tabs and bookmarks easily accessible'
    },
    {
      icon: <Command className="w-6 h-6" />,
      title: 'Overlay Mode',
      description: 'Press Cmd+T to open tabs in a beautiful overlay interface'
    }
  ]

  const shortcuts = [
    { keys: ['⌘', 'S'], action: 'Activate Archy' },
    { keys: ['⌘', 'T'], action: 'Open overlay (New Tab)' },
    { keys: ['⌘', '⇧', 'E'], action: 'Open Archy in new tab' },
    { keys: ['⌘', '⇧', 'L'], action: 'Toggle debug console' }
  ]

  const whatsNew = [
    {
      version: '0.3.0',
      date: 'December 2024',
      changes: [
        'Added interactive welcome page with changelog',
        'Fixed drag and drop into newly created folders',
        'Updated keyboard shortcuts: Cmd+S for activation, Cmd+T for overlay',
        'Smart build detection for development workflow',
        'Settings menu integration for easy access'
      ]
    },
    {
      version: '0.2.2',
      date: 'November 2024',
      changes: [
        'Fixed bookmark auto-open issue',
        'Improved extension activation behavior',
        'Enhanced keyboard navigation'
      ]
    },
    {
      version: '0.2.1',
      date: 'November 2024',
      changes: [
        'Added overlay mode for quick tab switching',
        'Cmd+T now opens Archy overlay',
        'Better visual feedback for drag operations'
      ]
    },
    {
      version: '0.2.0',
      date: 'October 2024',
      changes: [
        'Introduced smart folders',
        'Added tab archiving',
        'Improved search functionality'
      ]
    }
  ]

  return (
    <div className="welcome-container">
      <div className="welcome-sidebar">
        <div className="welcome-logo">
          <img src="/icons/icon-128.png" alt="Archy" className="w-16 h-16" />
          <h1 className="text-2xl font-bold text-white mt-3">Archy</h1>
          <p className="text-sm text-gray-400 mt-1">v{versionInfo.version}</p>
        </div>
        
        <nav className="welcome-nav">
          <button
            className={`nav-item ${activeSection === 'features' ? 'active' : ''}`}
            onClick={() => setActiveSection('features')}
          >
            <Sparkles className="w-4 h-4" />
            <span>Features</span>
          </button>
          <button
            className={`nav-item ${activeSection === 'shortcuts' ? 'active' : ''}`}
            onClick={() => setActiveSection('shortcuts')}
          >
            <Keyboard className="w-4 h-4" />
            <span>Shortcuts</span>
          </button>
          <button
            className={`nav-item ${activeSection === 'whats-new' ? 'active' : ''}`}
            onClick={() => setActiveSection('whats-new')}
          >
            <Star className="w-4 h-4" />
            <span>What's New</span>
          </button>
          <button
            className={`nav-item ${activeSection === 'getting-started' ? 'active' : ''}`}
            onClick={() => setActiveSection('getting-started')}
          >
            <MousePointer className="w-4 h-4" />
            <span>Getting Started</span>
          </button>
        </nav>

        <div className="welcome-footer">
          <a 
            href="https://github.com/yourusername/archy" 
            target="_blank" 
            rel="noopener noreferrer"
            className="footer-link"
          >
            <ExternalLink className="w-4 h-4" />
            <span>GitHub</span>
          </a>
        </div>
      </div>

      <div className="welcome-content">
        {versionInfo.isNewInstall ? (
          <div className="welcome-header">
            <h2 className="text-4xl font-bold text-white mb-2">
              Welcome to Archy! 🎉
            </h2>
            <p className="text-lg text-gray-400">
              Your new favorite way to manage tabs and bookmarks
            </p>
          </div>
        ) : (
          <div className="welcome-header">
            <h2 className="text-4xl font-bold text-white mb-2">
              Archy Updated! ✨
            </h2>
            <p className="text-lg text-gray-400">
              Version {versionInfo.version} is now installed
            </p>
          </div>
        )}

        {activeSection === 'features' && (
          <div className="section-content">
            <h3 className="section-title">Features</h3>
            <div className="features-grid">
              {features.map((feature, index) => (
                <div key={index} className="feature-card">
                  <div className="feature-icon">{feature.icon}</div>
                  <h4 className="feature-title">{feature.title}</h4>
                  <p className="feature-description">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeSection === 'shortcuts' && (
          <div className="section-content">
            <h3 className="section-title">Keyboard Shortcuts</h3>
            <div className="shortcuts-list">
              {shortcuts.map((shortcut, index) => (
                <div key={index} className="shortcut-item">
                  <div className="shortcut-keys">
                    {shortcut.keys.map((key, i) => (
                      <React.Fragment key={i}>
                        <kbd className="key">{key}</kbd>
                        {i < shortcut.keys.length - 1 && <span className="plus">+</span>}
                      </React.Fragment>
                    ))}
                  </div>
                  <span className="shortcut-action">{shortcut.action}</span>
                </div>
              ))}
            </div>
            <div className="tip-box">
              <p className="tip-title">💡 Pro Tip</p>
              <p className="tip-text">
                You can customize keyboard shortcuts in Chrome's extension settings.
                Go to chrome://extensions/shortcuts to modify them.
              </p>
            </div>
          </div>
        )}

        {activeSection === 'whats-new' && (
          <div className="section-content">
            <h3 className="section-title">What's New</h3>
            <div className="changelog">
              {whatsNew.map((release, index) => (
                <div key={index} className="release-item">
                  <div className="release-header">
                    <span className="release-version">v{release.version}</span>
                    <span className="release-date">{release.date}</span>
                  </div>
                  <ul className="release-changes">
                    {release.changes.map((change, i) => (
                      <li key={i} className="change-item">
                        <Check className="w-4 h-4 text-green-400" />
                        <span>{change}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeSection === 'getting-started' && (
          <div className="section-content">
            <h3 className="section-title">Getting Started</h3>
            <div className="steps-list">
              <div className="step-item">
                <div className="step-number">1</div>
                <div className="step-content">
                  <h4 className="step-title">Open the Sidebar</h4>
                  <p className="step-description">
                    Click the Archy icon in your toolbar or press <kbd>⌘</kbd> + <kbd>S</kbd> to activate Archy
                  </p>
                </div>
              </div>
              <div className="step-item">
                <div className="step-number">2</div>
                <div className="step-content">
                  <h4 className="step-title">Organize with Folders</h4>
                  <p className="step-description">
                    Create folders in the Favorites section to group related tabs and bookmarks
                  </p>
                </div>
              </div>
              <div className="step-item">
                <div className="step-number">3</div>
                <div className="step-content">
                  <h4 className="step-title">Use Drag & Drop</h4>
                  <p className="step-description">
                    Drag tabs and bookmarks into folders or reorder them as needed
                  </p>
                </div>
              </div>
              <div className="step-item">
                <div className="step-number">4</div>
                <div className="step-content">
                  <h4 className="step-title">Try the Overlay</h4>
                  <p className="step-description">
                    Press <kbd>⌘</kbd> + <kbd>T</kbd> to open the quick tab switcher overlay
                  </p>
                </div>
              </div>
            </div>
            
            <div className="cta-section">
              <button 
                className="cta-button"
                onClick={() => {
                  chrome.runtime.sendMessage({ type: 'OPEN_SIDEBAR' })
                  window.close()
                }}
              >
                Open Archy Sidebar
                <ChevronRight className="w-5 h-5 ml-2" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}