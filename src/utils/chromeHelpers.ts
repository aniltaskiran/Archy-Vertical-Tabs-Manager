export const tabs = {
  getAll: () => chrome.tabs.query({}),
  
  getCurrent: () => chrome.tabs.query({ active: true, currentWindow: true }),
  
  getByGroup: (groupId: number) => chrome.tabs.query({ groupId }),
  
  create: (url: string, options?: Partial<chrome.tabs.CreateProperties>) => 
    chrome.tabs.create({ url, ...options }),
  
  update: (tabId: number, props: chrome.tabs.UpdateProperties) => 
    chrome.tabs.update(tabId, props),
  
  remove: (tabIds: number | number[]) => chrome.tabs.remove(tabIds),
  
  move: (tabIds: number | number[], moveProperties: chrome.tabs.MoveProperties) => 
    chrome.tabs.move(tabIds, moveProperties),
  
  group: (options: chrome.tabs.GroupOptions) => chrome.tabs.group(options),
  
  highlight: (highlightInfo: chrome.tabs.HighlightInfo) => 
    chrome.tabs.highlight(highlightInfo),
  
  duplicate: (tabId: number) => chrome.tabs.duplicate(tabId)
};

export const storage = {
  get: async <T>(key: string): Promise<T | undefined> => {
    const result = await chrome.storage.local.get(key);
    return result[key] as T | undefined;
  },
  
  getMultiple: async <T extends Record<string, any>>(keys: string[]): Promise<Partial<T>> => {
    const result = await chrome.storage.local.get(keys);
    return result as Partial<T>;
  },
  
  set: <T>(key: string, value: T) => 
    chrome.storage.local.set({ [key]: value }),
  
  setMultiple: (items: Record<string, any>) => 
    chrome.storage.local.set(items),
  
  remove: (keys: string | string[]) => chrome.storage.local.remove(keys),
  
  clear: () => chrome.storage.local.clear(),
  
  onChange: (callback: (changes: chrome.storage.StorageChange) => void) => 
    chrome.storage.onChanged.addListener((changes, namespace) => {
      if (namespace === 'local') {
        callback(changes);
      }
    })
};

export const messaging = {
  send: <T = any, R = any>(message: T): Promise<R> => 
    chrome.runtime.sendMessage<T, R>(message),
  
  onMessage: <T = any, R = any>(
    handler: (
      message: T, 
      sender: chrome.runtime.MessageSender, 
      sendResponse: (response?: R) => void
    ) => boolean | void
  ) => chrome.runtime.onMessage.addListener(handler),
  
  sendToTab: <T = any, R = any>(tabId: number, message: T): Promise<R> => 
    chrome.tabs.sendMessage<T, R>(tabId, message),
  
  sendToBackground: <T = any, R = any>(message: T): Promise<R> => 
    chrome.runtime.sendMessage<T, R>(message),
  
  broadcast: <T = any>(message: T) => {
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach(tab => {
        if (tab.id) {
          chrome.tabs.sendMessage(tab.id, message);
        }
      });
    });
  }
};

export const windows = {
  getCurrent: () => chrome.windows.getCurrent(),
  
  getAll: () => chrome.windows.getAll({ populate: true }),
  
  create: (createData?: chrome.windows.CreateData) => 
    chrome.windows.create(createData),
  
  update: (windowId: number, updateInfo: chrome.windows.UpdateInfo) => 
    chrome.windows.update(windowId, updateInfo),
  
  remove: (windowId: number) => chrome.windows.remove(windowId)
};

export const safeChrome = {
  tabs: {
    query: (queryInfo: chrome.tabs.QueryInfo): Promise<chrome.tabs.Tab[]> => 
      new Promise((resolve) => {
        chrome.tabs.query(queryInfo, (tabs) => {
          if (chrome.runtime.lastError) {
            console.warn('Tab query error:', chrome.runtime.lastError);
            resolve([]);
          } else {
            resolve(tabs);
          }
        });
      }),
    
    get: (tabId: number): Promise<chrome.tabs.Tab | null> =>
      new Promise((resolve) => {
        chrome.tabs.get(tabId, (tab) => {
          if (chrome.runtime.lastError) {
            console.warn('Tab get error:', chrome.runtime.lastError);
            resolve(null);
          } else {
            resolve(tab);
          }
        });
      }),
  },
  
  runtime: {
    isValid: () => {
      try {
        return chrome.runtime?.id !== undefined;
      } catch {
        return false;
      }
    },
    
    reload: () => {
      if (chrome.runtime?.reload) {
        chrome.runtime.reload();
      }
    },
    
    getURL: (path: string) => chrome.runtime.getURL(path)
  }
};

export const checkPermissions = async (permissions: string[]): Promise<boolean> => {
  try {
    return await chrome.permissions.contains({ permissions });
  } catch (error) {
    console.error('Permission check failed:', error);
    return false;
  }
};

export const requestPermissions = async (permissions: string[]): Promise<boolean> => {
  try {
    return await chrome.permissions.request({ permissions });
  } catch (error) {
    console.error('Permission request failed:', error);
    return false;
  }
};