/**
 * Onboarding Analytics Service
 * 
 * Comprehensive analytics tracking for the onboarding flow including:
 * - Event tracking for all onboarding actions
 * - Funnel analysis and conversion metrics
 * - Performance monitoring and optimization
 * - A/B testing infrastructure
 * - User segmentation and engagement metrics
 */

import { analytics, trackEvent } from '@/lib/analytics';
import { logInfo, logError } from '@/lib/logging';
import type { 
  OnboardingAnalyticsEvents,
  OnboardingProfile,
  AITone,
  AthleteDNA
} from '@/types/onboarding';

export interface OnboardingEventContext {
  sessionId: string;
  deviceType: 'ios' | 'android' | 'web';
  appVersion: string;
  onboardingVersion: string;
  source: 'app_store' | 'referral' | 'team_code' | 'organic' | 'unknown';
  timestamp: Date;
  userId?: string;
  userAgent?: string;
}

export interface FunnelMetrics {
  stepCompletionRates: Record<number, number>;
  dropOffPoints: Array<{ step: number; dropOffRate: number }>;
  averageCompletionTime: number;
  conversionRate: number;
  totalStarted: number;
  totalCompleted: number;
}

export interface PerformanceMetrics {
  stepDurations: Record<number, number>;
  validationErrorRates: Record<number, number>;
  networkErrorRates: Record<number, number>;
  memoryUsage: number[];
  animationFrameRates: number[];
}

export interface SegmentationData {
  source: string;
  deviceType: string;
  role: 'athlete' | 'coach';
  sport?: string;
  position?: string;
  personaType?: string;
  aiTone?: AITone;
}

export interface ABTestVariant {
  id: string;
  name: string;
  description: string;
  allocation: number; // 0-100 percentage
  isActive: boolean;
  startDate: Date;
  endDate?: Date;
}

export interface ABTestResult {
  variantId: string;
  metric: string;
  value: number;
  sampleSize: number;
  confidenceLevel: number;
}

export class OnboardingAnalyticsService {
  private static instance: OnboardingAnalyticsService;
  private sessionId: string;
  private context: Partial<OnboardingEventContext>;
  private stepStartTimes: Map<number, number> = new Map();
  private events: Array<{ event: string; data: any; timestamp: Date }> = [];
  private performanceObserver?: PerformanceObserver;
  private abTestVariants: Map<string, ABTestVariant> = new Map();
  private userVariants: Map<string, string> = new Map();

  private constructor() {
    this.sessionId = this.generateSessionId();
    this.context = this.initializeContext();
    this.initializePerformanceMonitoring();
    this.loadABTestVariants();
  }

  public static getInstance(): OnboardingAnalyticsService {
    if (!OnboardingAnalyticsService.instance) {
      OnboardingAnalyticsService.instance = new OnboardingAnalyticsService();
    }
    return OnboardingAnalyticsService.instance;
  }

  /**
   * Initialize onboarding session
   */
  public startOnboardingSession(source: string = 'unknown', userId?: string): void {
    this.context.userId = userId;
    this.context.source = source as any;
    
    const eventData = {
      timestamp: new Date(),
      source,
      deviceType: this.context.deviceType || 'unknown',
      version: this.context.appVersion || '1.0.0',
      sessionId: this.sessionId,
      userId
    };

    this.trackOnboardingEvent('onboarding_started', eventData);
    
    // Track session start in main analytics
    analytics.startSession();
    
    logInfo('Onboarding Analytics: Session started', {
      sessionId: this.sessionId,
      source,
      userId
    });
  }

  /**
   * Track step start
   */
  public trackStepStart(step: number): void {
    this.stepStartTimes.set(step, Date.now());
    
    trackEvent('onboarding_step_start', {
      step,
      sessionId: this.sessionId,
      userId: this.context.userId,
      timestamp: new Date()
    });
  }

