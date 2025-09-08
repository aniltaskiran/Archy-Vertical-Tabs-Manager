export const debug = {
  log: (...args: any[]) => {
    if (import.meta.env.DEV) {
      console.log('[Archy]', ...args);
    }
  },
  
  error: (...args: any[]) => {
    console.error('[Archy Error]', ...args);
  },
  
  warn: (...args: any[]) => {
    if (import.meta.env.DEV) {
      console.warn('[Archy Warning]', ...args);
    }
  },
  
  time: (label: string) => {
    if (import.meta.env.DEV) {
      console.time(`[Archy] ${label}`);
    }
  },
  
  timeEnd: (label: string) => {
    if (import.meta.env.DEV) {
      console.timeEnd(`[Archy] ${label}`);
    }
  },
  
  group: (label: string) => {
    if (import.meta.env.DEV) {
      console.group(`[Archy] ${label}`);
    }
  },
  
  groupEnd: () => {
    if (import.meta.env.DEV) {
      console.groupEnd();
    }
  },
  
  table: (data: any) => {
    if (import.meta.env.DEV) {
      console.table(data);
    }
  },
  
  trace: () => {
    if (import.meta.env.DEV) {
      console.trace('[Archy Stack Trace]');
    }
  }
};

export const assert = (condition: boolean, message: string) => {
  if (import.meta.env.DEV && !condition) {
    throw new Error(`[Archy Assertion Failed] ${message}`);
  }
};