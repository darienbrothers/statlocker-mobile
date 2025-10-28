/**
 * React Native Performance Monitoring Utilities
 * 
 * Platform-specific performance monitoring for React Native apps.
 * Tracks memory usage, animation performance, and bundle loading times.
 */

import { InteractionManager, Dimensions } from 'react-native';
import { logInfo, logError } from '@/lib/logging';

export interface RNPerformanceMetric {
  name: string;
  value: number;
  unit: 'ms' | 'bytes' | 'fps' | 'count' | 'percentage';
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface MemoryInfo {
  jsHeapSizeLimit: number;
  totalJSHeapSize: number;
  usedJSHeapSize: number;
}

export interface AnimationFrameData {
  frameRate: number;
  droppedFrames: number;
  totalFrames: number;
  duration: number;
}

export interface BundleLoadMetric {
  bundleName: string;
  loadTime: number;
  size: number;
  cached: boolean;
}

export class ReactNativePerformanceMonitor {
  private static instance: ReactNativePerformanceMonitor;
  private metrics: RNPerformanceMetric[] = [];
  private animationFrameCallbacks: Map<string, number> = new Map();
  private bundleLoadTimes: Map<string, number> = new Map();
  private memoryCheckInterval?: NodeJS.Timeout;
  private isMonitoring: boolean = false;

  private constructor() {}

  public static getInstance(): ReactNativePerformanceMonitor {
    if (!ReactNativePerformanceMonitor.instance) {
      ReactNativePerformanceMonitor.instance = new ReactNativePerformanceMonitor();
    }
    return ReactNativePerformanceMonitor.instance;
  }

  /**
   * Start performance monitoring
   */
  public startMonitoring(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.startMemoryMonitoring();
    this.recordDeviceInfo();
    
    logInfo('RN Performance Monitor: Started monitoring');
  }

  /**
   * Stop performance monitoring
   */
  public stopMonitoring(): void {
    if (!this.isMonitoring) return;

    this.isMonitoring = false;
    this.stopMemoryMonitoring();
    
    logInfo('RN Performance Monitor: Stopped monitoring');
  }

  /**
   * Track bundle loading time
   */
  public trackBundleLoad(bundleName: string): () => void {
    const startTime = Date.now();
    this.bundleLoadTimes.set(bundleName, startTime);

    return () => {
      const endTime = Date.now();
      const loadTime = endTime - startTime;
      
      this.recordMetric({
        name: 'bundle_load_time',
        value: loadTime,
        unit: 'ms',
        timestamp: new Date(),
        metadata: {
          bundleName,
          cached: false // Would need to determine if cached
        }
      });

      this.bundleLoadTimes.delete(bundleName);
    };
  }

  /**
   * Track animation performance
   */
  public trackAnimation(animationName: string): {
    start: () => void;
    end: () => AnimationFrameData;
  } {
    let startTime: number;
    let frameCount = 0;
    let droppedFrames = 0;
    let animationId: number;

    const start = () => {
      startTime = Date.now();
      frameCount = 0;
      droppedFrames = 0;

      const trackFrame = () => {
        frameCount++;
        
        // Check if frame was dropped (simplified check)
        const expectedFrameTime = 16.67; // 60fps = 16.67ms per frame
        const actualFrameTime = Date.now() - startTime;
        const expectedFrames = Math.floor(actualFrameTime / expectedFrameTime);
        
        if (frameCount < expectedFrames) {
          droppedFrames = expectedFrames - frameCount;
        }

        if (this.isMonitoring) {
          animationId = requestAnimationFrame(trackFrame);
        }
      };

      animationId = requestAnimationFrame(trackFrame);
    };

    const end = (): AnimationFrameData => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }

      const endTime = Date.now();
      const duration = endTime - startTime;
      const frameRate = frameCount > 0 ? (frameCount / duration) * 1000 : 0;

      const animationData: AnimationFrameData = {
        frameRate,
        droppedFrames,
        totalFrames: frameCount,
        duration
      };

