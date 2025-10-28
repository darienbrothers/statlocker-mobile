/**
 * Onboarding A/B Testing Service
 * 
 * Manages A/B tests for the onboarding flow including:
 * - Test configuration and variant assignment
 * - Statistical analysis and confidence intervals
 * - Conversion tracking and funnel analysis
 * - Feature flag management
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { logInfo, logError } from '@/lib/logging';
import { trackEvent } from '@/lib/analytics';

export interface ABTest {
  id: string;
  name: string;
  description: string;
  hypothesis: string;
  variants: ABTestVariant[];
  trafficAllocation: number; // 0-100 percentage of users to include
  startDate: Date;
  endDate?: Date;
  isActive: boolean;
  targetMetrics: string[];
  segmentationRules?: SegmentationRule[];
  minimumSampleSize: number;
  confidenceLevel: number; // 0.90, 0.95, 0.99
}

export interface ABTestVariant {
  id: string;
  name: string;
  description: string;
  allocation: number; // 0-100 percentage within the test
  config: Record<string, any>;
  isControl: boolean;
}

export interface SegmentationRule {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'in' | 'not_in';
  value: any;
}

export interface ABTestAssignment {
  testId: string;
  variantId: string;
  userId: string;
  assignedAt: Date;
  sessionId?: string;
}

export interface ABTestResult {
  testId: string;
  variantId: string;
  metric: string;
  value: number;
  userId: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface ABTestAnalysis {
  testId: string;
  metric: string;
  variants: Array<{
    variantId: string;
    sampleSize: number;
    conversionRate: number;
    mean: number;
    standardDeviation: number;
    confidenceInterval: [number, number];
  }>;
  statisticalSignificance: boolean;
  pValue: number;
  confidenceLevel: number;
  winner?: string;
  recommendation: 'continue' | 'stop_winner' | 'stop_no_winner' | 'need_more_data';
}

export class OnboardingABTestService {
  private static instance: OnboardingABTestService;
  private tests: Map<string, ABTest> = new Map();
  private assignments: Map<string, ABTestAssignment> = new Map();
  private results: ABTestResult[] = [];
  private storageKey = 'onboarding_ab_tests';

  private constructor() {
    this.loadFromStorage();
    this.initializeDefaultTests();
  }

  public static getInstance(): OnboardingABTestService {
    if (!OnboardingABTestService.instance) {
      OnboardingABTestService.instance = new OnboardingABTestService();
    }
    return OnboardingABTestService.instance;
  }

  /**
   * Create a new A/B test
   */
  public createTest(test: Omit<ABTest, 'id'>): string {
    const testId = this.generateTestId();
    const fullTest: ABTest = {
      ...test,
      id: testId
    };

    this.tests.set(testId, fullTest);
    this.saveToStorage();

    logInfo('AB Test created', { testId, name: test.name });
    
    trackEvent('ab_test_created', {
      testId,
      name: test.name,
      variantCount: test.variants.length
    });

    return testId;
  }

  /**
   * Assign user to test variant
   */
  public assignUserToTest(testId: string, userId: string, sessionId?: string): string | null {
    const test = this.tests.get(testId);
    if (!test || !test.isActive) {
      return null;
    }

    // Check if test is within date range
    const now = new Date();
    if (now < test.startDate || (test.endDate && now > test.endDate)) {
      return null;
    }

    // Check if user already has assignment
    const existingAssignment = this.getAssignment(testId, userId);
    if (existingAssignment) {
      return existingAssignment.variantId;
    }

    // Check if user should be included in test (traffic allocation)
    if (!this.shouldIncludeUser(userId, test.trafficAllocation)) {
      return null;
    }

    // Check segmentation rules
    if (test.segmentationRules && !this.matchesSegmentation(userId, test.segmentationRules)) {
      return null;
    }

    // Assign variant based on user hash
    const variantId = this.assignVariant(userId, test.variants);
    
    const assignment: ABTestAssignment = {
      testId,
      variantId,
      userId,
      assignedAt: new Date(),
      sessionId
    };

    this.assignments.set(`${testId}:${userId}`, assignment);
    this.saveToStorage();

    // Track assignment
    trackEvent('ab_test_assigned', {
      testId,
      variantId,
      userId,
      sessionId
    });

    logInfo('AB Test assignment', { testId, variantId, userId });

    return variantId;
  }

  /**
   * Get user's variant for a test
   */
  public getUserVariant(testId: string, userId: string): string | null {
    const assignment = this.getAssignment(testId, userId);
    return assignment?.variantId || null;
  }

  /**
   * Get variant configuration
   */
  public getVariantConfig(testId: string, variantId: string): Record<string, any> | null {
    const test = this.tests.get(testId);
    if (!test) return null;

    const variant = test.variants.find(v => v.id === variantId);
    return variant?.config || null;
  }

  /**
   * Track conversion event
   */
  public trackConversion(
    testId: string,
    userId: string,
    metric: string,
    value: number = 1,
    metadata?: Record<string, any>
  ): void {
    const assignment = this.getAssignment(testId, userId);
    if (!assignment) {
      return; // User not in test
    }

    const result: ABTestResult = {
      testId,
      variantId: assignment.variantId,
      metric,
      value,
      userId,
      timestamp: new Date(),
      metadata
    };

    this.results.push(result);
    this.saveToStorage();

    // Track in analytics
    trackEvent('ab_test_conversion', {
      testId,
      variantId: assignment.variantId,
      metric,
      value,
      userId
    });

    logInfo('AB Test conversion', { testId, variantId: assignment.variantId, metric, value });
  }

  /**
   * Get test analysis
   */
  public getTestAnalysis(testId: string, metric: string): ABTestAnalysis | null {
    const test = this.tests.get(testId);
    if (!test) return null;

    const testResults = this.results.filter(r => r.testId === testId && r.metric === metric);
    if (testResults.length === 0) {
      return null;
    }

    // Group results by variant
    const variantResults = new Map<string, number[]>();
    testResults.forEach(result => {
      if (!variantResults.has(result.variantId)) {
        variantResults.set(result.variantId, []);
      }
      variantResults.get(result.variantId)!.push(result.value);
    });

    // Calculate statistics for each variant
    const variants = test.variants.map(variant => {
      const values = variantResults.get(variant.id) || [];
      const sampleSize = values.length;
      const mean = sampleSize > 0 ? values.reduce((sum, v) => sum + v, 0) / sampleSize : 0;
      const variance = sampleSize > 1 
        ? values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / (sampleSize - 1)
        : 0;
      const standardDeviation = Math.sqrt(variance);
      
      // Calculate confidence interval
      const tValue = this.getTValue(test.confidenceLevel, sampleSize - 1);
      const marginOfError = tValue * (standardDeviation / Math.sqrt(sampleSize));
      const confidenceInterval: [number, number] = [
        mean - marginOfError,
        mean + marginOfError
      ];

      return {
        variantId: variant.id,
        sampleSize,
        conversionRate: mean, // For binary metrics, mean is conversion rate
        mean,
        standardDeviation,
        confidenceInterval
      };
    });

    // Perform statistical significance test (simplified t-test)
    const { statisticalSignificance, pValue } = this.performSignificanceTest(variants, test.confidenceLevel);

    // Determine winner and recommendation
    const winner = statisticalSignificance ? this.determineWinner(variants) : undefined;
    const recommendation = this.getRecommendation(variants, statisticalSignificance, test.minimumSampleSize);

    return {
      testId,
      metric,
      variants,
      statisticalSignificance,
      pValue,
      confidenceLevel: test.confidenceLevel,
      winner,
      recommendation
    };
  }

  /**
   * Get all active tests
   */
  public getActiveTests(): ABTest[] {
    const now = new Date();
    return Array.from(this.tests.values()).filter(test => 
      test.isActive && 
      now >= test.startDate && 
      (!test.endDate || now <= test.endDate)
    );
  }

  /**
   * Stop a test
   */
  public stopTest(testId: string, reason?: string): void {
    const test = this.tests.get(testId);
    if (test) {
      test.isActive = false;
      test.endDate = new Date();
      this.saveToStorage();

      trackEvent('ab_test_stopped', {
        testId,
        reason: reason || 'manual'
      });

      logInfo('AB Test stopped', { testId, reason });
    }
  }

  /**
   * Get test results summary
   */
  public getTestSummary(testId: string): {
    totalAssignments: number;
    variantDistribution: Record<string, number>;
    conversionsByMetric: Record<string, number>;
    duration: number;
  } | null {
    const test = this.tests.get(testId);
    if (!test) return null;

    const assignments = Array.from(this.assignments.values()).filter(a => a.testId === testId);
    const testResults = this.results.filter(r => r.testId === testId);

    const variantDistribution: Record<string, number> = {};
    assignments.forEach(assignment => {
      variantDistribution[assignment.variantId] = (variantDistribution[assignment.variantId] || 0) + 1;
    });

    const conversionsByMetric: Record<string, number> = {};
    testResults.forEach(result => {
      conversionsByMetric[result.metric] = (conversionsByMetric[result.metric] || 0) + 1;
    });

    const duration = test.endDate 
      ? test.endDate.getTime() - test.startDate.getTime()
      : Date.now() - test.startDate.getTime();

    return {
      totalAssignments: assignments.length,
      variantDistribution,
      conversionsByMetric,
      duration
    };
  }

  // Private methods

  private generateTestId(): string {
    return `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private shouldIncludeUser(userId: string, trafficAllocation: number): boolean {
    const hash = this.hashUserId(userId);
    return (hash % 100) < trafficAllocation;
  }

  private assignVariant(userId: string, variants: ABTestVariant[]): string {
    const hash = this.hashUserId(userId);
    let cumulativeAllocation = 0;
    
    for (const variant of variants) {
      cumulativeAllocation += variant.allocation;
      if ((hash % 100) < cumulativeAllocation) {
        return variant.id;
      }
    }
    
    // Fallback to control variant
    return variants.find(v => v.isControl)?.id || variants[0].id;
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

  private getAssignment(testId: string, userId: string): ABTestAssignment | undefined {
    return this.assignments.get(`${testId}:${userId}`);
  }

  private matchesSegmentation(userId: string, rules: SegmentationRule[]): boolean {
    // In a real implementation, this would check user properties against rules
    // For now, return true (no segmentation filtering)
    return true;
  }

  private performSignificanceTest(
    variants: Array<{ sampleSize: number; mean: number; standardDeviation: number }>,
    confidenceLevel: number
  ): { statisticalSignificance: boolean; pValue: number } {
    // Simplified two-sample t-test between control and first variant
    if (variants.length < 2) {
      return { statisticalSignificance: false, pValue: 1 };
    }

    const control = variants.find(v => v.sampleSize > 0) || variants[0];
    const treatment = variants.find(v => v !== control && v.sampleSize > 0) || variants[1];

    if (!control || !treatment || control.sampleSize < 2 || treatment.sampleSize < 2) {
      return { statisticalSignificance: false, pValue: 1 };
    }

    // Calculate pooled standard error
    const pooledSE = Math.sqrt(
      (Math.pow(control.standardDeviation, 2) / control.sampleSize) +
      (Math.pow(treatment.standardDeviation, 2) / treatment.sampleSize)
    );

    if (pooledSE === 0) {
      return { statisticalSignificance: false, pValue: 1 };
    }

    // Calculate t-statistic
    const tStat = Math.abs(treatment.mean - control.mean) / pooledSE;
    
    // Degrees of freedom (simplified)
    const df = control.sampleSize + treatment.sampleSize - 2;
    
    // Critical t-value for given confidence level
    const criticalT = this.getTValue(confidenceLevel, df);
    
    const statisticalSignificance = tStat > criticalT;
    
    // Simplified p-value calculation (would use proper t-distribution in production)
    const pValue = statisticalSignificance ? 0.01 : 0.5;

    return { statisticalSignificance, pValue };
  }

  private getTValue(confidenceLevel: number, degreesOfFreedom: number): number {
    // Simplified t-value lookup (would use proper t-distribution table in production)
    const tValues: Record<number, number> = {
      0.90: 1.645,
      0.95: 1.96,
      0.99: 2.576
    };
    
    return tValues[confidenceLevel] || 1.96;
  }

  private determineWinner(variants: Array<{ variantId: string; mean: number }>): string {
    return variants.reduce((winner, current) => 
      current.mean > winner.mean ? current : winner
    ).variantId;
  }

  private getRecommendation(
    variants: Array<{ sampleSize: number; mean: number }>,
    statisticalSignificance: boolean,
    minimumSampleSize: number
  ): 'continue' | 'stop_winner' | 'stop_no_winner' | 'need_more_data' {
    const maxSampleSize = Math.max(...variants.map(v => v.sampleSize));
    
    if (maxSampleSize < minimumSampleSize) {
      return 'need_more_data';
    }
    
    if (statisticalSignificance) {
      return 'stop_winner';
    }
    
    if (maxSampleSize > minimumSampleSize * 2) {
      return 'stop_no_winner';
    }
    
    return 'continue';
  }

  private async saveToStorage(): Promise<void> {
    try {
      const data = {
        tests: Array.from(this.tests.entries()),
        assignments: Array.from(this.assignments.entries()),
        results: this.results
      };
      
      await AsyncStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      logError('Failed to save AB test data', error as Error);
    }
  }

  private async loadFromStorage(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(this.storageKey);
      if (data) {
        const parsed = JSON.parse(data);
        
        this.tests = new Map(parsed.tests || []);
        this.assignments = new Map(parsed.assignments || []);
        this.results = parsed.results || [];
      }
    } catch (error) {
      logError('Failed to load AB test data', error as Error);
    }
  }

  private initializeDefaultTests(): void {
    // Initialize some default onboarding tests
    if (this.tests.size === 0) {
      this.createTest({
        name: 'Onboarding Flow Optimization',
        description: 'Test simplified vs detailed onboarding flow',
        hypothesis: 'A simplified onboarding flow will increase completion rates',
        variants: [
          {
            id: 'control',
            name: 'Standard Flow',
            description: 'Current 11-step onboarding flow',
            allocation: 50,
            config: { stepCount: 11, skipOptional: false },
            isControl: true
          },
          {
            id: 'simplified',
            name: 'Simplified Flow',
            description: 'Reduced 8-step onboarding flow',
            allocation: 50,
            config: { stepCount: 8, skipOptional: true },
            isControl: false
          }
        ],
        trafficAllocation: 100,
        startDate: new Date(),
        isActive: true,
        targetMetrics: ['onboarding_completion', 'trial_activation'],
        minimumSampleSize: 100,
        confidenceLevel: 0.95
      });
    }
  }
}

// Export singleton instance
export const onboardingABTest = OnboardingABTestService.getInstance();