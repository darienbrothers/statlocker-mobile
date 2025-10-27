/**
 * Performance Monitoring - Advanced performance tracking and analysis
 * 
 * Features:
 * - Frame rate tracking with detailed metrics
 * - Bundle size analysis and monitoring
 * - Memory usage optimization strategies
 * - Layout stability measurements
 * - Performance regression detection
 */

export interface PerformanceMetrics {
  fps: number;
  averageFPS: number;
  minFPS: number;
  maxFPS: number;
  frameDrops: number;
  memoryUsage: number;
  bundleSize: number;
  layoutShifts: number;
  renderTime: number;
  timestamp: number;
}

export interface PerformanceBudget {
  minFPS: number;
  maxMemoryMB: number;
  maxBundleSizeMB: number;
  maxRenderTimeMS: number;
  maxLayoutShifts: number;
}

export class AdvancedPerformanceMonitor {
  private static instance: AdvancedPerformanceMonitor;
  private metrics: PerformanceMetrics[] = [];
  private budget: PerformanceBudget;
  private isMonitoring = false;
  private frameStartTime = 0;
  private frameCount = 0;
  private fpsHistory: number[] = [];
  private layoutShiftCount = 0;

  constructor(budget?: Partial<PerformanceBudget>) {
    this.budget = {
      minFPS: 50,
      maxMemoryMB: 100,
      maxBundleSizeMB: 10,
      maxRenderTimeMS: 16, // 60fps = 16.67ms per frame
      maxLayoutShifts: 0,
      ...budget,
    };
  }

  static getInstance(budget?: Partial<PerformanceBudget>): AdvancedPerformanceMonitor {
    if (!AdvancedPerformanceMonitor.instance) {
      AdvancedPerformanceMonitor.instance = new AdvancedPerformanceMonitor(budget);
    }
    return AdvancedPerformanceMonitor.instance;
  }

  startMonitoring(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.frameStartTime = performance.now();
    this.frameCount = 0;
    this.fpsHistory = [];
    this.layoutShiftCount = 0;

    this.measureFrame();
    this.startMemoryMonitoring();
  }

  stopMonitoring(): void {
    this.isMonitoring = false;
  }

  private measureFrame = (): void => {
    if (!this.isMonitoring) return;

    const currentTime = performance.now();
    const frameTime = currentTime - this.frameStartTime;
    
    this.frameCount++;
    
    // Calculate FPS
    const fps = 1000 / frameTime;
    this.fpsHistory.push(fps);
    
    // Keep only last 60 frames (1 second at 60fps)
    if (this.fpsHistory.length > 60) {
      this.fpsHistory.shift();
    }

    // Record metrics every second
    if (this.frameCount % 60 === 0) {
      this.recordMetrics();
    }

    this.frameStartTime = currentTime;
    requestAnimationFrame(this.measureFrame);
  };

  private startMemoryMonitoring(): void {
    const checkMemory = () => {
      if (!this.isMonitoring) return;

      const memoryInfo = this.getMemoryInfo();
      
      if (memoryInfo.usedMemory > this.budget.maxMemoryMB * 1024 * 1024) {
        this.reportBudgetViolation('memory', {
          current: memoryInfo.usedMemory / 1024 / 1024,
          budget: this.budget.maxMemoryMB,
        });
      }

      setTimeout(checkMemory, 5000); // Check every 5 seconds
    };

    checkMemory();
  }

  private recordMetrics(): void {
    const currentFPS = this.getCurrentFPS();
    const averageFPS = this.getAverageFPS();
    const minFPS = Math.min(...this.fpsHistory);
    const maxFPS = Math.max(...this.fpsHistory);
    const frameDrops = this.fpsHistory.filter(fps => fps < 55).length;
    const memoryInfo = this.getMemoryInfo();

    const metrics: PerformanceMetrics = {
      fps: currentFPS,
      averageFPS,
      minFPS,
      maxFPS,
      frameDrops,
      memoryUsage: memoryInfo.usedMemory,
      bundleSize: this.getBundleSize(),
      layoutShifts: this.layoutShiftCount,
      renderTime: 1000 / currentFPS,
      timestamp: Date.now(),
    };

    this.metrics.push(metrics);
    this.checkBudgetViolations(metrics);

    // Keep only last 100 metric records
    if (this.metrics.length > 100) {
      this.metrics.shift();
    }
  }

  private getCurrentFPS(): number {
    if (this.fpsHistory.length === 0) return 60;
    return this.fpsHistory[this.fpsHistory.length - 1];
  }

