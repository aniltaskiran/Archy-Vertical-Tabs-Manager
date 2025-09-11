import { Plugin, PluginExecutionContext, XbarPlugin, XbarPluginOutput, XbarPluginLine, Tab, TabGroup, ChromeWindow, AppSettings } from '../types'

class PluginSystem {
  private installedPlugins: Map<string, Plugin> = new Map()
  private installedXbarPlugins: Map<string, XbarPlugin> = new Map()
  private enabledPlugins: Set<string> = new Set()
  private xbarPluginOutputs: Map<string, XbarPluginOutput> = new Map()
  private xbarIntervals: Map<string, number> = new Map()

  async loadInstalledPlugins(): Promise<void> {
    try {
      const result = await chrome.storage.local.get(['installedPlugins', 'installedXbarPlugins', 'enabledPlugins'])
      
      if (result.installedPlugins) {
        Object.entries(result.installedPlugins).forEach(([id, plugin]) => {
          this.installedPlugins.set(id, plugin as Plugin)
        })
      }

      if (result.installedXbarPlugins) {
        Object.entries(result.installedXbarPlugins).forEach(([id, plugin]) => {
          this.installedXbarPlugins.set(id, plugin as XbarPlugin)
        })
      }

      if (result.enabledPlugins) {
        this.enabledPlugins = new Set(result.enabledPlugins)
      }

      // Start xbar plugins
      await this.startXbarPlugins()
    } catch (error) {
      console.error('Failed to load installed plugins:', error)
    }
  }

  async saveInstalledPlugins(): Promise<void> {
    try {
      const pluginsObj = Object.fromEntries(this.installedPlugins)
      const xbarPluginsObj = Object.fromEntries(this.installedXbarPlugins)
      await chrome.storage.local.set({
        installedPlugins: pluginsObj,
        installedXbarPlugins: xbarPluginsObj,
        enabledPlugins: Array.from(this.enabledPlugins)
      })
    } catch (error) {
      console.error('Failed to save installed plugins:', error)
    }
  }

  async installPlugin(plugin: Plugin): Promise<boolean> {
    try {
      // Basic security check - in a real implementation, you'd want more robust security
      if (this.isPluginCodeSafe(plugin.code)) {
        this.installedPlugins.set(plugin.id, plugin)
        await this.saveInstalledPlugins()
        return true
      }
      return false
    } catch (error) {
      console.error('Failed to install plugin:', error)
      return false
    }
  }

  async uninstallPlugin(pluginId: string): Promise<boolean> {
    try {
      // Check if it's an xbar plugin first
      if (this.installedXbarPlugins.has(pluginId)) {
        return await this.uninstallXbarPlugin(pluginId)
      }

      // Otherwise, handle as regular plugin
      this.installedPlugins.delete(pluginId)
      this.enabledPlugins.delete(pluginId)
      await this.saveInstalledPlugins()
      return true
    } catch (error) {
      console.error('Failed to uninstall plugin:', error)
      return false
    }
  }

  async enablePlugin(pluginId: string): Promise<boolean> {
    try {
      if (this.installedPlugins.has(pluginId)) {
        this.enabledPlugins.add(pluginId)
        await this.saveInstalledPlugins()
        return true
      }
      return false
    } catch (error) {
      console.error('Failed to enable plugin:', error)
      return false
    }
  }

  async disablePlugin(pluginId: string): Promise<boolean> {
    try {
      this.enabledPlugins.delete(pluginId)
      await this.saveInstalledPlugins()
      return true
    } catch (error) {
      console.error('Failed to disable plugin:', error)
      return false
    }
  }

  async executePlugin(
    pluginId: string,
    context: PluginExecutionContext,
    action?: string
  ): Promise<any> {
    try {
      const plugin = this.installedPlugins.get(pluginId)
      
      if (!plugin) {
        throw new Error(`Plugin ${pluginId} not found`)
      }

      if (!this.enabledPlugins.has(pluginId)) {
        throw new Error(`Plugin ${pluginId} is not enabled`)
      }

      // Create a safe execution environment
      const safeContext = this.createSafeContext(context)
      
      // Execute the plugin code
      const pluginFunction = new Function('context', plugin.code)
      const pluginInstance = pluginFunction(safeContext)

      if (action && pluginInstance.actions && pluginInstance.actions[action]) {
        return await pluginInstance.actions[action]()
      }

      return pluginInstance
    } catch (error) {
      console.error(`Failed to execute plugin ${pluginId}:`, error)
      throw error
    }
  }

