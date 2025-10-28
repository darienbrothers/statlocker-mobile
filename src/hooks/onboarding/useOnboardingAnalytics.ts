/**
 * useOnboardingAnalytics Hook
 * 
 * React hook for integrating onboarding analytics and performance monitoring
 * into onboarding components. Provides easy-to-use methods for tracking
 * user interactions, performance metrics, and conversion events.
 */

import { useEffect, useCallback, useRef } from 'react';
import { usePathname } from 'expo-router';
import { onboardingAnalytics } from '@/services/OnboardingAnalyticsService';
import { onboardingPerformance } from '@/services/OnboardingPerformanceService';
import { useOnboardingStore } from '@/stores/onboardingStore';
import type { AITone, AthleteDNA } from '@/types/onboarding';

export interface OnboardingAnalyticsHook {
  // Event tracking methods
  trackStepStart: (step: number) => void;
  trackStepCompleted: (step: number, attempts?: number, errors?: string[]) => void;
  trackStepAbandoned: (step: number, reason?: string) => void;
  trackGoalSelected: (goalId: string, category: string, position: number) => void;
  trackTonePreview: (tone: AITone, duration: number) => void;
  trackToneSelected: (tone: AITone, wasRecommended: boolean, previousTone?: AITone) => void;
  trackDNAQuestionAnswered: (questionId: string, answer: string, timeSpent: number) => void;
  trackDNACompleted: (responses: Record<string, string>, totalTimeSpent: number) => void;
  trackValidationError: (step: number, field: string, error: string, attemptNumber?: number) => void;
  trackNetworkError: (step: number, operation: string, error: string, retryCount?: number) => void;
  
  // Performance tracking methods
  trackComponentLoad: (componentName: string, loadTime: number, size?: number, cached?: boolean) => void;
  trackAnimationPerformance: (name: string, frameRate: number, droppedFrames: number, duration: number) => void;
  trackNetworkRequest: (url: string, method: string, duration: number, size: number, status: number) => void;
  
  // Session management
  startSession: (source?: string, userId?: string) => void;
  endSession: () => void;
  
  // A/B Testing
  getVariant: (testId: string) => string | null;
  trackConversion: (testId: string, variant: string, metric: string, value: number) => void;
  
  // Performance monitoring
  startPerformanceMonitoring: () => void;
  stopPerformanceMonitoring: () => void;
  
  // Utility methods
  getCurrentStep: () => number;
  getSessionId: () => string;
  isAnalyticsEnabled: () => boolean;
}

