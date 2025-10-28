/**
 * Analytics Service
 * 
 * Handles authentication event tracking, performance monitoring,
 * and success/failure rate analytics for the authentication system.
 */

import { logInfo, logError } from '@/lib/logging';
import { auditLogService } from './AuditLogService';

export interface AuthEvent {
  type: AuthEventType;
  userId?: string;
  timestamp: Date;
  properties: Record<string, any>;
  context: EventContext;
}

export type AuthEventType = 
  | 'auth_start'
  | 'auth_success' 
  | 'auth_error'
  | 'sign_out'
  | 'reset_request'
  | 'email_verification_sent'
  | 'email_verification_completed'
  | 'password_reset_completed'
  | 'account_created'
  | 'account_linked'
  | 'session_created'
  | 'session_expired'
  | 'rate_limit_hit'
  | 'security_event'
  | 'consent_given'
  | 'parental_consent_requested'
  | 'account_deletion_requested';

export interface EventContext {
  sessionId?: string;
  deviceId?: string;
  platform: string;
  appVersion: string;
  route?: string;
  userAgent?: string;
  ipAddress?: string;
  referrer?: string;
}

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: 'ms' | 'seconds' | 'count' | 'percentage';
  timestamp: Date;
  context: EventContext;
  metadata?: Record<string, any>;
}

export interface AuthMetrics {
  successRate: number;
  failureRate: number;
  averageAuthTime: number;
  totalAttempts: number;
  uniqueUsers: number;
  topErrors: Array<{ error: string; count: number }>;
  performanceMetrics: PerformanceMetric[];
}

export interface SecurityAlert {
  type: 'suspicious_activity' | 'rate_limit_exceeded' | 'multiple_failures' | 'unusual_location';
  severity: 'low' | 'medium' | 'high' | 'critical';
  userId?: string;
  description: string;
  metadata: Record<string, any>;
  timestamp: Date;
}

export class AnalyticsService {
  private static instance: AnalyticsService;
  private events: AuthEvent[] = [];
  private performanceMetrics: PerformanceMetric[] = [];
  private securityAlerts: SecurityAlert[] = [];
  private sessionStartTimes: Map<string, number> = new Map();
  private isEnabled: boolean = true;

  private constructor() {}

  public static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  /**
   * Track authentication event
   */
  public trackAuthEvent(
    type: AuthEventType,
    properties: Record<string, any> = {},
    userId?: string
  ): void {
    if (!this.isEnabled) return;

    try {
      const event: AuthEvent = {
        type,
        userId,
        timestamp: new Date(),
        properties,
        context: this.getEventContext(),
      };

      this.events.push(event);
      
      // Keep only last 1000 events in memory
      if (this.events.length > 1000) {
        this.events = this.events.slice(-1000);
      }

      // Log to console for debugging
      logInfo('Analytics: Auth event tracked', {
        type,
        userId,
        properties,
      });

      // Send to external analytics services
      this.sendToAnalyticsProviders(event);

      // Check for security patterns
      this.checkSecurityPatterns(event);

    } catch (error) {
      logError('Analytics: Failed to track auth event', error as Error);
    }
  }

  /**
   * Track performance metric
   */
  public trackPerformance(
    name: string,
    value: number,
    unit: 'ms' | 'seconds' | 'count' | 'percentage' = 'ms',
    metadata?: Record<string, any>
  ): void {
    if (!this.isEnabled) return;

    try {
      const metric: PerformanceMetric = {
        name,
        value,
        unit,
        timestamp: new Date(),
        context: this.getEventContext(),
        metadata,
      };

      this.performanceMetrics.push(metric);
      
      // Keep only last 500 metrics in memory
      if (this.performanceMetrics.length > 500) {
        this.performanceMetrics = this.performanceMetrics.slice(-500);
      }

      logInfo('Analytics: Performance metric tracked', {
        name,
        value,
        unit,
        metadata,
      });

    } catch (error) {
      logError('Analytics: Failed to track performance metric', error as Error);
    }
  }

  /**
   * Start timing an authentication flow
   */
  public startTiming(flowId: string): void {
    this.sessionStartTimes.set(flowId, Date.now());
  }

  /**
   * End timing and track performance
   */
  public endTiming(flowId: string, eventType: string): void {
    const startTime = this.sessionStartTimes.get(flowId);
    if (startTime) {
      const duration = Date.now() - startTime;
      this.trackPerformance(`${eventType}_duration`, duration, 'ms');
      this.sessionStartTimes.delete(flowId);
    }
  }

  /**
   * Track authentication success
   */
  public trackAuthSuccess(
    method: 'email' | 'apple' | 'google' | 'magic_link',
    userId: string,
    isNewUser: boolean = false,
    additionalProperties: Record<string, any> = {}
  ): void {
    this.trackAuthEvent('auth_success', {
      method,
      isNewUser,
      ...additionalProperties,
    }, userId);

    // Track conversion funnel
    if (isNewUser) {
      this.trackAuthEvent('account_created', {
        method,
        ...additionalProperties,
      }, userId);
    }
  }