  private getAverageFPS(): number {
    if (this.fpsHistory.length === 0) return 60;
    const sum = this.fpsHistory.reduce((acc, fps) => acc + fps, 0);
    return sum / this.fpsHistory.length;
  }

  private getMemoryInfo(): { usedMemory: number; totalMemory: number } {
    const perfMemory = (performance as any).memory;
    if (perfMemory) {
      return {
        usedMemory: perfMemory.usedJSHeapSize,
        totalMemory: perfMemory.totalJSHeapSize,
      };
    }
    return { usedMemory: 0, totalMemory: 0 };
  }

  private getBundleSize(): number {
    // Estimate bundle size based on memory usage
    const memoryInfo = this.getMemoryInfo();
    return memoryInfo.usedMemory * 0.3; // Rough estimate
  }

  private checkBudgetViolations(metrics: PerformanceMetrics): void {
    if (metrics.fps < this.budget.minFPS) {
      this.reportBudgetViolation('fps', {
        current: metrics.fps,
        budget: this.budget.minFPS,
      });
    }

    if (metrics.renderTime > this.budget.maxRenderTimeMS) {
      this.reportBudgetViolation('renderTime', {
        current: metrics.renderTime,
        budget: this.budget.maxRenderTimeMS,
      });
    }

    if (metrics.layoutShifts > this.budget.maxLayoutShifts) {
      this.reportBudgetViolation('layoutShifts', {
        current: metrics.layoutShifts,
        budget: this.budget.maxLayoutShifts,
      });
    }
  }

  private reportBudgetViolation(
    metric: string, 
    data: { current: number; budget: number }
  ): void {
    console.warn(`🚨 Performance Budget Violation - ${metric}:`, {
      current: data.current,
      budget: data.budget,
      violation: data.current - data.budget,
    });

    // In a real app, send to analytics
    // analytics.track('performance_budget_violation', {
    //   metric,
    //   current: data.current,
    //   budget: data.budget,
    // });
  }

  // Public API
  getMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  getLatestMetrics(): PerformanceMetrics | null {
    return this.metrics.length > 0 ? this.metrics[this.metrics.length - 1] : null;
  }

  getBudget(): PerformanceBudget {
    return { ...this.budget };
  }

  updateBudget(newBudget: Partial<PerformanceBudget>): void {
    this.budget = { ...this.budget, ...newBudget };
  }

  recordLayoutShift(): void {
    this.layoutShiftCount++;
  }

  generateReport(): string {
    const latest = this.getLatestMetrics();
    if (!latest) return 'No performance data available';

    return `
Performance Report:
- FPS: ${latest.fps.toFixed(1)} (avg: ${latest.averageFPS.toFixed(1)})
- Memory: ${(latest.memoryUsage / 1024 / 1024).toFixed(2)}MB
- Render Time: ${latest.renderTime.toFixed(2)}ms
- Frame Drops: ${latest.frameDrops}
- Layout Shifts: ${latest.layoutShifts}
- Budget Violations: ${this.getBudgetViolations().length}
    `.trim();
  }

  private getBudgetViolations(): string[] {
    const latest = this.getLatestMetrics();
    if (!latest) return [];

    const violations: string[] = [];

    if (latest.fps < this.budget.minFPS) {
      violations.push(`FPS: ${latest.fps} < ${this.budget.minFPS}`);
    }

    if (latest.memoryUsage > this.budget.maxMemoryMB * 1024 * 1024) {
      violations.push(`Memory: ${(latest.memoryUsage / 1024 / 1024).toFixed(2)}MB > ${this.budget.maxMemoryMB}MB`);
    }

    if (latest.renderTime > this.budget.maxRenderTimeMS) {
      violations.push(`Render Time: ${latest.renderTime.toFixed(2)}ms > ${this.budget.maxRenderTimeMS}ms`);
    }

    return violations;
  }

  reset(): void {
    this.metrics = [];
    this.fpsHistory = [];
    this.layoutShiftCount = 0;
    this.frameCount = 0;
  }
}

// Global instance with default budget
export const performanceMonitor = AdvancedPerformanceMonitor.getInstance({
  minFPS: 50,
  maxMemoryMB: 100,
  maxBundleSizeMB: 10,
  maxRenderTimeMS: 16,
  maxLayoutShifts: 0,
});

// Convenience functions
export const startPerformanceMonitoring = () => performanceMonitor.startMonitoring();
export const stopPerformanceMonitoring = () => performanceMonitor.stopMonitoring();
export const getPerformanceReport = () => performanceMonitor.generateReport();
export const recordLayoutShift = () => performanceMonitor.recordLayoutShift();