export function useOnboardingAnalytics(): OnboardingAnalyticsHook {
  const pathname = usePathname();
  const { currentStep, profile } = useOnboardingStore();
  const stepStartTimeRef = useRef<number | null>(null);
  const questionStartTimesRef = useRef<Map<string, number>>(new Map());
  const tonePreviewStartRef = useRef<number | null>(null);
  const sessionStartedRef = useRef<boolean>(false);

  // Auto-start session when hook is first used
  useEffect(() => {
    if (!sessionStartedRef.current && pathname.includes('onboarding')) {
      const source = getOnboardingSource();
      const userId = profile.onboardingStarted ? 'existing_user' : undefined;
      
      onboardingAnalytics.startOnboardingSession(source, userId);
      onboardingPerformance.startMonitoring();
      sessionStartedRef.current = true;
    }
  }, [pathname, profile.onboardingStarted]);

  // Track step changes automatically
  useEffect(() => {
    if (currentStep && pathname.includes('onboarding')) {
      trackStepStart(currentStep);
    }
  }, [currentStep, pathname]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (sessionStartedRef.current) {
        onboardingPerformance.stopMonitoring();
      }
    };
  }, []);

  const trackStepStart = useCallback((step: number) => {
    stepStartTimeRef.current = Date.now();
    onboardingAnalytics.trackStepStart(step);
    onboardingPerformance.trackStepStart(step);
  }, []);

  const trackStepCompleted = useCallback((
    step: number, 
    attempts: number = 1, 
    errors: string[] = []
  ) => {
    onboardingAnalytics.trackStepCompleted(step, attempts, errors);
    onboardingPerformance.trackStepCompletion(step);
    stepStartTimeRef.current = null;
  }, []);

  const trackStepAbandoned = useCallback((step: number, reason?: string) => {
    onboardingAnalytics.trackStepAbandoned(step, reason);
    stepStartTimeRef.current = null;
  }, []);

  const trackGoalSelected = useCallback((
    goalId: string, 
    category: string, 
    position: number
  ) => {
    onboardingAnalytics.trackGoalSelected(goalId, category, position);
  }, []);

  const trackTonePreview = useCallback((tone: AITone, duration: number) => {
    onboardingAnalytics.trackTonePreview(tone, duration);
  }, []);

  const trackToneSelected = useCallback((
    tone: AITone, 
    wasRecommended: boolean, 
    previousTone?: AITone
  ) => {
    onboardingAnalytics.trackToneSelected(tone, wasRecommended, previousTone);
  }, []);

  const trackDNAQuestionAnswered = useCallback((
    questionId: string, 
    answer: string, 
    timeSpent: number
  ) => {
    onboardingAnalytics.trackDNAQuestionAnswered(questionId, answer, timeSpent);
  }, []);

  const trackDNACompleted = useCallback((
    responses: Record<string, string>, 
    totalTimeSpent: number
  ) => {
    onboardingAnalytics.trackDNACompleted(responses, totalTimeSpent);
  }, []);

  const trackValidationError = useCallback((
    step: number, 
    field: string, 
    error: string, 
    attemptNumber: number = 1
  ) => {
    onboardingAnalytics.trackValidationError(step, field, error, attemptNumber);
  }, []);

  const trackNetworkError = useCallback((
    step: number, 
    operation: string, 
    error: string, 
    retryCount: number = 0
  ) => {
    onboardingAnalytics.trackNetworkError(step, operation, error, retryCount);
  }, []);

  const trackComponentLoad = useCallback((
    componentName: string, 
    loadTime: number, 
    size?: number, 
    cached: boolean = false
  ) => {
    onboardingPerformance.trackComponentLoad(componentName, loadTime, currentStep, size, cached);
    
    // Also track with RN performance monitor
    import('@/lib/onboarding/performanceMonitoring').then(({ rnPerformanceMonitor }) => {
      rnPerformanceMonitor.recordMetric({
        name: 'onboarding_component_load',
        value: loadTime,
        unit: 'ms',
        timestamp: new Date(),
        metadata: {
          component: componentName,
          step: currentStep,
          size,
          cached
        }
      });
    }).catch(() => {
      // Fallback - performance monitoring not available
    });
  }, [currentStep]);

  const trackAnimationPerformance = useCallback((
    name: string, 
    frameRate: number, 
    droppedFrames: number, 
    duration: number
  ) => {
    onboardingPerformance.trackAnimationPerformance(name, frameRate, droppedFrames, duration, currentStep);
  }, [currentStep]);

  const trackNetworkRequest = useCallback((
    url: string, 
    method: string, 
    duration: number, 
    size: number, 
    status: number
  ) => {
    onboardingPerformance.trackNetworkRequest(url, method, duration, size, status, currentStep);
  }, [currentStep]);

  const startSession = useCallback((source: string = 'unknown', userId?: string) => {
    if (!sessionStartedRef.current) {
      onboardingAnalytics.startOnboardingSession(source, userId);
      onboardingPerformance.startMonitoring();
      sessionStartedRef.current = true;
    }
  }, []);

  const endSession = useCallback(() => {
    if (sessionStartedRef.current) {
      onboardingPerformance.stopMonitoring();
      sessionStartedRef.current = false;
    }
  }, []);

  const getVariant = useCallback((testId: string): string | null => {
    const userId = profile.onboardingStarted?.toString() || 'anonymous';
    return onboardingAnalytics.assignUserToVariant(testId, userId);
  }, [profile.onboardingStarted]);

  const trackConversion = useCallback((
    testId: string, 
    variant: string, 
    metric: string, 
    value: number
  ) => {
    const userId = profile.onboardingStarted?.toString() || 'anonymous';
    onboardingAnalytics.trackABTestConversion(testId, variant, metric, value, userId);
  }, [profile.onboardingStarted]);

  const startPerformanceMonitoring = useCallback(() => {
    onboardingPerformance.startMonitoring();
  }, []);

  const stopPerformanceMonitoring = useCallback(() => {
    onboardingPerformance.stopMonitoring();
  }, []);

  const getCurrentStep = useCallback(() => {
    return currentStep;
  }, [currentStep]);

  const getSessionId = useCallback(() => {
    return (onboardingAnalytics as any).sessionId || 'unknown';
  }, []);

  const isAnalyticsEnabled = useCallback(() => {
    return true; // Could be configurable
  }, []);

  return {
    trackStepStart,
    trackStepCompleted,
    trackStepAbandoned,
    trackGoalSelected,
    trackTonePreview,
    trackToneSelected,
    trackDNAQuestionAnswered,
    trackDNACompleted,
    trackValidationError,
    trackNetworkError,
    trackComponentLoad,
    trackAnimationPerformance,
    trackNetworkRequest,
    startSession,
    endSession,
    getVariant,
    trackConversion,
    startPerformanceMonitoring,
    stopPerformanceMonitoring,
    getCurrentStep,
    getSessionId,
    isAnalyticsEnabled
  };
}

