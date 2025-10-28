/**
 * Onboarding Performance Monitoring Service
 * 
 * Tracks performance metrics specific to the onboarding flow:
 * - Step completion times
 * - Memory usage during onboarding
 * - Network request performance
 * - Animation frame rates
 * - Bundle loading times
 */

import { logInfo, logError } from '@/lib/logging';
import { trackEvent } from '@/lib/analytics';

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: 'ms' | 'seconds' | 'bytes' | 'fps' | 'count';
  timestamp: Date;
  step?: number;
  metadata?: Record<string, any>;
}

export interface MemorySnapshot {
  used: number;
  total: number;
  timestamp: Date;
  step: number;
}

export interface NetworkMetric {
  url: string;
  method: string;
  duration: number;
  size: number;
  status: number;
  step: number;
  timestamp: Date;
}

export interface AnimationMetric {
  name: string;
  frameRate: number;
  droppedFrames: number;
  duration: number;
  step: number;
  timestamp: Date;
}

export interface BundleMetric {
  component: string;
  loadTime: number;
  size: number;
  cached: boolean;
  step: number;
  timestamp: Date;
}

export class OnboardingPerformanceService {
  private static instance: OnboardingPerformanceService;
  private metrics: PerformanceMetric[] = [];
  private memorySnapshots: MemorySnapshot[] = [];
  private networkMetrics: NetworkMetric[] = [];
  private animationMetrics: AnimationMetric[] = [];
  private bundleMetrics: BundleMetric[] = [];
  private stepStartTimes: Map<number, number> = new Map();
  private networkObserver?: PerformanceObserver;
  private memoryInterval?: NodeJS.Timeout;
  private isMonitoring: boolean = false;

  private constructor() {
    this.initializePerformanceMonitoring();
  }

  public static getInstance(): OnboardingPerformanceService {
    if (!OnboardingPerformanceService.instance) {
      OnboardingPerformanceService.instance = new OnboardingPerformanceService();
    }
    return OnboardingPerformanceService.instance;
  }

  /**
   * Start performance monitoring for onboarding
   */
  public startMonitoring(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.startMemoryMonitoring();
    this.startNetworkMonitoring();
    
    logInfo('Onboarding Performance: Monitoring started');
  }

  /**
   * Stop performance monitoring
   */
  public stopMonitoring(): void {
    if (!this.isMonitoring) return;

    this.isMonitoring = false;
    this.stopMemoryMonitoring();
    this.stopNetworkMonitoring();
    
    logInfo('Onboarding Performance: Monitoring stopped');
  }

  /**
   * Track step start time
   */
  public trackStepStart(step: number): void {
    this.stepStartTimes.set(step, performance.now());
    this.takeMemorySnapshot(step);
    
    this.recordMetric({
      name: 'step_start',
      value: step,
      unit: 'count',
      timestamp: new Date(),
      step,
      metadata: { action: 'start' }
    });
  }

  /**
   * Track step completion time
   */
  public trackStepCompletion(step: number): void {
    const startTime = this.stepStartTimes.get(step);
    if (startTime) {
      const duration = performance.now() - startTime;
      
      this.recordMetric({
        name: 'step_completion_time',
        value: duration,
        unit: 'ms',
        timestamp: new Date(),
        step,
        metadata: { 
          action: 'complete',
          duration_seconds: duration / 1000
        }
      });

      this.stepStartTimes.delete(step);
      this.takeMemorySnapshot(step);
      
      // Track in main analytics
      trackEvent('onboarding_step_performance', {
        step,
        duration,
        memoryUsed: this.getCurrentMemoryUsage()
      });
    }
  }

  /**
   * Track component loading time
   */
  public trackComponentLoad(
    componentName: string, 
    loadTime: number, 
    step: number,
    size?: number,
    cached: boolean = false
  ): void {
    const bundleMetric: BundleMetric = {
      component: componentName,
      loadTime,
      size: size || 0,
      cached,
      step,
      timestamp: new Date()
    };

    this.bundleMetrics.push(bundleMetric);
    
    this.recordMetric({
      name: 'component_load_time',
      value: loadTime,
      unit: 'ms',
      timestamp: new Date(),
      step,
      metadata: {
        component: componentName,
        size,
        cached
      }
    });

    // Keep only last 100 bundle metrics
    if (this.bundleMetrics.length > 100) {
      this.bundleMetrics = this.bundleMetrics.slice(-100);
    }
  }

  /**
   * Track animation performance
   */
  public trackAnimationPerformance(
    animationName: string,
    frameRate: number,
    droppedFrames: number,
    duration: number,
    step: number
  ): void {
    const animationMetric: AnimationMetric = {
      name: animationName,
      frameRate,
      droppedFrames,
      duration,
      step,
      timestamp: new Date()
    };

    this.animationMetrics.push(animationMetric);
    
    this.recordMetric({
      name: 'animation_performance',
      value: frameRate,
      unit: 'fps',
      timestamp: new Date(),
      step,
      metadata: {
        animation: animationName,
        droppedFrames,
        duration
      }
    });

    // Keep only last 50 animation metrics
    if (this.animationMetrics.length > 50) {
      this.animationMetrics = this.animationMetrics.slice(-50);
    }

    // Alert if performance is poor
    if (frameRate < 30 || droppedFrames > 5) {
      this.recordPerformanceAlert('poor_animation_performance', {
        animation: animationName,
        frameRate,
        droppedFrames,
        step
      });
    }
  }

