/**
 * OnboardingABTestService Tests
 * 
 * Tests for A/B testing functionality, statistical analysis, and variant assignment
 */

import { OnboardingABTestService, ABTest, ABTestVariant } from '../OnboardingABTestService';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn()
}));

// Mock logging
jest.mock('../../lib/logging', () => ({
  logInfo: jest.fn(),
  logError: jest.fn()
}));

// Mock analytics
jest.mock('../../lib/analytics', () => ({
  trackEvent: jest.fn()
}));

describe('OnboardingABTestService', () => {
  let abTestService: OnboardingABTestService;
  let mockTest: Omit<ABTest, 'id'>;

  beforeEach(() => {
    abTestService = OnboardingABTestService.getInstance();
    
    // Clear all mocks
    jest.clearAllMocks();
    
    // Clear service data
    (abTestService as any).tests.clear();
    (abTestService as any).assignments.clear();
    (abTestService as any).results = [];

    // Mock test configuration
    mockTest = {
      name: 'Onboarding Flow Test',
      description: 'Test simplified vs detailed flow',
      hypothesis: 'Simplified flow will increase completion rates',
      variants: [
        {
          id: 'control',
          name: 'Standard Flow',
          description: 'Current onboarding flow',
          allocation: 50,
          config: { stepCount: 11 },
          isControl: true
        },
        {
          id: 'simplified',
          name: 'Simplified Flow',
          description: 'Reduced step flow',
          allocation: 50,
          config: { stepCount: 8 },
          isControl: false
        }
      ],
      trafficAllocation: 100,
      startDate: new Date(Date.now() - 86400000), // Yesterday
      isActive: true,
      targetMetrics: ['completion_rate', 'time_to_complete'],
      minimumSampleSize: 100,
      confidenceLevel: 0.95
    };
  });

  describe('Test Creation', () => {
    it('should create a new A/B test', () => {
      const { trackEvent } = require('../../lib/analytics');
      const { logInfo } = require('../../lib/logging');
      
      const testId = abTestService.createTest(mockTest);

      expect(testId).toMatch(/^test_\d+_[a-z0-9]+$/);
      expect(trackEvent).toHaveBeenCalledWith('ab_test_created', {
        testId,
        name: mockTest.name,
        variantCount: 2
      });
      expect(logInfo).toHaveBeenCalledWith('AB Test created', {
        testId,
        name: mockTest.name
      });

      const tests = (abTestService as any).tests;
      expect(tests.has(testId)).toBe(true);
      expect(tests.get(testId).name).toBe(mockTest.name);
    });

    it('should generate unique test IDs', () => {
      const testId1 = abTestService.createTest(mockTest);
      const testId2 = abTestService.createTest({ ...mockTest, name: 'Test 2' });

      expect(testId1).not.toBe(testId2);
    });
  });

  describe('User Assignment', () => {
    let testId: string;

    beforeEach(() => {
      testId = abTestService.createTest(mockTest);
    });

    it('should assign user to variant based on hash', () => {
      const { trackEvent } = require('../../lib/analytics');
      
      const variant = abTestService.assignUserToTest(testId, 'user123', 'session456');

      expect(variant).toBeDefined();
      expect(['control', 'simplified']).toContain(variant);
      
      expect(trackEvent).toHaveBeenCalledWith('ab_test_assigned', {
        testId,
        variantId: variant,
        userId: 'user123',
        sessionId: 'session456'
      });

      // Check assignment is stored
      const assignments = (abTestService as any).assignments;
      expect(assignments.has(`${testId}:user123`)).toBe(true);
    });

    it('should return same variant for same user', () => {
      const variant1 = abTestService.assignUserToTest(testId, 'user123');
      const variant2 = abTestService.assignUserToTest(testId, 'user123');

      expect(variant1).toBe(variant2);
    });

    it('should return null for inactive test', () => {
      // Deactivate test
      const tests = (abTestService as any).tests;
      const test = tests.get(testId);
      test.isActive = false;

      const variant = abTestService.assignUserToTest(testId, 'user123');

      expect(variant).toBeNull();
    });

    it('should return null for test outside date range', () => {
      // Set test to future date
      const tests = (abTestService as any).tests;
      const test = tests.get(testId);
      test.startDate = new Date(Date.now() + 86400000); // Tomorrow

      const variant = abTestService.assignUserToTest(testId, 'user123');

      expect(variant).toBeNull();
    });

    it('should return null for ended test', () => {
      // Set test end date to past
      const tests = (abTestService as any).tests;
      const test = tests.get(testId);
      test.endDate = new Date(Date.now() - 3600000); // 1 hour ago

      const variant = abTestService.assignUserToTest(testId, 'user123');

      expect(variant).toBeNull();
    });

    it('should respect traffic allocation', () => {
      // Set traffic allocation to 0%
      const tests = (abTestService as any).tests;
      const test = tests.get(testId);
      test.trafficAllocation = 0;

      const variant = abTestService.assignUserToTest(testId, 'user123');

      expect(variant).toBeNull();
    });

    it('should assign variants according to allocation percentages', () => {
      const assignments: Record<string, number> = {};
      
      // Test with many users to check distribution
      for (let i = 0; i < 1000; i++) {
        const variant = abTestService.assignUserToTest(testId, `user${i}`);
        if (variant) {
          assignments[variant] = (assignments[variant] || 0) + 1;
        }
      }

      // Should be roughly 50/50 split (allowing for some variance)
      expect(assignments.control).toBeGreaterThan(400);
      expect(assignments.control).toBeLessThan(600);
      expect(assignments.simplified).toBeGreaterThan(400);
      expect(assignments.simplified).toBeLessThan(600);
    });
  });

  describe('Variant Configuration', () => {
    let testId: string;

    beforeEach(() => {
      testId = abTestService.createTest(mockTest);
    });

    it('should return variant configuration', () => {
      const config = abTestService.getVariantConfig(testId, 'control');

      expect(config).toEqual({ stepCount: 11 });
    });

    it('should return null for unknown variant', () => {
      const config = abTestService.getVariantConfig(testId, 'unknown');

      expect(config).toBeNull();
    });

    it('should return null for unknown test', () => {
      const config = abTestService.getVariantConfig('unknown-test', 'control');

      expect(config).toBeNull();
    });
  });

  describe('Conversion Tracking', () => {
    let testId: string;

    beforeEach(() => {
      testId = abTestService.createTest(mockTest);
      abTestService.assignUserToTest(testId, 'user123');
    });

    it('should track conversion for assigned user', () => {
      const { trackEvent } = require('../../lib/analytics');
      const { logInfo } = require('../../lib/logging');
      
      abTestService.trackConversion(testId, 'user123', 'completion', 1, { step: 11 });

      const results = (abTestService as any).results;
      expect(results).toHaveLength(1);
      expect(results[0]).toEqual({
        testId,
        variantId: expect.any(String),
        metric: 'completion',
        value: 1,
        userId: 'user123',
        timestamp: expect.any(Date),
        metadata: { step: 11 }
      });

      expect(trackEvent).toHaveBeenCalledWith('ab_test_conversion', 
        expect.objectContaining({
          testId,
          metric: 'completion',
          value: 1,
          userId: 'user123'
        })
      );
    });

    it('should not track conversion for unassigned user', () => {
      abTestService.trackConversion(testId, 'unassigned-user', 'completion', 1);

      const results = (abTestService as any).results;
      expect(results).toHaveLength(0);
    });
  });

  describe('Statistical Analysis', () => {
    let testId: string;

    beforeEach(() => {
      testId = abTestService.createTest(mockTest);
      
      // Set up test data with conversions
      const assignments = (abTestService as any).assignments;
      const results = (abTestService as any).results;

      // Assign users to variants
      assignments.set(`${testId}:user1`, { testId, variantId: 'control', userId: 'user1', assignedAt: new Date() });
      assignments.set(`${testId}:user2`, { testId, variantId: 'control', userId: 'user2', assignedAt: new Date() });
      assignments.set(`${testId}:user3`, { testId, variantId: 'simplified', userId: 'user3', assignedAt: new Date() });
      assignments.set(`${testId}:user4`, { testId, variantId: 'simplified', userId: 'user4', assignedAt: new Date() });

      // Add conversion results
      results.push(
        { testId, variantId: 'control', metric: 'completion', value: 1, userId: 'user1', timestamp: new Date() },
        { testId, variantId: 'control', metric: 'completion', value: 0, userId: 'user2', timestamp: new Date() },
        { testId, variantId: 'simplified', metric: 'completion', value: 1, userId: 'user3', timestamp: new Date() },
        { testId, variantId: 'simplified', metric: 'completion', value: 1, userId: 'user4', timestamp: new Date() }
      );
    });

    it('should calculate variant statistics', () => {
      const analysis = abTestService.getTestAnalysis(testId, 'completion');

      expect(analysis).toBeDefined();
      expect(analysis!.variants).toHaveLength(2);

      const controlVariant = analysis!.variants.find(v => v.variantId === 'control');
      const simplifiedVariant = analysis!.variants.find(v => v.variantId === 'simplified');

      expect(controlVariant).toBeDefined();
      expect(controlVariant!.sampleSize).toBe(2);
      expect(controlVariant!.mean).toBe(0.5); // 1 conversion out of 2

      expect(simplifiedVariant).toBeDefined();
      expect(simplifiedVariant!.sampleSize).toBe(2);
      expect(simplifiedVariant!.mean).toBe(1); // 2 conversions out of 2
    });

    it('should calculate confidence intervals', () => {
      const analysis = abTestService.getTestAnalysis(testId, 'completion');

      expect(analysis).toBeDefined();
      analysis!.variants.forEach(variant => {
        expect(variant.confidenceInterval).toHaveLength(2);
        expect(variant.confidenceInterval[0]).toBeLessThanOrEqual(variant.mean);
        expect(variant.confidenceInterval[1]).toBeGreaterThanOrEqual(variant.mean);
      });
    });

    it('should return null for test with no results', () => {
      const emptyTestId = abTestService.createTest({ ...mockTest, name: 'Empty Test' });
      const analysis = abTestService.getTestAnalysis(emptyTestId, 'completion');

      expect(analysis).toBeNull();
    });

    it('should return null for unknown test', () => {
      const analysis = abTestService.getTestAnalysis('unknown-test', 'completion');

      expect(analysis).toBeNull();
    });
  });

  describe('Test Management', () => {
    let testId: string;

    beforeEach(() => {
      testId = abTestService.createTest(mockTest);
    });

    it('should get active tests', () => {
      const activeTests = abTestService.getActiveTests();

      expect(activeTests).toHaveLength(1);
      expect(activeTests[0].id).toBe(testId);
      expect(activeTests[0].isActive).toBe(true);
    });

    it('should exclude inactive tests from active list', () => {
      abTestService.stopTest(testId, 'manual');
      const activeTests = abTestService.getActiveTests();

      expect(activeTests).toHaveLength(0);
    });

    it('should stop test and track event', () => {
      const { trackEvent } = require('../../lib/analytics');
      const { logInfo } = require('../../lib/logging');
      
      abTestService.stopTest(testId, 'reached_significance');

      const tests = (abTestService as any).tests;
      const test = tests.get(testId);
      
      expect(test.isActive).toBe(false);
      expect(test.endDate).toBeInstanceOf(Date);

      expect(trackEvent).toHaveBeenCalledWith('ab_test_stopped', {
        testId,
        reason: 'reached_significance'
      });

      expect(logInfo).toHaveBeenCalledWith('AB Test stopped', {
        testId,
        reason: 'reached_significance'
      });
    });
  });

  describe('Test Summary', () => {
    let testId: string;

    beforeEach(() => {
      testId = abTestService.createTest(mockTest);
      
      // Set up test data
      const assignments = (abTestService as any).assignments;
      const results = (abTestService as any).results;

      assignments.set(`${testId}:user1`, { testId, variantId: 'control', userId: 'user1', assignedAt: new Date() });
      assignments.set(`${testId}:user2`, { testId, variantId: 'simplified', userId: 'user2', assignedAt: new Date() });
      assignments.set(`${testId}:user3`, { testId, variantId: 'simplified', userId: 'user3', assignedAt: new Date() });

      results.push(
        { testId, variantId: 'control', metric: 'completion', value: 1, userId: 'user1', timestamp: new Date() },
        { testId, variantId: 'simplified', metric: 'completion', value: 1, userId: 'user2', timestamp: new Date() },
        { testId, variantId: 'simplified', metric: 'time_to_complete', value: 300, userId: 'user3', timestamp: new Date() }
      );
    });

    it('should generate test summary', () => {
      const summary = abTestService.getTestSummary(testId);

      expect(summary).toBeDefined();
      expect(summary!.totalAssignments).toBe(3);
      expect(summary!.variantDistribution).toEqual({
        control: 1,
        simplified: 2
      });
      expect(summary!.conversionsByMetric).toEqual({
        completion: 2,
        time_to_complete: 1
      });
      expect(summary!.duration).toBeGreaterThan(0);
    });

    it('should return null for unknown test', () => {
      const summary = abTestService.getTestSummary('unknown-test');

      expect(summary).toBeNull();
    });
  });

  describe('Data Persistence', () => {
    it('should save data to AsyncStorage', async () => {
      const testId = abTestService.createTest(mockTest);
      
      // Trigger save by creating assignment
      abTestService.assignUserToTest(testId, 'user123');

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'onboarding_ab_tests',
        expect.any(String)
      );
    });

    it('should load data from AsyncStorage', async () => {
      const mockData = {
        tests: [['test1', mockTest]],
        assignments: [['test1:user1', { testId: 'test1', variantId: 'control', userId: 'user1', assignedAt: new Date() }]],
        results: [{ testId: 'test1', variantId: 'control', metric: 'completion', value: 1, userId: 'user1', timestamp: new Date() }]
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(mockData));

      // Create new instance to trigger loading
      const newService = new (OnboardingABTestService as any)();
      await new Promise(resolve => setTimeout(resolve, 0)); // Wait for async loading

      const tests = (newService as any).tests;
      const assignments = (newService as any).assignments;
      const results = (newService as any).results;

      expect(tests.size).toBe(1);
      expect(assignments.size).toBe(1);
      expect(results).toHaveLength(1);
    });

    it('should handle storage errors gracefully', async () => {
      const { logError } = require('../../lib/logging');
      
      (AsyncStorage.setItem as jest.Mock).mockRejectedValue(new Error('Storage error'));

      const testId = abTestService.createTest(mockTest);
      abTestService.assignUserToTest(testId, 'user123');

      expect(logError).toHaveBeenCalledWith('Failed to save AB test data', expect.any(Error));
    });
  });

  describe('User Hash Function', () => {
    it('should generate consistent hash for same user', () => {
      const hash1 = (abTestService as any).hashUserId('user123');
      const hash2 = (abTestService as any).hashUserId('user123');

      expect(hash1).toBe(hash2);
    });

    it('should generate different hashes for different users', () => {
      const hash1 = (abTestService as any).hashUserId('user123');
      const hash2 = (abTestService as any).hashUserId('user456');

      expect(hash1).not.toBe(hash2);
    });

    it('should generate positive integers', () => {
      const hash = (abTestService as any).hashUserId('user123');

      expect(hash).toBeGreaterThanOrEqual(0);
      expect(Number.isInteger(hash)).toBe(true);
    });
  });

  describe('Default Test Initialization', () => {
    it('should initialize default tests on first run', () => {
      // Create fresh instance
      const freshService = new (OnboardingABTestService as any)();
      
      const tests = (freshService as any).tests;
      expect(tests.size).toBeGreaterThan(0);
      
      // Check that default test exists
      const defaultTest = Array.from(tests.values())[0];
      expect(defaultTest.name).toBe('Onboarding Flow Optimization');
      expect(defaultTest.variants).toHaveLength(2);
    });
  });
});