  /**
   * Track authentication error
   */
  public trackAuthError(
    method: 'email' | 'apple' | 'google' | 'magic_link',
    errorCode: string,
    errorMessage: string,
    userId?: string,
    additionalProperties: Record<string, any> = {}
  ): void {
    this.trackAuthEvent('auth_error', {
      method,
      errorCode,
      errorMessage,
      ...additionalProperties,
    }, userId);

    // Check for suspicious patterns
    this.checkForSuspiciousActivity(errorCode, userId);
  }

  /**
   * Track sign out event
   */
  public trackSignOut(userId: string, method: 'manual' | 'timeout' | 'forced' = 'manual'): void {
    this.trackAuthEvent('sign_out', { method }, userId);
  }

  /**
   * Track password reset request
   */
  public trackPasswordReset(email: string, success: boolean): void {
    this.trackAuthEvent('reset_request', {
      email: this.hashEmail(email),
      success,
    });
  }

  /**
   * Track email verification
   */
  public trackEmailVerification(userId: string, action: 'sent' | 'completed'): void {
    const eventType = action === 'sent' ? 'email_verification_sent' : 'email_verification_completed';
    this.trackAuthEvent(eventType, { action }, userId);
  }

  /**
   * Track security event
   */
  public trackSecurityEvent(
    type: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    description: string,
    userId?: string,
    metadata: Record<string, any> = {}
  ): void {
    this.trackAuthEvent('security_event', {
      securityType: type,
      severity,
      description,
      ...metadata,
    }, userId);

    // Create security alert if severity is high or critical
    if (severity === 'high' || severity === 'critical') {
      this.createSecurityAlert(type as any, severity, userId, description, metadata);
    }
  }

  /**
   * Track consent events
   */
  public trackConsent(
    userId: string,
    documentType: string,
    consentGiven: boolean,
    version: string
  ): void {
    this.trackAuthEvent('consent_given', {
      documentType,
      consentGiven,
      version,
    }, userId);
  }

  /**
   * Track parental consent
   */
  public trackParentalConsent(
    childUserId: string,
    parentEmail: string,
    action: 'requested' | 'approved' | 'denied'
  ): void {
    this.trackAuthEvent('parental_consent_requested', {
      childUserId,
      parentEmail: this.hashEmail(parentEmail),
      action,
    });
  }

