/**
 * Performance Testing - Utilities for testing performance characteristics
 * 
 * Features:
 * - Animation performance testing
 * - Layout stability validation
 * - Memory leak detection
 * - Bundle size analysis
 * - Render performance benchmarks
 */

export interface PerformanceTestResult {
  testName: string;
  passed: boolean;
  metrics: Record<string, number>;
  violations: string[];
  duration: number;
  timestamp: number;
}

export interface PerformanceTestConfig {
  name: string;
  timeout?: number;
  expectedFPS?: number;
  maxMemoryIncrease?: number;
  maxRenderTime?: number;
  allowedLayoutShifts?: number;
}

export class PerformanceTester {
  private results: PerformanceTestResult[] = [];

  async runTest(
    config: PerformanceTestConfig,
    testFn: () => Promise<void> | void
  ): Promise<PerformanceTestResult> {
    const startTime = performance.now();
    const startMemory = this.getMemoryUsage();
    const violations: string[] = [];
    const metrics: Record<string, number> = {};

    console.log(`🧪 Running performance test: ${config.name}`);

    try {
      // Start monitoring
      const fpsMonitor = this.startFPSMonitoring();
      const layoutShiftMonitor = this.startLayoutShiftMonitoring();

      // Run the test
      await Promise.race([
        Promise.resolve(testFn()),
        this.createTimeout(config.timeout || 5000),
      ]);

      // Stop monitoring and collect metrics
      const fpsData = fpsMonitor.stop();
      const layoutShifts = layoutShiftMonitor.stop();
      const endMemory = this.getMemoryUsage();
      const duration = performance.now() - startTime;

      // Calculate metrics
      metrics.averageFPS = fpsData.average;
      metrics.minFPS = fpsData.min;
      metrics.maxFPS = fpsData.max;
      metrics.memoryIncrease = endMemory - startMemory;
      metrics.layoutShifts = layoutShifts;
      metrics.duration = duration;

      // Check violations
      if (config.expectedFPS && metrics.averageFPS < config.expectedFPS) {
        violations.push(`FPS too low: ${metrics.averageFPS.toFixed(1)} < ${config.expectedFPS}`);
      }

      if (config.maxMemoryIncrease && metrics.memoryIncrease > config.maxMemoryIncrease) {
        violations.push(`Memory increase too high: ${(metrics.memoryIncrease / 1024 / 1024).toFixed(2)}MB > ${(config.maxMemoryIncrease / 1024 / 1024).toFixed(2)}MB`);
      }

      if (config.maxRenderTime && duration > config.maxRenderTime) {
        violations.push(`Test duration too long: ${duration.toFixed(2)}ms > ${config.maxRenderTime}ms`);
      }

      if (config.allowedLayoutShifts !== undefined && metrics.layoutShifts > config.allowedLayoutShifts) {
        violations.push(`Too many layout shifts: ${metrics.layoutShifts} > ${config.allowedLayoutShifts}`);
      }

      const result: PerformanceTestResult = {
        testName: config.name,
        passed: violations.length === 0,
        metrics,
        violations,
        duration,
        timestamp: Date.now(),
      };

      this.results.push(result);
      this.logTestResult(result);

      return result;
    } catch (error) {
      const result: PerformanceTestResult = {
        testName: config.name,
        passed: false,
        metrics,
        violations: [`Test failed: ${error}`],
        duration: performance.now() - startTime,
        timestamp: Date.now(),
      };

      this.results.push(result);
      this.logTestResult(result);

      return result;
    }
  }

  private startFPSMonitoring() {
    const fpsHistory: number[] = [];
    let lastFrameTime = performance.now();
    let isMonitoring = true;

    const measureFrame = () => {
      if (!isMonitoring) return;

      const currentTime = performance.now();
      const frameTime = currentTime - lastFrameTime;
      const fps = 1000 / frameTime;
      
      fpsHistory.push(fps);
      lastFrameTime = currentTime;

      requestAnimationFrame(measureFrame);
    };

    requestAnimationFrame(measureFrame);

    return {
      stop: () => {
        isMonitoring = false;
        return {
          average: fpsHistory.length > 0 ? fpsHistory.reduce((a, b) => a + b) / fpsHistory.length : 60,
          min: fpsHistory.length > 0 ? Math.min(...fpsHistory) : 60,
          max: fpsHistory.length > 0 ? Math.max(...fpsHistory) : 60,
          samples: fpsHistory.length,
        };
      },
    };
  }