      this.recordMetric({
        name: 'animation_performance',
        value: frameRate,
        unit: 'fps',
        timestamp: new Date(),
        metadata: {
          animationName,
          droppedFrames,
          totalFrames: frameCount,
          duration
        }
      });

      return animationData;
    };

    return { start, end };
  }

  /**
   * Track interaction responsiveness
   */
  public trackInteraction(interactionName: string): () => void {
    const startTime = Date.now();
    
    return () => {
      InteractionManager.runAfterInteractions(() => {
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        this.recordMetric({
          name: 'interaction_response_time',
          value: responseTime,
          unit: 'ms',
          timestamp: new Date(),
          metadata: {
            interactionName
          }
        });
      });
    };
  }

  /**
   * Track JavaScript thread blocking
   */
  public trackJSThreadBlocking(operationName: string): () => void {
    const startTime = Date.now();
    
    return () => {
      // Use setTimeout to measure JS thread blocking
      setTimeout(() => {
        const endTime = Date.now();
        const blockingTime = endTime - startTime;
        
        this.recordMetric({
          name: 'js_thread_blocking',
          value: blockingTime,
          unit: 'ms',
          timestamp: new Date(),
          metadata: {
            operationName
          }
        });
      }, 0);
    };
  }

  /**
   * Get current memory usage (React Native specific)
   */
  public async getMemoryUsage(): Promise<MemoryInfo | null> {
    try {
      // In React Native, we would use a native module to get memory info
      // For now, we'll simulate with performance.memory if available
      if (typeof performance !== 'undefined' && (performance as any).memory) {
        const memory = (performance as any).memory;
        return {
          jsHeapSizeLimit: memory.jsHeapSizeLimit,
          totalJSHeapSize: memory.totalJSHeapSize,
          usedJSHeapSize: memory.usedJSHeapSize
        };
      }

      // Fallback: estimate memory usage
      return this.estimateMemoryUsage();
    } catch (error) {
      logError('Failed to get memory usage', error as Error);
      return null;
    }
  }

  /**
   * Track network request performance
   */
  public trackNetworkRequest(
    url: string,
    method: string = 'GET'
  ): {
    start: () => void;
    end: (status: number, size?: number) => void;
  } {
    let startTime: number;

    const start = () => {
      startTime = Date.now();
    };

    const end = (status: number, size: number = 0) => {
      const endTime = Date.now();
      const duration = endTime - startTime;

      this.recordMetric({
        name: 'network_request_time',
        value: duration,
        unit: 'ms',
        timestamp: new Date(),
        metadata: {
          url,
          method,
          status,
          size
        }
      });
    };

    return { start, end };
  }

  /**
   * Get performance summary
   */
  public getPerformanceSummary(): {
    averageAnimationFPS: number;
    averageBundleLoadTime: number;
    averageInteractionTime: number;
    memoryUsage: number;
    jsThreadBlockingTime: number;
    networkRequestCount: number;
  } {
    const animationMetrics = this.metrics.filter(m => m.name === 'animation_performance');
    const bundleMetrics = this.metrics.filter(m => m.name === 'bundle_load_time');
    const interactionMetrics = this.metrics.filter(m => m.name === 'interaction_response_time');
    const memoryMetrics = this.metrics.filter(m => m.name === 'memory_usage');
    const blockingMetrics = this.metrics.filter(m => m.name === 'js_thread_blocking');
    const networkMetrics = this.metrics.filter(m => m.name === 'network_request_time');

    const averageAnimationFPS = animationMetrics.length > 0
      ? animationMetrics.reduce((sum, m) => sum + m.value, 0) / animationMetrics.length
      : 0;

    const averageBundleLoadTime = bundleMetrics.length > 0
      ? bundleMetrics.reduce((sum, m) => sum + m.value, 0) / bundleMetrics.length
      : 0;

    const averageInteractionTime = interactionMetrics.length > 0
      ? interactionMetrics.reduce((sum, m) => sum + m.value, 0) / interactionMetrics.length
      : 0;

    const latestMemoryMetric = memoryMetrics[memoryMetrics.length - 1];
    const memoryUsage = latestMemoryMetric?.value || 0;

    const jsThreadBlockingTime = blockingMetrics.length > 0
      ? blockingMetrics.reduce((sum, m) => sum + m.value, 0)
      : 0;

    return {
      averageAnimationFPS,
      averageBundleLoadTime,
      averageInteractionTime,
      memoryUsage,
      jsThreadBlockingTime,
      networkRequestCount: networkMetrics.length
    };
  }

  /**
   * Get performance recommendations
   */
  public getPerformanceRecommendations(): Array<{
    type: 'memory' | 'animation' | 'bundle' | 'interaction' | 'network';
    severity: 'low' | 'medium' | 'high';
    message: string;
    value?: number;
  }> {
    const recommendations: Array<{
      type: 'memory' | 'animation' | 'bundle' | 'interaction' | 'network';
      severity: 'low' | 'medium' | 'high';
      message: string;
      value?: number;
    }> = [];

    const summary = this.getPerformanceSummary();

    // Check animation performance
    if (summary.averageAnimationFPS < 30) {
      recommendations.push({
        type: 'animation',
        severity: 'high',
        message: 'Low animation frame rate detected. Consider using native driver or reducing animation complexity.',
        value: summary.averageAnimationFPS
      });
    } else if (summary.averageAnimationFPS < 50) {
      recommendations.push({
        type: 'animation',
        severity: 'medium',
        message: 'Animation frame rate could be improved. Consider optimizing animations.',
        value: summary.averageAnimationFPS
      });
    }

    // Check bundle loading times
    if (summary.averageBundleLoadTime > 3000) {
      recommendations.push({
        type: 'bundle',
        severity: 'high',
        message: 'Slow bundle loading detected. Consider code splitting or bundle optimization.',
        value: summary.averageBundleLoadTime
      });
    } else if (summary.averageBundleLoadTime > 1500) {
      recommendations.push({
        type: 'bundle',
        severity: 'medium',
        message: 'Bundle loading could be faster. Consider lazy loading or preloading.',
        value: summary.averageBundleLoadTime
      });
    }

    // Check interaction responsiveness
    if (summary.averageInteractionTime > 500) {
      recommendations.push({
        type: 'interaction',
        severity: 'high',
        message: 'Slow interaction response detected. Consider optimizing event handlers.',
        value: summary.averageInteractionTime
      });
    } else if (summary.averageInteractionTime > 200) {
      recommendations.push({
        type: 'interaction',
        severity: 'medium',
        message: 'Interaction response could be faster. Consider debouncing or optimization.',
        value: summary.averageInteractionTime
      });
    }

    // Check memory usage (assuming values are in bytes)
    if (summary.memoryUsage > 100 * 1024 * 1024) { // 100MB
      recommendations.push({
        type: 'memory',
        severity: 'high',
        message: 'High memory usage detected. Consider memory optimization or cleanup.',
        value: summary.memoryUsage
      });
    } else if (summary.memoryUsage > 50 * 1024 * 1024) { // 50MB
      recommendations.push({
        type: 'memory',
        severity: 'medium',
        message: 'Memory usage is elevated. Monitor for potential memory leaks.',
        value: summary.memoryUsage
      });
    }

    return recommendations;
  }

  /**
   * Clear all performance data
   */
  public clearData(): void {
    this.metrics = [];
    this.animationFrameCallbacks.clear();
    this.bundleLoadTimes.clear();
    
    logInfo('RN Performance Monitor: Data cleared');
  }

  // Private methods

  private recordMetric(metric: RNPerformanceMetric): void {
    this.metrics.push(metric);
    
    // Keep only last 500 metrics
    if (this.metrics.length > 500) {
      this.metrics = this.metrics.slice(-500);
    }

    // Log performance issues
    if (metric.name === 'animation_performance' && metric.value < 30) {
      logInfo('Performance Alert: Low animation FPS', {
        fps: metric.value,
        animation: metric.metadata?.animationName
      });
    }

    if (metric.name === 'bundle_load_time' && metric.value > 3000) {
      logInfo('Performance Alert: Slow bundle loading', {
        loadTime: metric.value,
        bundle: metric.metadata?.bundleName
      });
    }
  }

  private startMemoryMonitoring(): void {
    // Check memory usage every 10 seconds
    this.memoryCheckInterval = setInterval(async () => {
      if (this.isMonitoring) {
        const memoryInfo = await this.getMemoryUsage();
        if (memoryInfo) {
          this.recordMetric({
            name: 'memory_usage',
            value: memoryInfo.usedJSHeapSize,
            unit: 'bytes',
            timestamp: new Date(),
            metadata: {
              total: memoryInfo.totalJSHeapSize,
              limit: memoryInfo.jsHeapSizeLimit
            }
          });
        }
      }
    }, 10000);
  }

  private stopMemoryMonitoring(): void {
    if (this.memoryCheckInterval) {
      clearInterval(this.memoryCheckInterval);
      this.memoryCheckInterval = undefined;
    }
  }

  private recordDeviceInfo(): void {
    const { width, height } = Dimensions.get('window');
    const screenDensity = Dimensions.get('screen').scale;

    this.recordMetric({
      name: 'device_info',
      value: 1,
      unit: 'count',
      timestamp: new Date(),
      metadata: {
        screenWidth: width,
        screenHeight: height,
        screenDensity,
        platform: 'react-native'
      }
    });
  }

  private estimateMemoryUsage(): MemoryInfo {
    // Rough estimation based on typical React Native app usage
    const baseMemory = 20 * 1024 * 1024; // 20MB base
    const estimatedUsed = baseMemory + (this.metrics.length * 1024); // Rough estimate
    
    return {
      jsHeapSizeLimit: 512 * 1024 * 1024, // 512MB limit
      totalJSHeapSize: estimatedUsed * 1.5,
      usedJSHeapSize: estimatedUsed
    };
  }
}