  /**
   * Track network request performance
   */
  public trackNetworkRequest(
    url: string,
    method: string,
    duration: number,
    size: number,
    status: number,
    step: number
  ): void {
    const networkMetric: NetworkMetric = {
      url,
      method,
      duration,
      size,
      status,
      step,
      timestamp: new Date()
    };

    this.networkMetrics.push(networkMetric);
    
    this.recordMetric({
      name: 'network_request_time',
      value: duration,
      unit: 'ms',
      timestamp: new Date(),
      step,
      metadata: {
        url,
        method,
        size,
        status
      }
    });

    // Keep only last 100 network metrics
    if (this.networkMetrics.length > 100) {
      this.networkMetrics = this.networkMetrics.slice(-100);
    }

    // Alert if request is slow
    if (duration > 5000) { // 5 seconds
      this.recordPerformanceAlert('slow_network_request', {
        url,
        duration,
        step
      });
    }
  }

  /**
   * Get performance summary for a specific step
   */
  public getStepPerformanceSummary(step: number): {
    completionTime?: number;
    memoryUsage?: number;
    networkRequests: number;
    animationIssues: number;
    componentLoads: number;
  } {
    const stepMetrics = this.metrics.filter(m => m.step === step);
    const stepNetworkMetrics = this.networkMetrics.filter(m => m.step === step);
    const stepAnimationMetrics = this.animationMetrics.filter(m => m.step === step);
    const stepBundleMetrics = this.bundleMetrics.filter(m => m.step === step);
    const stepMemorySnapshots = this.memorySnapshots.filter(m => m.step === step);

    const completionTimeMetric = stepMetrics.find(m => m.name === 'step_completion_time');
    const latestMemorySnapshot = stepMemorySnapshots[stepMemorySnapshots.length - 1];
    
    const animationIssues = stepAnimationMetrics.filter(m => 
      m.frameRate < 30 || m.droppedFrames > 5
    ).length;

    return {
      completionTime: completionTimeMetric?.value,
      memoryUsage: latestMemorySnapshot?.used,
      networkRequests: stepNetworkMetrics.length,
      animationIssues,
      componentLoads: stepBundleMetrics.length
    };
  }

  /**
   * Get overall performance metrics
   */
  public getOverallPerformanceMetrics(): {
    averageStepTime: number;
    totalMemoryUsage: number;
    networkRequestCount: number;
    slowAnimationsCount: number;
    performanceAlerts: number;
  } {
    const completionTimes = this.metrics
      .filter(m => m.name === 'step_completion_time')
      .map(m => m.value);
    
    const averageStepTime = completionTimes.length > 0
      ? completionTimes.reduce((sum, time) => sum + time, 0) / completionTimes.length
      : 0;

    const latestMemorySnapshot = this.memorySnapshots[this.memorySnapshots.length - 1];
    const totalMemoryUsage = latestMemorySnapshot?.used || 0;

    const slowAnimations = this.animationMetrics.filter(m => 
      m.frameRate < 30 || m.droppedFrames > 5
    );

    const performanceAlerts = this.metrics.filter(m => 
      m.name === 'performance_alert'
    ).length;

    return {
      averageStepTime,
      totalMemoryUsage,
      networkRequestCount: this.networkMetrics.length,
      slowAnimationsCount: slowAnimations.length,
      performanceAlerts
    };
  }

  /**
   * Get performance recommendations
   */
  public getPerformanceRecommendations(): Array<{
    type: 'memory' | 'network' | 'animation' | 'bundle';
    severity: 'low' | 'medium' | 'high';
    message: string;
    step?: number;
  }> {
    const recommendations: Array<{
      type: 'memory' | 'network' | 'animation' | 'bundle';
      severity: 'low' | 'medium' | 'high';
      message: string;
      step?: number;
    }> = [];

    // Check memory usage
    const highMemorySnapshots = this.memorySnapshots.filter(s => s.used > 100 * 1024 * 1024); // 100MB
    if (highMemorySnapshots.length > 0) {
      recommendations.push({
        type: 'memory',
        severity: 'high',
        message: 'High memory usage detected during onboarding. Consider optimizing component rendering.',
        step: highMemorySnapshots[0].step
      });
    }

    // Check slow network requests
    const slowRequests = this.networkMetrics.filter(n => n.duration > 3000);
    if (slowRequests.length > 0) {
      recommendations.push({
        type: 'network',
        severity: 'medium',
        message: 'Slow network requests detected. Consider implementing request caching or optimization.',
        step: slowRequests[0].step
      });
    }

    // Check animation performance
    const poorAnimations = this.animationMetrics.filter(a => a.frameRate < 30);
    if (poorAnimations.length > 0) {
      recommendations.push({
        type: 'animation',
        severity: 'medium',
        message: 'Poor animation performance detected. Consider using native driver or reducing animation complexity.',
        step: poorAnimations[0].step
      });
    }

    // Check bundle loading times
    const slowBundles = this.bundleMetrics.filter(b => b.loadTime > 2000);
    if (slowBundles.length > 0) {
      recommendations.push({
        type: 'bundle',
        severity: 'low',
        message: 'Slow component loading detected. Consider implementing code splitting or preloading.',
        step: slowBundles[0].step
      });
    }

    return recommendations;
  }

