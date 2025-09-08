import { debug } from './debug';

export class PerformanceMonitor {
  private static metrics = new Map<string, number>();
  private static measurements: Array<{ name: string; duration: number; timestamp: number }> = [];
  
  static start(label: string): void {
    this.metrics.set(label, performance.now());
  }
  
  static end(label: string): number {
    const start = this.metrics.get(label);
    if (!start) {
      debug.warn(`No start time found for label: ${label}`);
      return 0;
    }
    
    const duration = performance.now() - start;
    this.metrics.delete(label);
    
    this.measurements.push({
      name: label,
      duration,
      timestamp: Date.now()
    });
    
    if (import.meta.env.DEV) {
      console.log(`[Performance] ${label}: ${duration.toFixed(2)}ms`);
    }
    
    return duration;
  }
  
  static async measure<T>(label: string, fn: () => Promise<T>): Promise<T> {
    this.start(label);
    try {
      const result = await fn();
      return result;
    } finally {
      this.end(label);
    }
  }
  
  static measureSync<T>(label: string, fn: () => T): T {
    this.start(label);
    try {
      const result = fn();
      return result;
    } finally {
      this.end(label);
    }
  }
  
  static getMetrics(): Array<{ name: string; duration: number; timestamp: number }> {
    return [...this.measurements];
  }
  
  static clearMetrics(): void {
    this.measurements = [];
  }
  
  static getAverageTime(label: string): number {
    const relevantMeasurements = this.measurements.filter(m => m.name === label);
    if (relevantMeasurements.length === 0) return 0;
    
    const total = relevantMeasurements.reduce((sum, m) => sum + m.duration, 0);
    return total / relevantMeasurements.length;
  }
  
  static logSummary(): void {
    if (!import.meta.env.DEV) return;
    
    const summary = new Map<string, { count: number; total: number; min: number; max: number }>();
    
    this.measurements.forEach(m => {
      const existing = summary.get(m.name) || { count: 0, total: 0, min: Infinity, max: -Infinity };
      existing.count++;
      existing.total += m.duration;
      existing.min = Math.min(existing.min, m.duration);
      existing.max = Math.max(existing.max, m.duration);
      summary.set(m.name, existing);
    });
    
    console.group('[Performance Summary]');
    summary.forEach((stats, name) => {
      console.log(`${name}:`);
      console.log(`  Count: ${stats.count}`);
      console.log(`  Average: ${(stats.total / stats.count).toFixed(2)}ms`);
      console.log(`  Min: ${stats.min.toFixed(2)}ms`);
      console.log(`  Max: ${stats.max.toFixed(2)}ms`);
      console.log(`  Total: ${stats.total.toFixed(2)}ms`);
    });
    console.groupEnd();
  }
}

export class MemoryMonitor {
  static async checkMemory(): Promise<{
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
    percentUsed: number;
  } | null> {
    if (!('memory' in performance)) {
      debug.warn('Performance memory API not available');
      return null;
    }
    
    const memory = (performance as any).memory;
    const percentUsed = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
    
    return {
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
      percentUsed
    };
  }
  
  static formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
  
  static async logMemory(): Promise<void> {
    const memory = await this.checkMemory();
    if (!memory) return;
    
    console.group('[Memory Usage]');
    console.log(`Used: ${this.formatBytes(memory.usedJSHeapSize)}`);
    console.log(`Total: ${this.formatBytes(memory.totalJSHeapSize)}`);
    console.log(`Limit: ${this.formatBytes(memory.jsHeapSizeLimit)}`);
    console.log(`Usage: ${memory.percentUsed.toFixed(2)}%`);
    console.groupEnd();
  }
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function (...args: Parameters<T>) {
    if (timeout) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  
  return function (...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}