// Export singleton instance
export const rnPerformanceMonitor = ReactNativePerformanceMonitor.getInstance();

// Utility functions for easy integration

/**
 * Higher-order component for tracking component render performance
 */
export function withPerformanceTracking<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName: string
) {
  return function PerformanceTrackedComponent(props: P) {
    const React = require('react');
    const { useEffect, useRef } = React;
    
    const renderStartTime = useRef<number>();
    const mountStartTime = useRef<number>();

    useEffect(() => {
      mountStartTime.current = Date.now();
      
      return () => {
        if (mountStartTime.current) {
          const mountTime = Date.now() - mountStartTime.current;
          rnPerformanceMonitor.recordMetric({
            name: 'component_lifecycle',
            value: mountTime,
            unit: 'ms',
            timestamp: new Date(),
            metadata: {
              component: componentName,
              lifecycle: 'mount'
            }
          });
        }
      };
    }, []);

    // Track render time
    renderStartTime.current = Date.now();
    
    useEffect(() => {
      if (renderStartTime.current) {
        const renderTime = Date.now() - renderStartTime.current;
        rnPerformanceMonitor.recordMetric({
          name: 'component_render_time',
          value: renderTime,
          unit: 'ms',
          timestamp: new Date(),
          metadata: {
            component: componentName
          }
        });
      }
    });

    return React.createElement(WrappedComponent, props);
  };
}

/**
 * Hook for tracking custom performance metrics
 */
export function usePerformanceTracking(operationName: string) {
  const React = require('react');
  const { useCallback } = React;

  const trackOperation = useCallback(() => {
    const startTime = Date.now();
    
    return () => {
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      rnPerformanceMonitor.recordMetric({
        name: 'custom_operation',
        value: duration,
        unit: 'ms',
        timestamp: new Date(),
        metadata: {
          operation: operationName
        }
      });
    };
  }, [operationName]);

  return { trackOperation };
}