  /**
   * Clear all performance data
   */
  public clearData(): void {
    this.metrics = [];
    this.memorySnapshots = [];
    this.networkMetrics = [];
    this.animationMetrics = [];
    this.bundleMetrics = [];
    this.stepStartTimes.clear();
    
    logInfo('Onboarding Performance: Data cleared');
  }

  // Private methods

  private initializePerformanceMonitoring(): void {
    try {
      // Initialize React Native performance monitoring
      import('@/lib/onboarding/performanceMonitoring').then(({ rnPerformanceMonitor }) => {
        // The RN performance monitor will handle platform-specific monitoring
        logInfo('Onboarding Performance: RN performance monitor initialized');
      }).catch((error) => {
        logError('Failed to initialize RN performance monitoring', error as Error);
      });

      // Initialize web performance observers if available
      if (typeof PerformanceObserver !== 'undefined') {
        this.networkObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            if (entry.name.includes('onboarding') || entry.name.includes('api')) {
              this.trackNetworkRequest(
                entry.name,
                'GET', // Would need to determine actual method
                entry.duration,
                entry.transferSize || 0,
                200, // Would need to determine actual status
                0 // Would need to determine current step
              );
            }
          });
        });

        this.networkObserver.observe({ entryTypes: ['resource'] });
      }
    } catch (error) {
      logError('Failed to initialize performance monitoring', error as Error);
    }
  }

  private startMemoryMonitoring(): void {
    // Monitor memory usage every 5 seconds during onboarding
    this.memoryInterval = setInterval(() => {
      if (this.isMonitoring) {
        const memoryUsage = this.getCurrentMemoryUsage();
        if (memoryUsage > 0) {
          // We don't know the current step here, so we'll use 0
          this.takeMemorySnapshot(0);
        }
      }
    }, 5000);
  }

  private stopMemoryMonitoring(): void {
    if (this.memoryInterval) {
      clearInterval(this.memoryInterval);
      this.memoryInterval = undefined;
    }
  }

  private startNetworkMonitoring(): void {
    // Network monitoring is handled by the PerformanceObserver
    // Additional network monitoring could be added here
  }

  private stopNetworkMonitoring(): void {
    if (this.networkObserver) {
      this.networkObserver.disconnect();
    }
  }

  private takeMemorySnapshot(step: number): void {
    const memoryUsage = this.getCurrentMemoryUsage();
    
    if (memoryUsage > 0) {
      const snapshot: MemorySnapshot = {
        used: memoryUsage,
        total: this.getTotalMemory(),
        timestamp: new Date(),
        step
      };

      this.memorySnapshots.push(snapshot);
      
      // Keep only last 50 snapshots
      if (this.memorySnapshots.length > 50) {
        this.memorySnapshots = this.memorySnapshots.slice(-50);
      }
    }
  }

  private getCurrentMemoryUsage(): number {
    try {
      // In React Native, we would use a native module to get memory usage
      // For now, return a mock value
      if (typeof performance !== 'undefined' && (performance as any).memory) {
        return (performance as any).memory.usedJSHeapSize;
      }
      return 0;
    } catch (error) {
      return 0;
    }
  }

  private getTotalMemory(): number {
    try {
      if (typeof performance !== 'undefined' && (performance as any).memory) {
        return (performance as any).memory.totalJSHeapSize;
      }
      return 0;
    } catch (error) {
      return 0;
    }
  }

  private recordMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);
    
    // Keep only last 500 metrics
    if (this.metrics.length > 500) {
      this.metrics = this.metrics.slice(-500);
    }

    // Log significant performance issues
    if (metric.name === 'step_completion_time' && metric.value > 30000) { // 30 seconds
      this.recordPerformanceAlert('slow_step_completion', {
        step: metric.step,
        duration: metric.value
      });
    }
  }

  private recordPerformanceAlert(type: string, metadata: Record<string, any>): void {
    this.recordMetric({
      name: 'performance_alert',
      value: 1,
      unit: 'count',
      timestamp: new Date(),
      metadata: {
        alertType: type,
        ...metadata
      }
    });

    // Track in main analytics
    trackEvent('onboarding_performance_alert', {
      type,
      ...metadata
    });

    logInfo('Onboarding Performance Alert', { type, metadata });
  }
}

// Export singleton instance
export const onboardingPerformance = OnboardingPerformanceService.getInstance();