/**
 * Performance Utilities Tests
 */
import { renderHook, act } from '@testing-library/react-native';
import {
  PerformanceMonitor,
  performanceMonitor,
  useDebounce,
  useThrottle,
  getOptimizedImageUri,
  measurePerformance,
  measureAsyncPerformance,
} from '../performance';

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

describe('Performance Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('PerformanceMonitor', () => {
    let monitor: PerformanceMonitor;

    beforeEach(() => {
      monitor = PerformanceMonitor.getInstance();
    });

    it('creates singleton instance', () => {
      const instance1 = PerformanceMonitor.getInstance();
      const instance2 = PerformanceMonitor.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('starts and stops monitoring', () => {
      expect(monitor.getCurrentFPS()).toBe(60);

      monitor.startMonitoring();
      expect(requestAnimationFrame).toHaveBeenCalled();

      monitor.stopMonitoring();
    });

    it('calculates FPS correctly', () => {
      monitor.startMonitoring();

      // Simulate frame measurements
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(monitor.getCurrentFPS()).toBeGreaterThan(0);
    });
  });

  describe('useDebounce', () => {
    it('debounces function calls', () => {
      const mockFn = jest.fn();
      const { result } = renderHook(() => useDebounce(mockFn, 100));

      // Call multiple times quickly
      act(() => {
        result.current('arg1');
        result.current('arg2');
        result.current('arg3');
      });

      // Should not have been called yet
      expect(mockFn).not.toHaveBeenCalled();

      // Advance timers
      act(() => {
        jest.advanceTimersByTime(100);
      });

      // Should have been called once with the last arguments
      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('arg3');
    });

    it('cancels previous calls', () => {
      const mockFn = jest.fn();
      const { result } = renderHook(() => useDebounce(mockFn, 100));

      act(() => {
        result.current('arg1');
      });

      act(() => {
        jest.advanceTimersByTime(50);
      });

      act(() => {
        result.current('arg2');
      });

      act(() => {
        jest.advanceTimersByTime(100);
      });

      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('arg2');
    });
  });

  describe('useThrottle', () => {
    it('throttles function calls', () => {
      const mockFn = jest.fn();
      const { result } = renderHook(() => useThrottle(mockFn, 100));

      // First call should execute immediately
      act(() => {
        result.current('arg1');
      });

      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('arg1');

      // Subsequent calls within delay should be ignored
      act(() => {
        result.current('arg2');
        result.current('arg3');
      });

      expect(mockFn).toHaveBeenCalledTimes(1);

      // After delay, next call should execute
      act(() => {
        jest.advanceTimersByTime(100);
        result.current('arg4');
      });

      expect(mockFn).toHaveBeenCalledTimes(2);
      expect(mockFn).toHaveBeenLastCalledWith('arg4');
    });
  });

  describe('getOptimizedImageUri', () => {
    it('returns original URI when no options provided', () => {
      const originalUri = 'https://example.com/image.jpg';
      const result = getOptimizedImageUri(originalUri);
      expect(result).toBe(originalUri);
    });

    it('handles optimization options', () => {
      const originalUri = 'https://example.com/image.jpg';
      const result = getOptimizedImageUri(originalUri, {
        width: 300,
        height: 200,
        quality: 80,
        format: 'webp',
      });
      
      // For now, it returns the original URI
      // In a real implementation, this would transform the URI
      expect(result).toBe(originalUri);
    });
  });

  describe('measurePerformance', () => {
    it('measures synchronous function performance', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      mockPerformance.now
        .mockReturnValueOnce(100)
        .mockReturnValueOnce(150);

      const testFn = jest.fn(() => 'result');
      const result = measurePerformance('test function', testFn);

      expect(result).toBe('result');
      expect(testFn).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith('⚡ test function took 50.00ms');

      consoleSpy.mockRestore();
    });
  });

  describe('measureAsyncPerformance', () => {
    it('measures asynchronous function performance', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      mockPerformance.now
        .mockReturnValueOnce(100)
        .mockReturnValueOnce(200);

      const testFn = jest.fn(() => Promise.resolve('async result'));
      const result = await measureAsyncPerformance('async test', testFn);

      expect(result).toBe('async result');
      expect(testFn).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith('⚡ async test took 100.00ms');

      consoleSpy.mockRestore();
    });
  });

  describe('performanceMonitor singleton', () => {
    it('exports singleton instance', () => {
      expect(performanceMonitor).toBeInstanceOf(PerformanceMonitor);
      expect(performanceMonitor).toBe(PerformanceMonitor.getInstance());
    });
  });
});