  /**
   * Track step completion
   */
  public trackStepCompleted(
    step: number, 
    attempts: number = 1, 
    validationErrors: string[] = []
  ): void {
    const startTime = this.stepStartTimes.get(step);
    const duration = startTime ? Date.now() - startTime : 0;
    
    const eventData = {
      step,
      duration,
      attempts,
      validationErrors,
      sessionId: this.sessionId,
      userId: this.context.userId,
      timestamp: new Date()
    };

    this.trackOnboardingEvent('step_completed', eventData);
    
    // Clear step start time
    this.stepStartTimes.delete(step);
    
    logInfo('Onboarding Analytics: Step completed', {
      step,
      duration,
      attempts
    });
  }

  /**
   * Track step abandonment
   */
  public trackStepAbandoned(step: number, reason?: string): void {
    const startTime = this.stepStartTimes.get(step);
    const duration = startTime ? Date.now() - startTime : 0;
    
    const eventData = {
      step,
      duration,
      reason,
      sessionId: this.sessionId,
      userId: this.context.userId,
      timestamp: new Date()
    };

    this.trackOnboardingEvent('step_abandoned', eventData);
    
    logInfo('Onboarding Analytics: Step abandoned', {
      step,
      duration,
      reason
    });
  }

  /**
   * Track goal selection
   */
  public trackGoalSelected(goalId: string, category: string, position: number): void {
    const eventData = {
      goalId,
      category,
      position,
      sessionId: this.sessionId,
      userId: this.context.userId,
      timestamp: new Date()
    };

    this.trackOnboardingEvent('goal_selected', eventData);
  }

  /**
   * Track AI tone preview
   */
  public trackTonePreview(tone: AITone, duration: number): void {
    const eventData = {
      tone,
      duration,
      sessionId: this.sessionId,
      userId: this.context.userId,
      timestamp: new Date()
    };

    this.trackOnboardingEvent('tone_previewed', eventData);
  }

  /**
   * Track AI tone selection
   */
  public trackToneSelected(
    tone: AITone, 
    wasRecommended: boolean, 
    previousTone?: AITone
  ): void {
    const eventData = {
      tone,
      wasRecommended,
      previousTone,
      sessionId: this.sessionId,
      userId: this.context.userId,
      timestamp: new Date()
    };

    this.trackOnboardingEvent('tone_selected', eventData);
  }

  /**
   * Track DNA question answered
   */
  public trackDNAQuestionAnswered(
    questionId: string, 
    answer: string, 
    timeSpent: number
  ): void {
    const eventData = {
      questionId,
      answer,
      timeSpent,
      sessionId: this.sessionId,
      userId: this.context.userId,
      timestamp: new Date()
    };

    this.trackOnboardingEvent('dna_question_answered', eventData);
  }

  /**
   * Track DNA completion
   */
  public trackDNACompleted(responses: Record<string, string>, totalTimeSpent: number): void {
    const eventData = {
      responses,
      totalTimeSpent,
      sessionId: this.sessionId,
      userId: this.context.userId,
      timestamp: new Date()
    };

    this.trackOnboardingEvent('dna_completed', eventData);
  }

  /**
   * Track persona derivation
   */
  public trackPersonaDerived(
    personaType: string,
    dnaResponses: Record<string, string>,
    recommendedTone: AITone
  ): void {
    const eventData = {
      personaType,
      dnaResponses,
      recommendedTone,
      sessionId: this.sessionId,
      userId: this.context.userId,
      timestamp: new Date()
    };

    this.trackOnboardingEvent('persona_derived', eventData);
  }

  /**
   * Track onboarding completion
   */
  public trackOnboardingCompleted(
    totalDuration: number,
    stepCount: number,
    personaType?: string
  ): void {
    const eventData = {
      totalDuration,
      stepCount,
      personaType,
      sessionId: this.sessionId,
      userId: this.context.userId,
      timestamp: new Date()
    };

    this.trackOnboardingEvent('onboarding_completed', eventData);
    
    // Track conversion in main analytics
    trackEvent('conversion_onboarding_completed', {
      sessionId: this.sessionId,
      totalDuration,
      stepCount,
      personaType
    });
    
    logInfo('Onboarding Analytics: Onboarding completed', {
      sessionId: this.sessionId,
      totalDuration,
      stepCount,
      personaType
    });
  }

