/**
 * Performance Monitoring Tests
 */
import {
  AdvancedPerformanceMonitor,
  performanceMonitor,
  startPerformanceMonitoring,
  stopPerformanceMonitoring,
  getPerformanceReport,
  recordLayoutShift,
  type PerformanceMetrics,
  type PerformanceBudget,
} from '../performanceMonitoring';

// Mock performance API
const mockPerformance = {
  now: jest.fn(() => Date.now()),
  memory: {
    usedJSHeapSize: 50 * 1024 * 1024, // 50MB
    totalJSHeapSize: 100 * 1024 * 1024, // 100MB
  },
};

Object.defineProperty(global, 'performance', {
  value: mockPerformance,
  writable: true,
});

// Mock requestAnimationFrame
global.requestAnimationFrame = jest.fn((cb) => setTimeout(cb, 16));

describe('Performance Monitoring', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('AdvancedPerformanceMonitor', () => {
    let monitor: AdvancedPerformanceMonitor;

    beforeEach(() => {
      monitor = new AdvancedPerformanceMonitor({
        minFPS: 50,
        maxMemoryMB: 100,
        maxRenderTimeMS: 16,
      });
    });

    it('creates instance with default budget', () => {
      const defaultMonitor = new AdvancedPerformanceMonitor();
      const budget = defaultMonitor.getBudget();
      
      expect(budget.minFPS).toBe(50);
      expect(budget.maxMemoryMB).toBe(100);
      expect(budget.maxBundleSizeMB).toBe(10);
    });

    it('creates singleton instance', () => {
      const instance1 = AdvancedPerformanceMonitor.getInstance();
      const instance2 = AdvancedPerformanceMonitor.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('starts and stops monitoring', () => {
      monitor.startMonitoring();
      expect(requestAnimationFrame).toHaveBeenCalled();

      monitor.stopMonitoring();
    });

    it('records layout shifts', () => {
      monitor.recordLayoutShift();
      monitor.recordLayoutShift();
      
      // Layout shifts should be tracked internally
      expect(() => monitor.recordLayoutShift()).not.toThrow();
    });

    it('updates budget', () => {
      const newBudget = { minFPS: 60, maxMemoryMB: 200 };
      monitor.updateBudget(newBudget);
      
      const budget = monitor.getBudget();
      expect(budget.minFPS).toBe(60);
      expect(budget.maxMemoryMB).toBe(200);
    });

    it('generates performance report', () => {
      const report = monitor.generateReport();
      expect(typeof report).toBe('string');
      expect(report).toContain('Performance Report');
    });

    it('resets metrics', () => {
      monitor.recordLayoutShift();
      monitor.reset();
      
      const metrics = monitor.getMetrics();
      expect(metrics).toHaveLength(0);
    });

    it('returns latest metrics', () => {
      const latest = monitor.getLatestMetrics();
      // Should be null initially
      expect(latest).toBeNull();
    });

    it('handles memory monitoring', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      // Mock high memory usage
      mockPerformance.memory.usedJSHeapSize = 150 * 1024 * 1024; // 150MB
      
      monitor.startMonitoring();
      
      // Advance timers to trigger memory check
      jest.advanceTimersByTime(5000);
      
      monitor.stopMonitoring();
      consoleSpy.mockRestore();
    });
  });

  describe('Global Performance Monitor', () => {
    it('exports singleton instance', () => {
      expect(performanceMonitor).toBeInstanceOf(AdvancedPerformanceMonitor);
    });

    it('provides convenience functions', () => {
      expect(typeof startPerformanceMonitoring).toBe('function');
      expect(typeof stopPerformanceMonitoring).toBe('function');
      expect(typeof getPerformanceReport).toBe('function');
      expect(typeof recordLayoutShift).toBe('function');
    });

    it('starts monitoring via convenience function', () => {
      const spy = jest.spyOn(performanceMonitor, 'startMonitoring');
      
      startPerformanceMonitoring();
      
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });

    it('stops monitoring via convenience function', () => {
      const spy = jest.spyOn(performanceMonitor, 'stopMonitoring');
      
      stopPerformanceMonitoring();
      
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });

    it('generates report via convenience function', () => {
      const spy = jest.spyOn(performanceMonitor, 'generateReport');
      
      getPerformanceReport();
      
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });

    it('records layout shift via convenience function', () => {
      const spy = jest.spyOn(performanceMonitor, 'recordLayoutShift');
      
      recordLayoutShift();
      
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });
  });

  describe('Budget Violations', () => {
    let monitor: AdvancedPerformanceMonitor;
    let consoleSpy: jest.SpyInstance;

    beforeEach(() => {
      monitor = new AdvancedPerformanceMonitor({
        minFPS: 60,
        maxMemoryMB: 50,
        maxRenderTimeMS: 10,
      });
      consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    it('detects FPS violations', () => {
      // Mock low FPS scenario
      mockPerformance.now
        .mockReturnValueOnce(0)
        .mockReturnValueOnce(100); // 100ms frame = 10 FPS
      
      monitor.startMonitoring();
      
      // Simulate frame measurement
      jest.advanceTimersByTime(1000);
      
      monitor.stopMonitoring();
    });

    it('detects memory violations', () => {
      // Mock high memory usage
      mockPerformance.memory.usedJSHeapSize = 60 * 1024 * 1024; // 60MB > 50MB budget
      
      monitor.startMonitoring();
      
      // Advance timers to trigger memory check
      jest.advanceTimersByTime(5000);
      
      monitor.stopMonitoring();
    });
  });
});