/**
 * OnboardingPerformanceService Tests
 * 
 * Tests for performance monitoring, metrics collection, and optimization recommendations
 */

import { OnboardingPerformanceService } from '../OnboardingPerformanceService';

// Mock logging
jest.mock('../../lib/logging', () => ({
  logInfo: jest.fn(),
  logError: jest.fn()
}));

// Mock analytics
jest.mock('../../lib/analytics', () => ({
  trackEvent: jest.fn()
}));

// Mock performance API
const mockPerformanceObserver = jest.fn();
global.PerformanceObserver = mockPerformanceObserver as any;
global.performance = {
  now: jest.fn(() => Date.now()),
  memory: {
    usedJSHeapSize: 50 * 1024 * 1024, // 50MB
    totalJSHeapSize: 100 * 1024 * 1024, // 100MB
    jsHeapSizeLimit: 512 * 1024 * 1024 // 512MB
  }
} as any;

describe('OnboardingPerformanceService', () => {
  let performanceService: OnboardingPerformanceService;

  beforeEach(() => {
    performanceService = OnboardingPerformanceService.getInstance();
    
    // Clear all mocks
    jest.clearAllMocks();
    
    // Clear service data
    (performanceService as any).metrics = [];
    (performanceService as any).memorySnapshots = [];
    (performanceService as any).networkMetrics = [];
    (performanceService as any).animationMetrics = [];
    (performanceService as any).bundleMetrics = [];
    (performanceService as any).stepStartTimes.clear();
    (performanceService as any).isMonitoring = false;
  });

  describe('Monitoring Control', () => {
    it('should start monitoring and initialize subsystems', () => {
      const { logInfo } = require('../../lib/logging');
      
      performanceService.startMonitoring();

      expect((performanceService as any).isMonitoring).toBe(true);
      expect(logInfo).toHaveBeenCalledWith('Onboarding Performance: Monitoring started');
    });

    it('should stop monitoring and cleanup', () => {
      const { logInfo } = require('../../lib/logging');
      
      performanceService.startMonitoring();
      performanceService.stopMonitoring();

      expect((performanceService as any).isMonitoring).toBe(false);
      expect(logInfo).toHaveBeenCalledWith('Onboarding Performance: Monitoring stopped');
    });

    it('should not start monitoring if already monitoring', () => {
      const { logInfo } = require('../../lib/logging');
      
      performanceService.startMonitoring();
      logInfo.mockClear();
      
      performanceService.startMonitoring(); // Second call

      expect(logInfo).not.toHaveBeenCalled();
    });
  });

  describe('Step Performance Tracking', () => {
    it('should track step start time', () => {
      const { trackEvent } = require('../../lib/analytics');
      
      performanceService.trackStepStart(1);

      const stepStartTimes = (performanceService as any).stepStartTimes;
      expect(stepStartTimes.has(1)).toBe(true);
      expect(stepStartTimes.get(1)).toBeGreaterThan(0);

      expect(trackEvent).toHaveBeenCalledWith('onboarding_step_performance', 
        expect.objectContaining({
          step: 1,
          memoryUsed: expect.any(Number)
        })
      );
    });

    it('should track step completion with duration', () => {
      const mockNow = jest.spyOn(performance, 'now');
      mockNow.mockReturnValueOnce(1000).mockReturnValueOnce(3000);

      performanceService.trackStepStart(2);
      performanceService.trackStepCompletion(2);

      const metrics = (performanceService as any).metrics;
      const completionMetric = metrics.find((m: any) => 
        m.name === 'step_completion_time' && m.step === 2
      );

      expect(completionMetric).toBeDefined();
      expect(completionMetric.value).toBe(2000); // 3000 - 1000
      expect(completionMetric.unit).toBe('ms');
      expect(completionMetric.metadata.duration_seconds).toBe(2);

      // Check that start time is cleared
      const stepStartTimes = (performanceService as any).stepStartTimes;
      expect(stepStartTimes.has(2)).toBe(false);
    });

    it('should handle completion without start time', () => {
      performanceService.trackStepCompletion(3);

      const metrics = (performanceService as any).metrics;
      const completionMetric = metrics.find((m: any) => 
        m.name === 'step_completion_time' && m.step === 3
      );

      expect(completionMetric).toBeUndefined();
    });
  });

  describe('Component Loading Tracking', () => {
    it('should track component load time', () => {
      performanceService.trackComponentLoad('RoleSelection', 1500, 1, 25000, false);

      const bundleMetrics = (performanceService as any).bundleMetrics;
      const metrics = (performanceService as any).metrics;

      expect(bundleMetrics).toHaveLength(1);
      expect(bundleMetrics[0]).toEqual({
        component: 'RoleSelection',
        loadTime: 1500,
        size: 25000,
        cached: false,
        step: 1,
        timestamp: expect.any(Date)
      });

      const loadMetric = metrics.find((m: any) => m.name === 'component_load_time');
      expect(loadMetric).toBeDefined();
      expect(loadMetric.value).toBe(1500);
      expect(loadMetric.metadata.component).toBe('RoleSelection');
    });

    it('should limit bundle metrics to 100 entries', () => {
      // Add more than 100 bundle metrics
      for (let i = 0; i < 150; i++) {
        performanceService.trackComponentLoad(`Component${i}`, 1000, 1);
      }

      const bundleMetrics = (performanceService as any).bundleMetrics;
      expect(bundleMetrics).toHaveLength(100);
      
      // Should keep the most recent entries
      expect(bundleMetrics[0].component).toBe('Component50');
      expect(bundleMetrics[99].component).toBe('Component149');
    });
  });

  describe('Animation Performance Tracking', () => {
    it('should track animation performance metrics', () => {
      performanceService.trackAnimationPerformance('step-transition', 58, 2, 500, 2);

      const animationMetrics = (performanceService as any).animationMetrics;
      const metrics = (performanceService as any).metrics;

      expect(animationMetrics).toHaveLength(1);
      expect(animationMetrics[0]).toEqual({
        name: 'step-transition',
        frameRate: 58,
        droppedFrames: 2,
        duration: 500,
        step: 2,
        timestamp: expect.any(Date)
      });

      const animationMetric = metrics.find((m: any) => m.name === 'animation_performance');
      expect(animationMetric).toBeDefined();
      expect(animationMetric.value).toBe(58);
      expect(animationMetric.metadata.droppedFrames).toBe(2);
    });

    it('should record performance alert for poor animation', () => {
      performanceService.trackAnimationPerformance('slow-animation', 25, 8, 1000, 3);

      const metrics = (performanceService as any).metrics;
      const alertMetric = metrics.find((m: any) => m.name === 'performance_alert');

      expect(alertMetric).toBeDefined();
      expect(alertMetric.metadata.alertType).toBe('poor_animation_performance');
      expect(alertMetric.metadata.animation).toBe('slow-animation');
      expect(alertMetric.metadata.frameRate).toBe(25);
    });

    it('should limit animation metrics to 50 entries', () => {
      for (let i = 0; i < 75; i++) {
        performanceService.trackAnimationPerformance(`animation${i}`, 60, 0, 100, 1);
      }

      const animationMetrics = (performanceService as any).animationMetrics;
      expect(animationMetrics).toHaveLength(50);
    });
  });

  describe('Network Request Tracking', () => {
    it('should track network request performance', () => {
      performanceService.trackNetworkRequest('/api/profile', 'POST', 2500, 1024, 200, 5);

      const networkMetrics = (performanceService as any).networkMetrics;
      const metrics = (performanceService as any).metrics;

      expect(networkMetrics).toHaveLength(1);
      expect(networkMetrics[0]).toEqual({
        url: '/api/profile',
        method: 'POST',
        duration: 2500,
        size: 1024,
        status: 200,
        step: 5,
        timestamp: expect.any(Date)
      });

      const networkMetric = metrics.find((m: any) => m.name === 'network_request_time');
      expect(networkMetric).toBeDefined();
      expect(networkMetric.value).toBe(2500);
      expect(networkMetric.metadata.status).toBe(200);
    });

    it('should record alert for slow network requests', () => {
      performanceService.trackNetworkRequest('/api/slow', 'GET', 6000, 2048, 200, 3);

      const metrics = (performanceService as any).metrics;
      const alertMetric = metrics.find((m: any) => m.name === 'performance_alert');

      expect(alertMetric).toBeDefined();
      expect(alertMetric.metadata.alertType).toBe('slow_network_request');
      expect(alertMetric.metadata.duration).toBe(6000);
    });

    it('should limit network metrics to 100 entries', () => {
      for (let i = 0; i < 150; i++) {
        performanceService.trackNetworkRequest(`/api/request${i}`, 'GET', 1000, 512, 200, 1);
      }

      const networkMetrics = (performanceService as any).networkMetrics;
      expect(networkMetrics).toHaveLength(100);
    });
  });

  describe('Performance Summary', () => {
    beforeEach(() => {
      // Set up test data
      const metrics = (performanceService as any).metrics;
      const networkMetrics = (performanceService as any).networkMetrics;
      const animationMetrics = (performanceService as any).animationMetrics;
      const bundleMetrics = (performanceService as any).bundleMetrics;
      const memorySnapshots = (performanceService as any).memorySnapshots;

      // Add step completion metrics
      metrics.push(
        { name: 'step_completion_time', value: 5000, step: 1, timestamp: new Date() },
        { name: 'step_completion_time', value: 8000, step: 2, timestamp: new Date() },
        { name: 'step_completion_time', value: 3000, step: 3, timestamp: new Date() }
      );

      // Add network metrics
      networkMetrics.push(
        { url: '/api/1', method: 'GET', duration: 1000, size: 512, status: 200, step: 1, timestamp: new Date() },
        { url: '/api/2', method: 'POST', duration: 2000, size: 1024, status: 201, step: 2, timestamp: new Date() }
      );

      // Add animation metrics
      animationMetrics.push(
        { name: 'anim1', frameRate: 60, droppedFrames: 0, duration: 500, step: 1, timestamp: new Date() },
        { name: 'anim2', frameRate: 25, droppedFrames: 5, duration: 1000, step: 2, timestamp: new Date() }
      );

      // Add bundle metrics
      bundleMetrics.push(
        { component: 'Component1', loadTime: 1500, size: 25000, cached: false, step: 1, timestamp: new Date() },
        { component: 'Component2', loadTime: 800, size: 15000, cached: true, step: 2, timestamp: new Date() }
      );

      // Add memory snapshots
      memorySnapshots.push(
        { used: 45 * 1024 * 1024, total: 100 * 1024 * 1024, step: 1, timestamp: new Date() },
        { used: 52 * 1024 * 1024, total: 100 * 1024 * 1024, step: 2, timestamp: new Date() }
      );
    });

    it('should calculate step performance summary', () => {
      const summary = performanceService.getStepPerformanceSummary(1);

      expect(summary.completionTime).toBe(5000);
      expect(summary.memoryUsage).toBe(45 * 1024 * 1024);
      expect(summary.networkRequests).toBe(1);
      expect(summary.animationIssues).toBe(0); // 60fps, no issues
      expect(summary.componentLoads).toBe(1);
    });

    it('should identify animation issues in summary', () => {
      const summary = performanceService.getStepPerformanceSummary(2);

      expect(summary.animationIssues).toBe(1); // 25fps < 30fps threshold
    });

    it('should calculate overall performance metrics', () => {
      const metrics = performanceService.getOverallPerformanceMetrics();

      expect(metrics.averageStepTime).toBe(5333.333333333333); // (5000 + 8000 + 3000) / 3
      expect(metrics.totalMemoryUsage).toBe(52 * 1024 * 1024); // Latest snapshot
      expect(metrics.networkRequestCount).toBe(2);
      expect(metrics.slowAnimationsCount).toBe(1); // One animation with 25fps
      expect(metrics.performanceAlerts).toBe(0); // No alert metrics in test data
    });
  });

  describe('Performance Recommendations', () => {
    beforeEach(() => {
      // Set up test data for recommendations
      const memorySnapshots = (performanceService as any).memorySnapshots;
      const networkMetrics = (performanceService as any).networkMetrics;
      const animationMetrics = (performanceService as any).animationMetrics;
      const bundleMetrics = (performanceService as any).bundleMetrics;

      // High memory usage
      memorySnapshots.push({
        used: 150 * 1024 * 1024, // 150MB > 100MB threshold
        total: 200 * 1024 * 1024,
        step: 1,
        timestamp: new Date()
      });

      // Slow network request
      networkMetrics.push({
        url: '/api/slow',
        method: 'GET',
        duration: 4000, // > 3000ms threshold
        size: 1024,
        status: 200,
        step: 2,
        timestamp: new Date()
      });

      // Poor animation
      animationMetrics.push({
        name: 'slow-animation',
        frameRate: 25, // < 30fps threshold
        droppedFrames: 3,
        duration: 1000,
        step: 3,
        timestamp: new Date()
      });

      // Slow bundle loading
      bundleMetrics.push({
        component: 'SlowComponent',
        loadTime: 2500, // > 2000ms threshold
        size: 50000,
        cached: false,
        step: 4,
        timestamp: new Date()
      });
    });

    it('should generate memory usage recommendations', () => {
      const recommendations = performanceService.getPerformanceRecommendations();

      const memoryRec = recommendations.find(r => r.type === 'memory');
      expect(memoryRec).toBeDefined();
      expect(memoryRec!.severity).toBe('high');
      expect(memoryRec!.message).toContain('High memory usage detected');
      expect(memoryRec!.step).toBe(1);
    });

    it('should generate network performance recommendations', () => {
      const recommendations = performanceService.getPerformanceRecommendations();

      const networkRec = recommendations.find(r => r.type === 'network');
      expect(networkRec).toBeDefined();
      expect(networkRec!.severity).toBe('medium');
      expect(networkRec!.message).toContain('Slow network requests detected');
      expect(networkRec!.step).toBe(2);
    });

    it('should generate animation performance recommendations', () => {
      const recommendations = performanceService.getPerformanceRecommendations();

      const animationRec = recommendations.find(r => r.type === 'animation');
      expect(animationRec).toBeDefined();
      expect(animationRec!.severity).toBe('medium');
      expect(animationRec!.message).toContain('Poor animation performance detected');
      expect(animationRec!.step).toBe(3);
    });

    it('should generate bundle loading recommendations', () => {
      const recommendations = performanceService.getPerformanceRecommendations();

      const bundleRec = recommendations.find(r => r.type === 'bundle');
      expect(bundleRec).toBeDefined();
      expect(bundleRec!.severity).toBe('low');
      expect(bundleRec!.message).toContain('Slow component loading detected');
      expect(bundleRec!.step).toBe(4);
    });

    it('should return empty recommendations for good performance', () => {
      // Clear test data and add good performance data
      (performanceService as any).memorySnapshots = [{
        used: 30 * 1024 * 1024, // Low memory usage
        total: 100 * 1024 * 1024,
        step: 1,
        timestamp: new Date()
      }];

      (performanceService as any).networkMetrics = [{
        url: '/api/fast',
        method: 'GET',
        duration: 500, // Fast request
        size: 1024,
        status: 200,
        step: 1,
        timestamp: new Date()
      }];

      (performanceService as any).animationMetrics = [{
        name: 'smooth-animation',
        frameRate: 60, // Good frame rate
        droppedFrames: 0,
        duration: 500,
        step: 1,
        timestamp: new Date()
      }];

      (performanceService as any).bundleMetrics = [{
        component: 'FastComponent',
        loadTime: 800, // Fast loading
        size: 15000,
        cached: true,
        step: 1,
        timestamp: new Date()
      }];

      const recommendations = performanceService.getPerformanceRecommendations();
      expect(recommendations).toHaveLength(0);
    });
  });

  describe('Data Management', () => {
    it('should clear all performance data', () => {
      const { logInfo } = require('../../lib/logging');
      
      // Add some test data
      performanceService.trackStepStart(1);
      performanceService.trackComponentLoad('TestComponent', 1000, 1);
      performanceService.trackAnimationPerformance('test-anim', 60, 0, 500, 1);

      performanceService.clearData();

      expect((performanceService as any).metrics).toHaveLength(0);
      expect((performanceService as any).memorySnapshots).toHaveLength(0);
      expect((performanceService as any).networkMetrics).toHaveLength(0);
      expect((performanceService as any).animationMetrics).toHaveLength(0);
      expect((performanceService as any).bundleMetrics).toHaveLength(0);
      expect((performanceService as any).stepStartTimes.size).toBe(0);

      expect(logInfo).toHaveBeenCalledWith('Onboarding Performance: Data cleared');
    });

    it('should limit metrics to 500 entries', () => {
      // Add more than 500 metrics
      for (let i = 0; i < 600; i++) {
        (performanceService as any).recordMetric({
          name: 'test_metric',
          value: i,
          unit: 'count',
          timestamp: new Date(),
          metadata: { index: i }
        });
      }

      const metrics = (performanceService as any).metrics;
      expect(metrics).toHaveLength(500);
      
      // Should keep the most recent entries
      expect(metrics[0].metadata.index).toBe(100);
      expect(metrics[499].metadata.index).toBe(599);
    });
  });

  describe('Performance Alerts', () => {
    it('should record alert for slow step completion', () => {
      const mockNow = jest.spyOn(performance, 'now');
      mockNow.mockReturnValueOnce(1000).mockReturnValueOnce(32000); // 31 second duration

      performanceService.trackStepStart(1);
      performanceService.trackStepCompletion(1);

      const metrics = (performanceService as any).metrics;
      const alertMetric = metrics.find((m: any) => m.name === 'performance_alert');

      expect(alertMetric).toBeDefined();
      expect(alertMetric.metadata.alertType).toBe('slow_step_completion');
      expect(alertMetric.metadata.duration).toBe(31000);
    });

    it('should track alerts in analytics', () => {
      const { trackEvent } = require('../../lib/analytics');
      
      // Trigger a performance alert
      performanceService.trackAnimationPerformance('slow-animation', 20, 10, 2000, 1);

      expect(trackEvent).toHaveBeenCalledWith('onboarding_performance_alert', 
        expect.objectContaining({
          type: 'poor_animation_performance',
          animation: 'slow-animation',
          frameRate: 20,
          step: 1
        })
      );
    });
  });
});