  /**
   * Track trial activation
   */
  public trackTrialActivated(method: string, userId: string): void {
    const eventData = {
      timestamp: new Date(),
      method,
      userId,
      sessionId: this.sessionId
    };

    this.trackOnboardingEvent('trial_activated', eventData);
    
    // Track conversion in main analytics
    trackEvent('conversion_trial_activated', {
      method,
      userId,
      sessionId: this.sessionId
    });
  }

  /**
   * Track validation error
   */
  public trackValidationError(
    step: number,
    field: string,
    error: string,
    attemptNumber: number = 1
  ): void {
    const eventData = {
      step,
      field,
      error,
      attemptNumber,
      sessionId: this.sessionId,
      userId: this.context.userId,
      timestamp: new Date()
    };

    this.trackOnboardingEvent('validation_error', eventData);
  }

  /**
   * Track network error
   */
  public trackNetworkError(
    step: number,
    operation: string,
    error: string,
    retryCount: number = 0
  ): void {
    const eventData = {
      step,
      operation,
      error,
      retryCount,
      sessionId: this.sessionId,
      userId: this.context.userId,
      timestamp: new Date()
    };

    this.trackOnboardingEvent('network_error', eventData);
  }

  /**
   * Track onboarding resume
   */
  public trackOnboardingResumed(
    lastCompletedStep: number,
    daysSinceStart: number,
    resumeMethod: 'automatic' | 'manual' = 'automatic'
  ): void {
    const eventData = {
      lastCompletedStep,
      daysSinceStart,
      resumeMethod,
      sessionId: this.sessionId,
      userId: this.context.userId,
      timestamp: new Date()
    };

    this.trackOnboardingEvent('onboarding_resumed', eventData);
  }

  /**
   * Track onboarding reset
   */
  public trackOnboardingReset(
    completedSteps: number,
    reason: 'user_initiated' | 'data_conflict' | 'error_recovery' = 'user_initiated'
  ): void {
    const eventData = {
      completedSteps,
      reason,
      sessionId: this.sessionId,
      userId: this.context.userId,
      timestamp: new Date()
    };

    this.trackOnboardingEvent('onboarding_reset', eventData);
  }

  /**
   * Get funnel metrics
   */
  public getFunnelMetrics(timeRange: 'day' | 'week' | 'month' = 'week'): FunnelMetrics {
    const cutoffTime = this.getCutoffTime(timeRange);
    const relevantEvents = this.events.filter(e => e.timestamp >= cutoffTime);

    // Calculate step completion rates
    const stepStarts = new Map<number, number>();
    const stepCompletions = new Map<number, number>();

    relevantEvents.forEach(({ event, data }) => {
      if (event === 'onboarding_step_start') {
        stepStarts.set(data.step, (stepStarts.get(data.step) || 0) + 1);
      } else if (event === 'step_completed') {
        stepCompletions.set(data.step, (stepCompletions.get(data.step) || 0) + 1);
      }
    });

    const stepCompletionRates: Record<number, number> = {};
    const dropOffPoints: Array<{ step: number; dropOffRate: number }> = [];

    for (let step = 1; step <= 11; step++) {
      const starts = stepStarts.get(step) || 0;
      const completions = stepCompletions.get(step) || 0;
      const completionRate = starts > 0 ? (completions / starts) * 100 : 0;
      
      stepCompletionRates[step] = completionRate;
      
      if (completionRate < 80) { // Identify drop-off points
        dropOffPoints.push({
          step,
          dropOffRate: 100 - completionRate
        });
      }
    }

    // Calculate overall metrics
    const totalStarted = relevantEvents.filter(e => e.event === 'onboarding_started').length;
    const totalCompleted = relevantEvents.filter(e => e.event === 'onboarding_completed').length;
    const conversionRate = totalStarted > 0 ? (totalCompleted / totalStarted) * 100 : 0;

    // Calculate average completion time
    const completedEvents = relevantEvents.filter(e => e.event === 'onboarding_completed');
    const averageCompletionTime = completedEvents.length > 0
      ? completedEvents.reduce((sum, e) => sum + e.data.totalDuration, 0) / completedEvents.length
      : 0;

    return {
      stepCompletionRates,
      dropOffPoints: dropOffPoints.sort((a, b) => b.dropOffRate - a.dropOffRate),
      averageCompletionTime,
      conversionRate,
      totalStarted,
      totalCompleted
    };
  }

