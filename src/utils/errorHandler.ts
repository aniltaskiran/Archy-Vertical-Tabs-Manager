import { debug } from './debug';

export class ExtensionError extends Error {
  constructor(
    message: string,
    public code: string,
    public recoverable: boolean = true,
    public details?: any
  ) {
    super(message);
    this.name = 'ExtensionError';
  }
}

export const ErrorCodes = {
  TAB_NOT_FOUND: 'TAB_NOT_FOUND',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  STORAGE_ERROR: 'STORAGE_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  INVALID_STATE: 'INVALID_STATE',
  RUNTIME_ERROR: 'RUNTIME_ERROR',
  CONTEXT_INVALIDATED: 'CONTEXT_INVALIDATED',
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
} as const;

export const handleError = (error: unknown, context?: string): void => {
  if (error instanceof ExtensionError) {
    debug.error(`[${context || 'Extension'}] ${error.code}:`, error.message);
    
    if (error.details) {
      debug.error('Error details:', error.details);
    }
    
    if (!error.recoverable) {
      showErrorNotification(error.message);
    }
  } else if (error instanceof Error) {
    debug.error(`[${context || 'Extension'}] Error:`, error.message);
    debug.trace();
  } else {
    debug.error(`[${context || 'Extension'}] Unexpected error:`, error);
  }
  
  reportError(error, context);
};

export const showErrorNotification = (message: string): void => {
  if (chrome.notifications) {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: '/icons/icon-48.png',
      title: 'Archy Error',
      message: message,
      priority: 2
    });
  }
};

export const showWarningNotification = (message: string): void => {
  if (chrome.notifications) {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: '/icons/icon-48.png',
      title: 'Archy Warning',
      message: message,
      priority: 1
    });
  }
};

export const reportError = (error: unknown, context?: string): void => {
  if (!import.meta.env.DEV) {
    return;
  }
  
  const errorReport = {
    timestamp: new Date().toISOString(),
    context,
    error: error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack
    } : error,
    userAgent: navigator.userAgent,
    extensionVersion: chrome.runtime.getManifest().version
  };
  
  console.error('[Error Report]', errorReport);
};

export const withErrorHandler = <T extends (...args: any[]) => any>(
  fn: T,
  context?: string
): T => {
  return ((...args: Parameters<T>) => {
    try {
      const result = fn(...args);
      if (result instanceof Promise) {
        return result.catch(error => {
          handleError(error, context);
          throw error;
        });
      }
      return result;
    } catch (error) {
      handleError(error, context);
      throw error;
    }
  }) as T;
};

export class ErrorBoundary {
  private static errorCount = 0;
  private static readonly MAX_ERRORS = 10;
  private static readonly RESET_INTERVAL = 60000; // 1 minute
  private static resetTimer: NodeJS.Timeout | null = null;
  
  static handleError(error: Error, errorInfo?: any): void {
    this.errorCount++;
    
    debug.error('Error caught by boundary:', error);
    if (errorInfo) {
      debug.error('Error info:', errorInfo);
    }
    
    if (this.errorCount >= this.MAX_ERRORS) {
      debug.error('Too many errors detected. Reloading extension...');
      chrome.runtime.reload();
    }
    
    if (!this.resetTimer) {
      this.resetTimer = setTimeout(() => {
        this.errorCount = 0;
        this.resetTimer = null;
      }, this.RESET_INTERVAL);
    }
  }
  
  static reset(): void {
    this.errorCount = 0;
    if (this.resetTimer) {
      clearTimeout(this.resetTimer);
      this.resetTimer = null;
    }
  }
}

export const retry = async <T>(
  fn: () => Promise<T>,
  options: {
    maxAttempts?: number;
    delay?: number;
    backoff?: boolean;
    onRetry?: (attempt: number, error: any) => void;
  } = {}
): Promise<T> => {
  const {
    maxAttempts = 3,
    delay = 1000,
    backoff = true,
    onRetry
  } = options;
  
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (attempt < maxAttempts) {
        if (onRetry) {
          onRetry(attempt, error);
        }
        
        const waitTime = backoff ? delay * Math.pow(2, attempt - 1) : delay;
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }
  
  throw lastError;
};