// Helper functions

function getOnboardingSource(): string {
  // In a real app, this would determine the source from various methods:
  // - URL parameters
  // - Deep link data
  // - Referrer information
  // - Stored attribution data
  
  try {
    // Check for URL parameters (if web)
    if (typeof window !== 'undefined' && window.location) {
      const urlParams = new URLSearchParams(window.location.search);
      const source = urlParams.get('source') || urlParams.get('utm_source');
      if (source) return source;
    }
    
    // Check for stored attribution
    // This would typically come from AsyncStorage or a deep link handler
    
    return 'organic';
  } catch (error) {
    return 'unknown';
  }
}

// Additional utility hooks

/**
 * Hook for tracking DNA quiz interactions
 */
export function useDNAQuizAnalytics() {
  const { trackDNAQuestionAnswered, trackDNACompleted } = useOnboardingAnalytics();
  const questionStartTimes = useRef<Map<string, number>>(new Map());
  const quizStartTime = useRef<number | null>(null);

  const startQuiz = useCallback(() => {
    quizStartTime.current = Date.now();
  }, []);

  const startQuestion = useCallback((questionId: string) => {
    questionStartTimes.current.set(questionId, Date.now());
  }, []);

  const answerQuestion = useCallback((questionId: string, answer: string) => {
    const startTime = questionStartTimes.current.get(questionId);
    const timeSpent = startTime ? Date.now() - startTime : 0;
    
    trackDNAQuestionAnswered(questionId, answer, timeSpent);
    questionStartTimes.current.delete(questionId);
  }, [trackDNAQuestionAnswered]);

  const completeQuiz = useCallback((responses: Record<string, string>) => {
    const totalTimeSpent = quizStartTime.current ? Date.now() - quizStartTime.current : 0;
    
    trackDNACompleted(responses, totalTimeSpent);
    quizStartTime.current = null;
    questionStartTimes.current.clear();
  }, [trackDNACompleted]);

  return {
    startQuiz,
    startQuestion,
    answerQuestion,
    completeQuiz
  };
}

/**
 * Hook for tracking tone preference interactions
 */
export function useTonePreferenceAnalytics() {
  const { trackTonePreview, trackToneSelected } = useOnboardingAnalytics();
  const previewStartTime = useRef<number | null>(null);

  const startTonePreview = useCallback((tone: AITone) => {
    previewStartTime.current = Date.now();
  }, []);

  const endTonePreview = useCallback((tone: AITone) => {
    if (previewStartTime.current) {
      const duration = Date.now() - previewStartTime.current;
      trackTonePreview(tone, duration);
      previewStartTime.current = null;
    }
  }, [trackTonePreview]);

  const selectTone = useCallback((
    tone: AITone, 
    wasRecommended: boolean, 
    previousTone?: AITone
  ) => {
    trackToneSelected(tone, wasRecommended, previousTone);
  }, [trackToneSelected]);

  return {
    startTonePreview,
    endTonePreview,
    selectTone
  };
}

/**
 * Hook for tracking goal selection interactions
 */
export function useGoalSelectionAnalytics() {
  const { trackGoalSelected } = useOnboardingAnalytics();

  const selectGoal = useCallback((
    goalId: string, 
    category: string, 
    position: number
  ) => {
    trackGoalSelected(goalId, category, position);
  }, [trackGoalSelected]);

  return {
    selectGoal
  };
}