  /**
   * Get performance metrics
   */
  public getPerformanceMetrics(timeRange: 'day' | 'week' | 'month' = 'week'): PerformanceMetrics {
    const cutoffTime = this.getCutoffTime(timeRange);
    const relevantEvents = this.events.filter(e => e.timestamp >= cutoffTime);

    // Calculate step durations
    const stepDurations: Record<number, number> = {};
    const stepDurationSums = new Map<number, number>();
    const stepDurationCounts = new Map<number, number>();

    relevantEvents
      .filter(e => e.event === 'step_completed')
      .forEach(({ data }) => {
        const step = data.step;
        const duration = data.duration;
        
        stepDurationSums.set(step, (stepDurationSums.get(step) || 0) + duration);
        stepDurationCounts.set(step, (stepDurationCounts.get(step) || 0) + 1);
      });

    stepDurationSums.forEach((sum, step) => {
      const count = stepDurationCounts.get(step) || 1;
      stepDurations[step] = sum / count;
    });

    // Calculate validation error rates
    const validationErrorRates: Record<number, number> = {};
    const stepAttempts = new Map<number, number>();
    const stepErrors = new Map<number, number>();

    relevantEvents.forEach(({ event, data }) => {
      if (event === 'step_completed') {
        stepAttempts.set(data.step, (stepAttempts.get(data.step) || 0) + 1);
      } else if (event === 'validation_error') {
        stepErrors.set(data.step, (stepErrors.get(data.step) || 0) + 1);
      }
    });

    stepAttempts.forEach((attempts, step) => {
      const errors = stepErrors.get(step) || 0;
      validationErrorRates[step] = attempts > 0 ? (errors / attempts) * 100 : 0;
    });

    // Calculate network error rates
    const networkErrorRates: Record<number, number> = {};
    const networkErrors = new Map<number, number>();

    relevantEvents
      .filter(e => e.event === 'network_error')
      .forEach(({ data }) => {
        networkErrors.set(data.step, (networkErrors.get(data.step) || 0) + 1);
      });

    stepAttempts.forEach((attempts, step) => {
      const errors = networkErrors.get(step) || 0;
      networkErrorRates[step] = attempts > 0 ? (errors / attempts) * 100 : 0;
    });

    return {
      stepDurations,
      validationErrorRates,
      networkErrorRates,
      memoryUsage: [], // Would be populated by performance monitoring
      animationFrameRates: [] // Would be populated by performance monitoring
    };
  }

  /**
   * Get user segmentation data
   */
  public getSegmentationData(userId: string): SegmentationData | null {
    const userEvents = this.events.filter(e => e.data.userId === userId);
    
    if (userEvents.length === 0) return null;

    const startEvent = userEvents.find(e => e.event === 'onboarding_started');
    const completedEvent = userEvents.find(e => e.event === 'step_completed' && e.data.step === 1);
    const personaEvent = userEvents.find(e => e.event === 'persona_derived');
    const toneEvent = userEvents.find(e => e.event === 'tone_selected');

    return {
      source: startEvent?.data.source || 'unknown',
      deviceType: startEvent?.data.deviceType || 'unknown',
      role: completedEvent?.data.role || 'athlete',
      sport: completedEvent?.data.sport,
      position: completedEvent?.data.position,
      personaType: personaEvent?.data.personaType,
      aiTone: toneEvent?.data.tone
    };
  }