  /**
   * Get authentication metrics
   */
  public getAuthMetrics(timeRange: 'hour' | 'day' | 'week' | 'month' = 'day'): AuthMetrics {
    const cutoffTime = this.getCutoffTime(timeRange);
    const relevantEvents = this.events.filter(event => event.timestamp >= cutoffTime);

    const authAttempts = relevantEvents.filter(e => 
      e.type === 'auth_success' || e.type === 'auth_error'
    );
    
    const successes = relevantEvents.filter(e => e.type === 'auth_success');
    const failures = relevantEvents.filter(e => e.type === 'auth_error');

    const totalAttempts = authAttempts.length;
    const successRate = totalAttempts > 0 ? (successes.length / totalAttempts) * 100 : 0;
    const failureRate = totalAttempts > 0 ? (failures.length / totalAttempts) * 100 : 0;

    // Calculate average auth time
    const authDurations = this.performanceMetrics
      .filter(m => m.name.includes('auth') && m.name.includes('duration'))
      .filter(m => m.timestamp >= cutoffTime);
    
    const averageAuthTime = authDurations.length > 0
      ? authDurations.reduce((sum, m) => sum + m.value, 0) / authDurations.length
      : 0;

    // Get unique users
    const uniqueUsers = new Set(
      relevantEvents
        .filter(e => e.userId)
        .map(e => e.userId)
    ).size;

    // Get top errors
    const errorCounts: Record<string, number> = {};
    failures.forEach(event => {
      const errorCode = event.properties.errorCode || 'unknown';
      errorCounts[errorCode] = (errorCounts[errorCode] || 0) + 1;
    });

    const topErrors = Object.entries(errorCounts)
      .map(([error, count]) => ({ error, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      successRate,
      failureRate,
      averageAuthTime,
      totalAttempts,
      uniqueUsers,
      topErrors,
      performanceMetrics: this.performanceMetrics.filter(m => m.timestamp >= cutoffTime),
    };
  }

  /**
   * Get security alerts
   */
  public getSecurityAlerts(timeRange: 'hour' | 'day' | 'week' | 'month' = 'day'): SecurityAlert[] {
    const cutoffTime = this.getCutoffTime(timeRange);
    return this.securityAlerts.filter(alert => alert.timestamp >= cutoffTime);
  }

  /**
   * Enable or disable analytics
   */
  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    logInfo('Analytics: Service enabled status changed', { enabled });
  }

  /**
   * Clear stored analytics data
   */
  public clearData(): void {
    this.events = [];
    this.performanceMetrics = [];
    this.securityAlerts = [];
    this.sessionStartTimes.clear();
    logInfo('Analytics: Data cleared');
  }

  // Private methods

  private getEventContext(): EventContext {
    return {
      platform: 'mobile', // Could be determined dynamically
      appVersion: '1.0.0', // Should come from app config
      route: 'unknown', // Could be determined from navigation
      timestamp: new Date().toISOString(),
    };
  }

  private sendToAnalyticsProviders(event: AuthEvent): void {
    // This is where you would integrate with external analytics services
    // Examples: PostHog, Amplitude, Mixpanel, Firebase Analytics, etc.
    
    try {
      // PostHog example (commented out - would need actual integration)
      // posthog.capture(event.type, {
      //   ...event.properties,
      //   userId: event.userId,
      //   timestamp: event.timestamp,
      // });

      // Firebase Analytics example (commented out - would need actual integration)
      // analytics().logEvent(event.type, {
      //   ...event.properties,
      //   user_id: event.userId,
      // });

      logInfo('Analytics: Event sent to providers', { type: event.type });
    } catch (error) {
      logError('Analytics: Failed to send to providers', error as Error);
    }
  }

  private checkSecurityPatterns(event: AuthEvent): void {
    try {
      // Check for multiple failed attempts
      if (event.type === 'auth_error') {
        this.checkMultipleFailures(event);
      }

      // Check for rate limiting
      if (event.type === 'rate_limit_hit') {
        this.createSecurityAlert(
          'rate_limit_exceeded',
          'medium',
          event.userId,
          'Rate limit exceeded for authentication attempts',
          event.properties
        );
      }

      // Check for suspicious timing patterns
      this.checkSuspiciousTiming(event);

    } catch (error) {
      logError('Analytics: Failed to check security patterns', error as Error);
    }
  }

  private checkForSuspiciousActivity(errorCode: string, userId?: string): void {
    // Check for patterns that might indicate attacks
    const recentErrors = this.events
      .filter(e => 
        e.type === 'auth_error' && 
        e.timestamp > new Date(Date.now() - 5 * 60 * 1000) // Last 5 minutes
      );

    // Multiple errors from same user
    if (userId) {
      const userErrors = recentErrors.filter(e => e.userId === userId);
      if (userErrors.length >= 5) {
        this.createSecurityAlert(
          'multiple_failures',
          'high',
          userId,
          `Multiple authentication failures detected for user`,
          { errorCount: userErrors.length, errorCode }
        );
      }
    }

    // High error rate overall
    if (recentErrors.length >= 20) {
      this.createSecurityAlert(
        'suspicious_activity',
        'medium',
        undefined,
        'High authentication error rate detected',
        { errorCount: recentErrors.length, timeWindow: '5 minutes' }
      );
    }
  }

  private checkMultipleFailures(event: AuthEvent): void {
    const userId = event.userId;
    if (!userId) return;

    const recentFailures = this.events.filter(e =>
      e.type === 'auth_error' &&
      e.userId === userId &&
      e.timestamp > new Date(Date.now() - 15 * 60 * 1000) // Last 15 minutes
    );

    if (recentFailures.length >= 3) {
      this.createSecurityAlert(
        'multiple_failures',
        'medium',
        userId,
        'Multiple authentication failures detected',
        { failureCount: recentFailures.length }
      );
    }
  }

  private checkSuspiciousTiming(event: AuthEvent): void {
    // Check for unusually fast authentication attempts (possible bot)
    const recentEvents = this.events
      .filter(e => e.timestamp > new Date(Date.now() - 60 * 1000)) // Last minute
      .filter(e => e.type === 'auth_start' || e.type === 'auth_success' || e.type === 'auth_error');

    if (recentEvents.length >= 10) {
      this.createSecurityAlert(
        'suspicious_activity',
        'medium',
        event.userId,
        'Unusually high authentication activity detected',
        { eventCount: recentEvents.length, timeWindow: '1 minute' }
      );
    }
  }

  private createSecurityAlert(
    type: SecurityAlert['type'],
    severity: SecurityAlert['severity'],
    userId: string | undefined,
    description: string,
    metadata: Record<string, any>
  ): void {
    const alert: SecurityAlert = {
      type,
      severity,
      userId,
      description,
      metadata,
      timestamp: new Date(),
    };

    this.securityAlerts.push(alert);

    // Keep only last 100 alerts
    if (this.securityAlerts.length > 100) {
      this.securityAlerts = this.securityAlerts.slice(-100);
    }

    // Log to audit service
    auditLogService.logSecurityEvent({
      type: 'SECURITY_ALERT',
      userId,
      metadata: {
        alertType: type,
        severity,
        description,
        ...metadata,
      },
    });

    logInfo('Analytics: Security alert created', {
      type,
      severity,
      userId,
      description,
    });
  }

  private getCutoffTime(timeRange: 'hour' | 'day' | 'week' | 'month'): Date {
    const now = new Date();
    switch (timeRange) {
      case 'hour':
        return new Date(now.getTime() - 60 * 60 * 1000);
      case 'day':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000);
      case 'week':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case 'month':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }
  }

  private hashEmail(email: string): string {
    // Simple hash for privacy - in production use a proper hash function
    return email.split('@')[0].substring(0, 3) + '***@' + email.split('@')[1];
  }
}

// Export singleton instance
export const analyticsService = AnalyticsService.getInstance();