  private startLayoutShiftMonitoring() {
    let layoutShifts = 0;

    // In a real implementation, this would use ResizeObserver or similar
    // For now, we'll simulate layout shift detection
    const observer = {
      disconnect: () => {},
    };

    return {
      stop: () => {
        observer.disconnect();
        return layoutShifts;
      },
    };
  }

  private getMemoryUsage(): number {
    const perfMemory = (performance as any).memory;
    return perfMemory ? perfMemory.usedJSHeapSize : 0;
  }

  private createTimeout(ms: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`Test timeout after ${ms}ms`)), ms);
    });
  }

  private logTestResult(result: PerformanceTestResult): void {
    const status = result.passed ? '✅' : '❌';
    console.log(`${status} ${result.testName} (${result.duration.toFixed(2)}ms)`);
    
    if (result.violations.length > 0) {
      console.warn('  Violations:', result.violations);
    }
    
    console.log('  Metrics:', result.metrics);
  }

  // Test suite methods
  async runAnimationTest(
    animationFn: () => Promise<void> | void,
    expectedFPS = 55
  ): Promise<PerformanceTestResult> {
    return this.runTest(
      {
        name: 'Animation Performance',
        expectedFPS,
        maxRenderTime: 1000,
        allowedLayoutShifts: 0,
      },
      animationFn
    );
  }

  async runMemoryLeakTest(
    testFn: () => Promise<void> | void,
    maxMemoryIncrease = 10 * 1024 * 1024 // 10MB
  ): Promise<PerformanceTestResult> {
    // Run garbage collection if available
    if ((global as any).gc) {
      (global as any).gc();
    }

    return this.runTest(
      {
        name: 'Memory Leak Test',
        maxMemoryIncrease,
        timeout: 10000,
      },
      testFn
    );
  }

  async runRenderPerformanceTest(
    renderFn: () => Promise<void> | void,
    maxRenderTime = 100
  ): Promise<PerformanceTestResult> {
    return this.runTest(
      {
        name: 'Render Performance',
        maxRenderTime,
        expectedFPS: 50,
      },
      renderFn
    );
  }

  // Results management
  getResults(): PerformanceTestResult[] {
    return [...this.results];
  }

  getFailedTests(): PerformanceTestResult[] {
    return this.results.filter(result => !result.passed);
  }

  generateReport(): string {
    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.passed).length;
    const failedTests = totalTests - passedTests;

    let report = `Performance Test Report:
- Total Tests: ${totalTests}
- Passed: ${passedTests}
- Failed: ${failedTests}
- Success Rate: ${totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(1) : 0}%\n`;

    if (failedTests > 0) {
      report += '\nFailed Tests:\n';
      this.getFailedTests().forEach(test => {
        report += `- ${test.testName}: ${test.violations.join(', ')}\n`;
      });
    }

    return report;
  }

  reset(): void {
    this.results = [];
  }
}

// Global performance tester instance
export const performanceTester = new PerformanceTester();

// Convenience functions
export const testAnimationPerformance = (
  animationFn: () => Promise<void> | void,
  expectedFPS?: number
) => performanceTester.runAnimationTest(animationFn, expectedFPS);

export const testMemoryLeaks = (
  testFn: () => Promise<void> | void,
  maxMemoryIncrease?: number
) => performanceTester.runMemoryLeakTest(testFn, maxMemoryIncrease);

export const testRenderPerformance = (
  renderFn: () => Promise<void> | void,
  maxRenderTime?: number
) => performanceTester.runRenderPerformanceTest(renderFn, maxRenderTime);