  /**
   * A/B Testing Methods
   */
  public assignUserToVariant(testId: string, userId: string): string | null {
    const test = this.abTestVariants.get(testId);
    if (!test || !test.isActive) return null;

    // Check if user already has a variant
    const existingVariant = this.userVariants.get(`${testId}:${userId}`);
    if (existingVariant) return existingVariant;

    // Assign variant based on user ID hash
    const hash = this.hashUserId(userId);
    const variant = hash % 100 < test.allocation ? test.id : 'control';
    
    this.userVariants.set(`${testId}:${userId}`, variant);
    
    // Track assignment
    trackEvent('ab_test_assigned', {
      testId,
      variant,
      userId,
      sessionId: this.sessionId
    });

    return variant;
  }

  /**
   * Track A/B test conversion
   */
  public trackABTestConversion(
    testId: string,
    variant: string,
    metric: string,
    value: number,
    userId: string
  ): void {
    trackEvent('ab_test_conversion', {
      testId,
      variant,
      metric,
      value,
      userId,
      sessionId: this.sessionId
    });
  }

  // Private methods

  private trackOnboardingEvent<K extends keyof OnboardingAnalyticsEvents>(
    event: K,
    data: OnboardingAnalyticsEvents[K]
  ): void {
    // Store event locally
    this.events.push({
      event,
      data,
      timestamp: new Date()
    });

    // Keep only last 1000 events in memory
    if (this.events.length > 1000) {
      this.events = this.events.slice(-1000);
    }

    // Send to main analytics system
    trackEvent(`onboarding_${event}`, {
      ...data,
      sessionId: this.sessionId,
      context: this.context
    });
  }

  private generateSessionId(): string {
    return `onb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeContext(): Partial<OnboardingEventContext> {
    return {
      deviceType: this.getDeviceType(),
      appVersion: this.getAppVersion(),
      onboardingVersion: '1.0.0',
      timestamp: new Date()
    };
  }

  private getDeviceType(): 'ios' | 'android' | 'web' {
    // This would be determined by the platform
    // For now, return a default
    return 'ios';
  }

  private getAppVersion(): string {
    // This would come from app configuration
    return '1.0.0';
  }

  private initializePerformanceMonitoring(): void {
    try {
      // Initialize performance monitoring if available
      if (typeof PerformanceObserver !== 'undefined') {
        this.performanceObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            if (entry.name.includes('onboarding')) {
              trackEvent('onboarding_performance', {
                name: entry.name,
                duration: entry.duration,
                startTime: entry.startTime,
                sessionId: this.sessionId
              });
            }
          });
        });

        this.performanceObserver.observe({ entryTypes: ['measure', 'navigation'] });
      }
    } catch (error) {
      logError('Failed to initialize performance monitoring', error as Error);
    }
  }

  private loadABTestVariants(): void {
    // In a real implementation, this would load from a configuration service
    // For now, we'll initialize with some example variants
    this.abTestVariants.set('onboarding_flow_v2', {
      id: 'variant_a',
      name: 'Simplified Flow',
      description: 'Reduced number of steps',
      allocation: 50,
      isActive: true,
      startDate: new Date('2024-01-01'),
    });
  }

  private getCutoffTime(timeRange: 'day' | 'week' | 'month'): Date {
    const now = new Date();
    switch (timeRange) {
      case 'day':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000);
      case 'week':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case 'month':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }
  }

  private hashUserId(userId: string): number {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }
}

// Export singleton instance
export const onboardingAnalytics = OnboardingAnalyticsService.getInstance();