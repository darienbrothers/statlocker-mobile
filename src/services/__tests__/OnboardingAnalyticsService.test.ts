/**
 * OnboardingAnalyticsService Tests
 * 
 * Tests for onboarding analytics tracking, funnel analysis, and performance monitoring
 */

// Define __DEV__ before any imports
global.__DEV__ = true;

import { OnboardingAnalyticsService } from '../OnboardingAnalyticsService';
import { AITone } from '../../types/onboarding';

// Mock analytics library
jest.mock('../../lib/analytics', () => ({
  analytics: {
    startSession: jest.fn(),
    track: jest.fn(),
    identify: jest.fn()
  },
  trackEvent: jest.fn()
}));

// Mock logging
jest.mock('../../lib/logging', () => ({
  logInfo: jest.fn(),
  logError: jest.fn()
}));

describe('OnboardingAnalyticsService', () => {
  let analyticsService: OnboardingAnalyticsService;

  beforeEach(() => {
    // Get fresh instance for each test
    analyticsService = OnboardingAnalyticsService.getInstance();
    
    // Clear all mocks
    jest.clearAllMocks();
    
    // Clear service data
    (analyticsService as any).events = [];
    (analyticsService as any).performanceMetrics = [];
    (analyticsService as any).stepStartTimes.clear();
  });

  describe('Session Management', () => {
    it('should start onboarding session with correct data', () => {
      const { trackEvent } = require('../../lib/analytics');
      const { analytics } = require('../../lib/analytics');
      
      analyticsService.startOnboardingSession('app_store', 'user123');

      expect(analytics.startSession).toHaveBeenCalledTimes(1);
      expect(trackEvent).toHaveBeenCalledWith('onboarding_onboarding_started', 
        expect.objectContaining({
          source: 'app_store',
          userId: 'user123',
          deviceType: expect.any(String),
          version: expect.any(String)
        })
      );
    });

    it('should generate unique session IDs', () => {
      const sessionId1 = (analyticsService as any).sessionId;
      
      // Create new instance to get different session ID
      const analyticsService2 = new (OnboardingAnalyticsService as any)();
      const sessionId2 = (analyticsService2 as any).sessionId;

      expect(sessionId1).not.toBe(sessionId2);
      expect(sessionId1).toMatch(/^onb_\d+_[a-z0-9]+$/);
    });
  });

  describe('Step Tracking', () => {
    it('should track step start and store timing', () => {
      const { trackEvent } = require('../../lib/analytics');
      
      analyticsService.trackStepStart(1);

      expect(trackEvent).toHaveBeenCalledWith('onboarding_step_start', 
        expect.objectContaining({
          step: 1,
          sessionId: expect.any(String),
          timestamp: expect.any(Date)
        })
      );

      // Check that start time is stored
      const stepStartTimes = (analyticsService as any).stepStartTimes;
      expect(stepStartTimes.has(1)).toBe(true);
    });

    it('should track step completion with duration', () => {
      // Start step first
      analyticsService.trackStepStart(1);
      
      // Wait a bit and complete
      setTimeout(() => {
        analyticsService.trackStepCompleted(1, 2, ['validation-error']);
        
        const events = (analyticsService as any).events;
        const completionEvent = events.find((e: any) => e.event === 'step_completed');
        
        expect(completionEvent).toBeDefined();
        expect(completionEvent.data.step).toBe(1);
        expect(completionEvent.data.attempts).toBe(2);
        expect(completionEvent.data.validationErrors).toEqual(['validation-error']);
        expect(completionEvent.data.duration).toBeGreaterThan(0);
        
        // Check that start time is cleared
        const stepStartTimes = (analyticsService as any).stepStartTimes;
        expect(stepStartTimes.has(1)).toBe(false);
      }, 10);
    });

    it('should track step abandonment', () => {
      analyticsService.trackStepStart(2);
      analyticsService.trackStepAbandoned(2, 'user_exit');

      const events = (analyticsService as any).events;
      const abandonEvent = events.find((e: any) => e.event === 'step_abandoned');
      
      expect(abandonEvent).toBeDefined();
      expect(abandonEvent.data.step).toBe(2);
      expect(abandonEvent.data.reason).toBe('user_exit');
    });
  });

  describe('Goal Selection Tracking', () => {
    it('should track goal selection with correct data', () => {
      analyticsService.trackGoalSelected('improve-shooting', 'offense', 1);

      const events = (analyticsService as any).events;
      const goalEvent = events.find((e: any) => e.event === 'goal_selected');
      
      expect(goalEvent).toBeDefined();
      expect(goalEvent.data.goalId).toBe('improve-shooting');
      expect(goalEvent.data.category).toBe('offense');
      expect(goalEvent.data.position).toBe(1);
    });
  });

  describe('AI Tone Tracking', () => {
    it('should track tone preview with duration', () => {
      analyticsService.trackTonePreview('hype' as AITone, 5000);

      const events = (analyticsService as any).events;
      const previewEvent = events.find((e: any) => e.event === 'tone_previewed');
      
      expect(previewEvent).toBeDefined();
      expect(previewEvent.data.tone).toBe('hype');
      expect(previewEvent.data.duration).toBe(5000);
    });

    it('should track tone selection with recommendation status', () => {
      analyticsService.trackToneSelected('mentor' as AITone, true, 'hype' as AITone);

      const events = (analyticsService as any).events;
      const selectionEvent = events.find((e: any) => e.event === 'tone_selected');
      
      expect(selectionEvent).toBeDefined();
      expect(selectionEvent.data.tone).toBe('mentor');
      expect(selectionEvent.data.wasRecommended).toBe(true);
      expect(selectionEvent.data.previousTone).toBe('hype');
    });
  });

  describe('DNA Quiz Tracking', () => {
    it('should track individual DNA question answers', () => {
      analyticsService.trackDNAQuestionAnswered('motivation', 'intrinsic', 3000);

      const events = (analyticsService as any).events;
      const questionEvent = events.find((e: any) => e.event === 'dna_question_answered');
      
      expect(questionEvent).toBeDefined();
      expect(questionEvent.data.questionId).toBe('motivation');
      expect(questionEvent.data.answer).toBe('intrinsic');
      expect(questionEvent.data.timeSpent).toBe(3000);
    });

    it('should track DNA quiz completion', () => {
      const responses = {
        motivation: 'intrinsic',
        confidence: 'high',
        focusMode: 'intense'
      };
      
      analyticsService.trackDNACompleted(responses, 45000);

      const events = (analyticsService as any).events;
      const completionEvent = events.find((e: any) => e.event === 'dna_completed');
      
      expect(completionEvent).toBeDefined();
      expect(completionEvent.data.responses).toEqual(responses);
      expect(completionEvent.data.totalTimeSpent).toBe(45000);
    });
  });

  describe('Persona Derivation Tracking', () => {
    it('should track persona derivation with DNA data', () => {
      const dnaResponses = {
        motivation: 'intrinsic',
        confidence: 'high',
        focusMode: 'intense'
      };
      
      analyticsService.trackPersonaDerived('Competitor', dnaResponses, 'hype' as AITone);

      const events = (analyticsService as any).events;
      const personaEvent = events.find((e: any) => e.event === 'persona_derived');
      
      expect(personaEvent).toBeDefined();
      expect(personaEvent.data.personaType).toBe('Competitor');
      expect(personaEvent.data.dnaResponses).toEqual(dnaResponses);
      expect(personaEvent.data.recommendedTone).toBe('hype');
    });
  });

  describe('Completion Tracking', () => {
    it('should track onboarding completion with metrics', () => {
      const { trackEvent } = require('../../lib/analytics');
      
      analyticsService.trackOnboardingCompleted(300000, 11, 'Competitor');

      expect(trackEvent).toHaveBeenCalledWith('conversion_onboarding_completed', 
        expect.objectContaining({
          totalDuration: 300000,
          stepCount: 11,
          personaType: 'Competitor'
        })
      );

      const events = (analyticsService as any).events;
      const completionEvent = events.find((e: any) => e.event === 'onboarding_completed');
      
      expect(completionEvent).toBeDefined();
      expect(completionEvent.data.totalDuration).toBe(300000);
      expect(completionEvent.data.stepCount).toBe(11);
      expect(completionEvent.data.personaType).toBe('Competitor');
    });

    it('should track trial activation', () => {
      const { trackEvent } = require('../../lib/analytics');
      
      analyticsService.trackTrialActivated('automatic', 'user123');

      expect(trackEvent).toHaveBeenCalledWith('conversion_trial_activated', 
        expect.objectContaining({
          method: 'automatic',
          userId: 'user123'
        })
      );
    });
  });

  describe('Error Tracking', () => {
    it('should track validation errors', () => {
      analyticsService.trackValidationError(3, 'position', 'Position is required', 2);

      const events = (analyticsService as any).events;
      const errorEvent = events.find((e: any) => e.event === 'validation_error');
      
      expect(errorEvent).toBeDefined();
      expect(errorEvent.data.step).toBe(3);
      expect(errorEvent.data.field).toBe('position');
      expect(errorEvent.data.error).toBe('Position is required');
      expect(errorEvent.data.attemptNumber).toBe(2);
    });

    it('should track network errors', () => {
      analyticsService.trackNetworkError(5, 'save_profile', 'Network timeout', 1);

      const events = (analyticsService as any).events;
      const errorEvent = events.find((e: any) => e.event === 'network_error');
      
      expect(errorEvent).toBeDefined();
      expect(errorEvent.data.step).toBe(5);
      expect(errorEvent.data.operation).toBe('save_profile');
      expect(errorEvent.data.error).toBe('Network timeout');
      expect(errorEvent.data.retryCount).toBe(1);
    });
  });

  describe('Resume and Reset Tracking', () => {
    it('should track onboarding resume', () => {
      analyticsService.trackOnboardingResumed(7, 2, 'manual');

      const events = (analyticsService as any).events;
      const resumeEvent = events.find((e: any) => e.event === 'onboarding_resumed');
      
      expect(resumeEvent).toBeDefined();
      expect(resumeEvent.data.lastCompletedStep).toBe(7);
      expect(resumeEvent.data.daysSinceStart).toBe(2);
      expect(resumeEvent.data.resumeMethod).toBe('manual');
    });

    it('should track onboarding reset', () => {
      analyticsService.trackOnboardingReset(5, 'user_initiated');

      const events = (analyticsService as any).events;
      const resetEvent = events.find((e: any) => e.event === 'onboarding_reset');
      
      expect(resetEvent).toBeDefined();
      expect(resetEvent.data.completedSteps).toBe(5);
      expect(resetEvent.data.reason).toBe('user_initiated');
    });
  });

  describe('Funnel Metrics', () => {
    beforeEach(() => {
      // Set up test data for funnel analysis
      const events = (analyticsService as any).events;
      
      // Simulate onboarding funnel data
      events.push(
        { event: 'onboarding_started', data: {}, timestamp: new Date() },
        { event: 'onboarding_step_start', data: { step: 1 }, timestamp: new Date() },
        { event: 'step_completed', data: { step: 1, duration: 5000 }, timestamp: new Date() },
        { event: 'onboarding_step_start', data: { step: 2 }, timestamp: new Date() },
        { event: 'step_completed', data: { step: 2, duration: 8000 }, timestamp: new Date() },
        { event: 'onboarding_step_start', data: { step: 3 }, timestamp: new Date() },
        // Step 3 not completed (drop-off)
        { event: 'onboarding_completed', data: { totalDuration: 300000 }, timestamp: new Date() }
      );
    });

    it('should calculate step completion rates', () => {
      const metrics = analyticsService.getFunnelMetrics('day');

      expect(metrics.stepCompletionRates[1]).toBe(100); // 1 start, 1 completion
      expect(metrics.stepCompletionRates[2]).toBe(100); // 1 start, 1 completion
      expect(metrics.stepCompletionRates[3]).toBe(0);   // 1 start, 0 completions
    });

    it('should identify drop-off points', () => {
      const metrics = analyticsService.getFunnelMetrics('day');

      expect(metrics.dropOffPoints).toContainEqual({
        step: 3,
        dropOffRate: 100
      });
    });

    it('should calculate conversion rate', () => {
      const metrics = analyticsService.getFunnelMetrics('day');

      expect(metrics.totalStarted).toBe(1);
      expect(metrics.totalCompleted).toBe(1);
      expect(metrics.conversionRate).toBe(100);
    });
  });

  describe('Performance Metrics', () => {
    beforeEach(() => {
      // Set up performance test data
      const performanceMetrics = (analyticsService as any).performanceMetrics;
      const events = (analyticsService as any).events;
      
      performanceMetrics.push(
        {
          name: 'auth_duration',
          value: 2000,
          unit: 'ms',
          timestamp: new Date(),
          context: {}
        },
        {
          name: 'profile_save_duration',
          value: 1500,
          unit: 'ms',
          timestamp: new Date(),
          context: {}
        }
      );

      events.push(
        { event: 'step_completed', data: { step: 1, duration: 5000 }, timestamp: new Date() },
        { event: 'step_completed', data: { step: 2, duration: 8000 }, timestamp: new Date() },
        { event: 'validation_error', data: { step: 1 }, timestamp: new Date() },
        { event: 'network_error', data: { step: 2 }, timestamp: new Date() }
      );
    });

    it('should calculate average step durations', () => {
      const metrics = analyticsService.getPerformanceMetrics('day');

      expect(metrics.stepDurations[1]).toBe(5000);
      expect(metrics.stepDurations[2]).toBe(8000);
    });

    it('should calculate validation error rates', () => {
      const metrics = analyticsService.getPerformanceMetrics('day');

      expect(metrics.validationErrorRates[1]).toBe(100); // 1 error, 1 attempt
      expect(metrics.validationErrorRates[2]).toBe(0);   // 0 errors, 1 attempt
    });

    it('should calculate network error rates', () => {
      const metrics = analyticsService.getPerformanceMetrics('day');

      expect(metrics.networkErrorRates[1]).toBe(0);   // 0 errors, 1 attempt
      expect(metrics.networkErrorRates[2]).toBe(100); // 1 error, 1 attempt
    });
  });

  describe('User Segmentation', () => {
    beforeEach(() => {
      // Set up segmentation test data
      const events = (analyticsService as any).events;
      
      events.push(
        { 
          event: 'onboarding_started', 
          data: { userId: 'user123', source: 'app_store', deviceType: 'ios' }, 
          timestamp: new Date() 
        },
        { 
          event: 'step_completed', 
          data: { userId: 'user123', step: 1, role: 'athlete', sport: 'lacrosse' }, 
          timestamp: new Date() 
        },
        { 
          event: 'persona_derived', 
          data: { userId: 'user123', personaType: 'Competitor' }, 
          timestamp: new Date() 
        },
        { 
          event: 'tone_selected', 
          data: { userId: 'user123', tone: 'hype' }, 
          timestamp: new Date() 
        }
      );
    });

    it('should extract user segmentation data', () => {
      const segmentationData = analyticsService.getSegmentationData('user123');

      expect(segmentationData).toEqual({
        source: 'app_store',
        deviceType: 'ios',
        role: 'athlete',
        sport: 'lacrosse',
        position: undefined,
        personaType: 'Competitor',
        aiTone: 'hype'
      });
    });

    it('should return null for unknown user', () => {
      const segmentationData = analyticsService.getSegmentationData('unknown-user');

      expect(segmentationData).toBeNull();
    });
  });

  describe('A/B Testing Integration', () => {
    it('should assign user to variant based on hash', () => {
      // Mock A/B test setup
      const abTestVariants = (analyticsService as any).abTestVariants;
      abTestVariants.set('test1', {
        id: 'variant_a',
        name: 'Test Variant',
        allocation: 50,
        isActive: true,
        startDate: new Date(Date.now() - 86400000) // Yesterday
      });

      const variant = analyticsService.assignUserToVariant('test1', 'user123');

      expect(variant).toBeDefined();
      expect(['variant_a', 'control']).toContain(variant);
    });

    it('should track A/B test conversion', () => {
      const { trackEvent } = require('../../lib/analytics');
      
      analyticsService.trackABTestConversion('test1', 'variant_a', 'completion', 1, 'user123');

      expect(trackEvent).toHaveBeenCalledWith('ab_test_conversion', 
        expect.objectContaining({
          testId: 'test1',
          variant: 'variant_a',
          metric: 'completion',
          value: 1,
          userId: 'user123'
        })
      );
    });
  });

  describe('Event Storage and Limits', () => {
    it('should limit stored events to 1000', () => {
      const events = (analyticsService as any).events;
      
      // Add more than 1000 events
      for (let i = 0; i < 1200; i++) {
        analyticsService.trackStepStart(1);
      }

      expect(events.length).toBe(1000);
    });

    it('should maintain event order when trimming', () => {
      const events = (analyticsService as any).events;
      
      // Add events with identifiable data
      for (let i = 0; i < 1200; i++) {
        (analyticsService as any).trackOnboardingEvent('test_event', { index: i });
      }

      // Should keep the last 1000 events
      expect(events[0].data.index).toBe(200);
      expect(events[999].data.index).toBe(1199);
    });
  });
});