  async executeAllEnabledPlugins(
    context: PluginExecutionContext,
    trigger: 'startup' | 'tab-change' | 'manual' = 'manual'
  ): Promise<Map<string, any>> {
    const results = new Map<string, any>()

    for (const pluginId of this.enabledPlugins) {
      try {
        const result = await this.executePlugin(pluginId, context)
        results.set(pluginId, result)
      } catch (error) {
        console.error(`Plugin ${pluginId} execution failed:`, error)
        results.set(pluginId, { error: error.message })
      }
    }

    return results
  }

  getInstalledPlugins(): Plugin[] {
    return Array.from(this.installedPlugins.values())
  }

  getEnabledPlugins(): string[] {
    return Array.from(this.enabledPlugins)
  }

  isPluginEnabled(pluginId: string): boolean {
    return this.enabledPlugins.has(pluginId)
  }

  private isPluginCodeSafe(code: string): boolean {
    // Basic security checks - in a real implementation, you'd want more comprehensive security
    const dangerousPatterns = [
      /eval\s*\(/,
      /Function\s*\(/,
      /setTimeout\s*\(/,
      /setInterval\s*\(/,
      /document\./,
      /window\./,
      /localStorage\./,
      /sessionStorage\./,
      /fetch\s*\(/,
      /XMLHttpRequest/,
      /import\s*\(/,
      /require\s*\(/
    ]

    return !dangerousPatterns.some(pattern => pattern.test(code))
  }

  private createSafeContext(context: PluginExecutionContext): PluginExecutionContext {
    // Create a safe context that limits what plugins can access
    return {
      tabs: [...context.tabs], // Clone to prevent modifications
      groups: [...context.groups],
      windows: [...context.windows],
      settings: { ...context.settings },
      chrome: {
        // Only expose safe chrome APIs
        tabs: {
          query: context.chrome.tabs.query.bind(context.chrome.tabs),
          create: context.chrome.tabs.create.bind(context.chrome.tabs),
          update: context.chrome.tabs.update.bind(context.chrome.tabs),
          remove: context.chrome.tabs.remove.bind(context.chrome.tabs),
          group: context.chrome.tabs.group.bind(context.chrome.tabs),
          ungroup: context.chrome.tabs.ungroup.bind(context.chrome.tabs),
          discard: context.chrome.tabs.discard.bind(context.chrome.tabs)
        },
        tabGroups: {
          update: context.chrome.tabGroups.update.bind(context.chrome.tabGroups),
          move: context.chrome.tabGroups.move.bind(context.chrome.tabGroups)
        }
      } as any
    }
  }

  // Xbar plugin methods
  async installXbarPlugin(plugin: XbarPlugin): Promise<boolean> {
    try {
      if (this.isXbarPluginScriptSafe(plugin.script)) {
        this.installedXbarPlugins.set(plugin.id, plugin)
        await this.saveInstalledPlugins()
        return true
      }
      return false
    } catch (error) {
      console.error('Failed to install xbar plugin:', error)
      return false
    }
  }

  async executeXbarPlugin(pluginId: string): Promise<XbarPluginOutput | null> {
    try {
      const plugin = this.installedXbarPlugins.get(pluginId)
      if (!plugin || !this.enabledPlugins.has(pluginId)) {
        return null
      }

      // Execute the script in a safe environment
      const output = await this.runXbarScript(plugin.script)
      const parsedOutput = this.parseXbarOutput(output)
      
      this.xbarPluginOutputs.set(pluginId, parsedOutput)
      return parsedOutput
    } catch (error) {
      console.error(`Failed to execute xbar plugin ${pluginId}:`, error)
      return null
    }
  }

  private async startXbarPlugins(): Promise<void> {
    for (const [pluginId, plugin] of this.installedXbarPlugins) {
      if (this.enabledPlugins.has(pluginId)) {
        await this.executeXbarPlugin(pluginId)
        
        // Set up interval for periodic execution
        const intervalId = setInterval(async () => {
          await this.executeXbarPlugin(pluginId)
        }, plugin.refreshInterval)
        
        this.xbarIntervals.set(pluginId, intervalId as any)
      }
    }
  }

  private async runXbarScript(script: string): Promise<string> {
    // Create a sandboxed environment for running xbar scripts
    // This is a simplified version - in production you'd want more security
    try {
      // Create context with browser tabs data
      const tabs = await chrome.tabs.query({})
      const tabsData = tabs.map(tab => ({
        id: tab.id,
        title: tab.title,
        url: tab.url,
        active: tab.active,
        pinned: tab.pinned
      }))

      const context = {
        tabs: tabsData,
        console: {
          log: (...args: any[]) => console.log('[xbar plugin]', ...args)
        },
        Date,
        JSON,
        Math,
        parseInt,
        parseFloat,
        String,
        Number,
        Array,
        Object
      }

      // Execute script with limited context
      const func = new Function('context', `
        const { tabs, console, Date, JSON, Math } = context;
        ${script}
      `)
      
      const result = func(context)
      return typeof result === 'string' ? result : JSON.stringify(result)
    } catch (error) {
      console.error('Error running xbar script:', error)
      return 'Error executing plugin'
    }
  }

  private parseXbarOutput(output: string): XbarPluginOutput {
    const lines = output.split('\n').filter(line => line.trim())
    const parsedLines: XbarPluginLine[] = []
    let inDropdown = false

    for (const line of lines) {
      if (line.trim() === '---') {
        inDropdown = true
        continue
      }

      const level = (line.match(/^-+/)?.[0]?.length || 0) - (inDropdown ? 0 : 0)
      const text = line.replace(/^-+\s*/, '')
      
      // Parse xbar parameters (simplified)
      const [displayText, ...params] = text.split('|')
      const lineObj: XbarPluginLine = {
        text: displayText.trim(),
        dropdown: inDropdown,
        submenu: level > 0,
        level
      }

      // Parse basic parameters
      params.forEach(param => {
        const [key, value] = param.split('=').map(s => s.trim())
        if (key === 'href') lineObj.href = value
        if (key === 'color') lineObj.color = value
        if (key === 'font') lineObj.font = value
        if (key === 'size') lineObj.size = parseInt(value)
      })

      parsedLines.push(lineObj)
    }

    return {
      text: lines[0] || '',
      lines: parsedLines,
      lastUpdated: Date.now()
    }
  }

  private isXbarPluginScriptSafe(script: string): boolean {
    // Basic security checks for xbar scripts
    const dangerousPatterns = [
      /eval\s*\(/,
      /Function\s*\(/,
      /setTimeout\s*\(/,
      /setInterval\s*\(/,
      /fetch\s*\(/,
      /XMLHttpRequest/,
      /import\s*\(/,
      /require\s*\(/,
      /process\./,
      /global\./,
      /window\./,
      /document\./
    ]

    return !dangerousPatterns.some(pattern => pattern.test(script))
  }

  getXbarPluginOutput(pluginId: string): XbarPluginOutput | null {
    return this.xbarPluginOutputs.get(pluginId) || null
  }

  getInstalledXbarPlugins(): XbarPlugin[] {
    return Array.from(this.installedXbarPlugins.values())
  }

  async uninstallXbarPlugin(pluginId: string): Promise<boolean> {
    try {
      // Stop interval
      const intervalId = this.xbarIntervals.get(pluginId)
      if (intervalId) {
        clearInterval(intervalId)
        this.xbarIntervals.delete(pluginId)
      }

      // Remove from maps
      this.installedXbarPlugins.delete(pluginId)
      this.xbarPluginOutputs.delete(pluginId)
      this.enabledPlugins.delete(pluginId)
      
      await this.saveInstalledPlugins()
      return true
    } catch (error) {
      console.error('Failed to uninstall xbar plugin:', error)
      return false
    }
  }
}

export const pluginSystem = new PluginSystem()

// Plugin execution helper functions
export async function executePluginAction(
  pluginId: string,
  action: string,
  tabs: Tab[],
  groups: TabGroup[],
  windows: ChromeWindow[],
  settings: AppSettings
): Promise<any> {
  const context: PluginExecutionContext = {
    tabs,
    groups,
    windows,
    settings,
    chrome
  }

  return await pluginSystem.executePlugin(pluginId, context, action)
}

export async function initializePluginSystem(): Promise<void> {
  await pluginSystem.loadInstalledPlugins()
}

export async function togglePlugin(pluginId: string, enabled: boolean): Promise<boolean> {
  if (enabled) {
    return await pluginSystem.enablePlugin(pluginId)
  } else {
    return await pluginSystem.disablePlugin(pluginId)
  }
}

export async function installPluginFromMarketplace(plugin: Plugin): Promise<boolean> {
  const success = await pluginSystem.installPlugin(plugin)
  if (success) {
    await pluginSystem.enablePlugin(plugin.id)
  }
  return success
}

export async function uninstallPlugin(pluginId: string): Promise<boolean> {
  return await pluginSystem.uninstallPlugin(pluginId)
}

// Xbar plugin functions
export async function installXbarPlugin(plugin: XbarPlugin): Promise<boolean> {
  return await pluginSystem.installXbarPlugin(plugin)
}

export async function getXbarPluginOutput(pluginId: string): Promise<XbarPluginOutput | null> {
  return pluginSystem.getXbarPluginOutput(pluginId)
}

export async function executeXbarPlugin(pluginId: string): Promise<XbarPluginOutput | null> {
  return await pluginSystem.executeXbarPlugin(pluginId)
}

export function getInstalledXbarPlugins(): XbarPlugin[] {
  return pluginSystem.getInstalledXbarPlugins()
}