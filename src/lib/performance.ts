/**
 * Performance Utilities - Optimization helpers and monitoring
 * 
 * Features:
 * - Lazy loading utilities
 * - Image optimization with placeholders
 * - Memoization helpers
 * - Bundle size monitoring
 * - 60fps performance tracking
 */
import React, { useCallback, useMemo, useRef, useEffect, useState } from 'react';

// Performance monitoring
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private frameCount = 0;
  private lastFrameTime = 0;
  private fps = 60;
  private isMonitoring = false;

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  startMonitoring(): void {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.lastFrameTime = Date.now();
    this.frameCount = 0;
    
    this.measureFrame();
  }

  stopMonitoring(): void {
    this.isMonitoring = false;
  }

  getCurrentFPS(): number {
    return this.fps;
  }

  private measureFrame = (): void => {
    if (!this.isMonitoring) return;

    const currentTime = Date.now();
    const deltaTime = currentTime - this.lastFrameTime;
    
    this.frameCount++;
    
    // Calculate FPS every second
    if (deltaTime >= 1000) {
      this.fps = Math.round((this.frameCount * 1000) / deltaTime);
      this.frameCount = 0;
      this.lastFrameTime = currentTime;
      
      // Log performance warnings
      if (this.fps < 50) {
        console.warn(`Performance Warning: FPS dropped to ${this.fps}`);
      }
    }

    requestAnimationFrame(this.measureFrame);
  };
}

// Lazy loading utilities
export function createLazyComponent<T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>
): React.LazyExoticComponent<T> {
  return React.lazy(importFn);
}

// Memoization utilities
export function useStableMemo<T>(
  factory: () => T,
  deps: React.DependencyList
): T {
  return useMemo(factory, deps);
}

export function useStableCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList
): T {
  return useCallback(callback, deps);
}

// Debounce utility
export function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<number | null>(null);

  return useCallback(
    ((...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    }) as T,
    [callback, delay]
  );
}

// Throttle utility
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const lastCallRef = useRef<number>(0);

  return useCallback(
    ((...args: Parameters<T>) => {
      const now = Date.now();
      
      if (now - lastCallRef.current >= delay) {
        lastCallRef.current = now;
        callback(...args);
      }
    }) as T,
    [callback, delay]
  );
}

// Image optimization
export interface OptimizedImageProps {
  source: { uri: string } | number;
  placeholder?: { uri: string } | number;
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png';
}

export function getOptimizedImageUri(
  originalUri: string,
  options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'jpeg' | 'png';
  } = {}
): string {
  // In a real implementation, this would integrate with a CDN like Cloudinary
  // For now, return the original URI
  const { width, height, quality = 80, format = 'webp' } = options;
  
  // Example CDN transformation (pseudo-code)
  // return `${originalUri}?w=${width}&h=${height}&q=${quality}&f=${format}`;
  
  return originalUri;
}

// Bundle size monitoring
export function logBundleSize(): void {
  if (__DEV__) {
    // In development, we can estimate bundle size
    const estimatedSize = (performance as any).memory?.usedJSHeapSize || 0;
    console.log(`📦 Estimated bundle size: ${(estimatedSize / 1024 / 1024).toFixed(2)}MB`);
  }
}

// Memory usage monitoring
export function useMemoryMonitor(): {
  usedMemory: number;
  totalMemory: number;
  isHighMemoryUsage: boolean;
} {
  const [memoryInfo, setMemoryInfo] = useState({
    usedMemory: 0,
    totalMemory: 0,
    isHighMemoryUsage: false,
  });

  useEffect(() => {
    const checkMemory = () => {
      const perfMemory = (performance as any).memory;
      if (perfMemory) {
        const used = perfMemory.usedJSHeapSize;
        const total = perfMemory.totalJSHeapSize;
        const isHigh = used / total > 0.8; // 80% threshold

        setMemoryInfo({
          usedMemory: used,
          totalMemory: total,
          isHighMemoryUsage: isHigh,
        });

        if (isHigh) {
          console.warn('High memory usage detected:', {
            used: `${(used / 1024 / 1024).toFixed(2)}MB`,
            total: `${(total / 1024 / 1024).toFixed(2)}MB`,
            percentage: `${((used / total) * 100).toFixed(1)}%`,
          });
        }
      }
    };

    // Check memory every 5 seconds
    const interval = setInterval(checkMemory, 5000);
    checkMemory(); // Initial check

    return () => clearInterval(interval);
  }, []);

  return memoryInfo;
}

// List optimization utilities
export function useVirtualizedList<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number
): {
  visibleItems: T[];
  startIndex: number;
  endIndex: number;
} {
  const [scrollOffset, setScrollOffset] = useState(0);

  const visibleCount = Math.ceil(containerHeight / itemHeight);
  const startIndex = Math.floor(scrollOffset / itemHeight);
  const endIndex = Math.min(startIndex + visibleCount + 1, items.length - 1);

  const visibleItems = items.slice(startIndex, endIndex + 1);

  return {
    visibleItems,
    startIndex,
    endIndex,
  };
}

// Performance measurement
export function measurePerformance<T>(
  name: string,
  fn: () => T
): T {
  const start = performance.now();
  const result = fn();
  const end = performance.now();
  
  console.log(`⚡ ${name} took ${(end - start).toFixed(2)}ms`);
  
  return result;
}

// Async performance measurement
export async function measureAsyncPerformance<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  const start = performance.now();
  const result = await fn();
  const end = performance.now();
  
  console.log(`⚡ ${name} took ${(end - start).toFixed(2)}ms`);
  
  return result;
}

// Export performance monitor instance
export const performanceMonitor = PerformanceMonitor.getInstance();