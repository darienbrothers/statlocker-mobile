/**
 * Authentication Monitoring Service
 * 
 * Provides comprehensive monitoring and analytics integration
 * specifically for authentication flows, including real-time
 * performance tracking, success/failure rate monitoring, and
 * security event detection.
 */

import { logInfo, logError } from '@/lib/logging';
import { analyticsService, AuthEventType } from './AnalyticsService';
import { monitoringService } from './MonitoringService';
import { auditLogService } from './AuditLogService';

export interface AuthFlowMetrics {
  flowId: string;
  flowType: 'sign_in' | 'sign_up' | 'password_reset' | 'email_verification' | 'account_linking';
  method: 'email' | 'apple' | 'google' | 'magic_link';
  startTime: Date;
  endTime?: Date;
  duration?: number;
  success: boolean;
  errorCode?: string;
  errorMessage?: string;
  userId?: string;
  metadata: Record<string, any>;
}

export interface AuthPerformanceReport {
  timeRange: 'hour' | 'day' | 'week' | 'month';
  totalFlows: number;
  successfulFlows: number;
  failedFlows: number;
  successRate: number;
  averageDuration: number;
  medianDuration: number;
  p95Duration: number;
  topErrors: Array<{ error: string; count: number; percentage: number }>;
  methodBreakdown: Record<string, { count: number; successRate: number; avgDuration: number }>;
  flowTypeBreakdown: Record<string, { count: number; successRate: number; avgDuration: number }>;
  hourlyTrends: Array<{ hour: number; count: number; successRate: number }>;
}

export interface AuthSecurityReport {
  timeRange: 'hour' | 'day' | 'week' | 'month';
  totalSecurityEvents: number;
  criticalAlerts: number;
  highAlerts: number;
  mediumAlerts: number;
  lowAlerts: number;
  topSecurityEvents: Array<{ type: string; count: number; severity: string }>;
  suspiciousUsers: Array<{ userId: string; eventCount: number; lastEvent: Date }>;
  rateLimitHits: number;
  multipleFailureUsers: number;
  geographicAnomalies: number;
}

export interface AuthHealthStatus {
  overall: 'healthy' | 'degraded' | 'unhealthy';
  authService: 'healthy' | 'degraded' | 'unhealthy';
  successRate: number;
  errorRate: number;
  averageResponseTime: number;
  activeUsers: number;
  recentErrors: Array<{ error: string; count: number; timestamp: Date }>;
  performanceIssues: Array<{ issue: string; severity: string; timestamp: Date }>;
}

export class AuthMonitoringService {
  private static instance: AuthMonitoringService;
  private activeFlows: Map<string, AuthFlowMetrics> = new Map();
  private completedFlows: AuthFlowMetrics[] = [];
  private isMonitoring: boolean = false;
  private monitoringInterval?: NodeJS.Timeout;
  private alertThresholds = {
    successRate: 95, // Alert if success rate drops below 95%
    errorRate: 5, // Alert if error rate exceeds 5%
    averageResponseTime: 3000, // Alert if average response time exceeds 3s
    criticalErrorCount: 10, // Alert if critical errors exceed 10 per hour
  };

  private constructor() {}

  public static getInstance(): AuthMonitoringService {
    if (!AuthMonitoringService.instance) {
      AuthMonitoringService.instance = new AuthMonitoringService();
    }
    return AuthMonitoringService.instance;
  }

  /**
   * Start authentication monitoring
   */
  public startMonitoring(intervalMs: number = 30000): void {
    if (this.isMonitoring) {
      return;
    }

    this.isMonitoring = true;
    
    // Start system monitoring
    monitoringService.startMonitoring(intervalMs);
    
    // Set up auth-specific monitoring
    this.monitoringInterval = setInterval(() => {
      this.performAuthHealthCheck();
      this.checkAlertConditions();
      this.cleanupOldData();
    }, intervalMs);

    logInfo('AuthMonitoring: Service started', { intervalMs });
  }

  /**
   * Stop authentication monitoring
   */
  public stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }
    
    this.isMonitoring = false;
    monitoringService.stopMonitoring();
    logInfo('AuthMonitoring: Service stopped');
  }

  /**
   * Start tracking an authentication flow
   */
  public startAuthFlow(
    flowId: string,
    flowType: AuthFlowMetrics['flowType'],
    method: AuthFlowMetrics['method'],
    metadata: Record<string, any> = {}
  ): void {
    const flow: AuthFlowMetrics = {
      flowId,
      flowType,
      method,
      startTime: new Date(),
      success: false,
      metadata,
    };

    this.activeFlows.set(flowId, flow);
    
    // Track analytics event
    analyticsService.trackAuthEvent('auth_start', {
      flowType,
      method,
      flowId,
      ...metadata,
    });

    // Start performance timing
    analyticsService.startTiming(flowId);

    logInfo('AuthMonitoring: Flow started', { flowId, flowType, method });
  }

  /**
   * Complete an authentication flow
   */
  public completeAuthFlow(
    flowId: string,
    success: boolean,
    userId?: string,
    errorCode?: string,
    errorMessage?: string,
    additionalMetadata: Record<string, any> = {}
  ): void {
    const flow = this.activeFlows.get(flowId);
    if (!flow) {
      logError('AuthMonitoring: Attempted to complete unknown flow', new Error(`Flow ${flowId} not found`));
      return;
    }

    // Update flow metrics
    flow.endTime = new Date();
    flow.duration = flow.endTime.getTime() - flow.startTime.getTime();
    flow.success = success;
    flow.userId = userId;
    flow.errorCode = errorCode;
    flow.errorMessage = errorMessage;
    flow.metadata = { ...flow.metadata, ...additionalMetadata };

    // Move to completed flows
    this.activeFlows.delete(flowId);
    this.completedFlows.push(flow);

    // Keep only last 1000 completed flows
    if (this.completedFlows.length > 1000) {
      this.completedFlows = this.completedFlows.slice(-1000);
    }

    // End performance timing
    analyticsService.endTiming(flowId, `${flow.flowType}_${flow.method}`);

    // Track analytics events
    if (success) {
      analyticsService.trackAuthSuccess(
        flow.method,
        userId!,
        flow.flowType === 'sign_up',
        {
          flowType: flow.flowType,
          duration: flow.duration,
          flowId,
          ...additionalMetadata,
        }
      );
    } else {
      analyticsService.trackAuthError(
        flow.method,
        errorCode || 'unknown',
        errorMessage || 'Unknown error',
        userId,
        {
          flowType: flow.flowType,
          duration: flow.duration,
          flowId,
          ...additionalMetadata,
        }
      );
    }

    // Track performance metric
    analyticsService.trackPerformance(
      `${flow.flowType}_${flow.method}_duration`,
      flow.duration,
      'ms',
      {
        success,
        errorCode,
        userId,
      }
    );

    logInfo('AuthMonitoring: Flow completed', {
      flowId,
      success,
      duration: flow.duration,
      errorCode,
    });
  }

  /**
   * Track authentication security event
   */
  public trackSecurityEvent(
    type: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    description: string,
    userId?: string,
    metadata: Record<string, any> = {}
  ): void {
    analyticsService.trackSecurityEvent(type, severity, description, userId, metadata);
    
    // Log to audit service
    auditLogService.logSecurityEvent({
      type: 'AUTH_SECURITY_EVENT',
      userId,
      metadata: {
        securityEventType: type,
        severity,
        description,
        ...metadata,
      },
    });

    logInfo('AuthMonitoring: Security event tracked', {
      type,
      severity,
      userId,
      description,
    });
  }

  /**
   * Get authentication performance report
   */
  public getPerformanceReport(timeRange: 'hour' | 'day' | 'week' | 'month' = 'day'): AuthPerformanceReport {
    const cutoffTime = this.getCutoffTime(timeRange);
    const relevantFlows = this.completedFlows.filter(flow => flow.startTime >= cutoffTime);

    const totalFlows = relevantFlows.length;
    const successfulFlows = relevantFlows.filter(f => f.success).length;
    const failedFlows = totalFlows - successfulFlows;
    const successRate = totalFlows > 0 ? (successfulFlows / totalFlows) * 100 : 0;

    // Calculate duration statistics
    const durations = relevantFlows
      .filter(f => f.duration !== undefined)
      .map(f => f.duration!)
      .sort((a, b) => a - b);

    const averageDuration = durations.length > 0 
      ? durations.reduce((sum, d) => sum + d, 0) / durations.length 
      : 0;
    
    const medianDuration = durations.length > 0 
      ? durations[Math.floor(durations.length / 2)] 
      : 0;
    
    const p95Duration = durations.length > 0 
      ? durations[Math.floor(durations.length * 0.95)] 
      : 0;

    // Calculate error breakdown
    const errorCounts: Record<string, number> = {};
    relevantFlows.filter(f => !f.success).forEach(flow => {
      const error = flow.errorCode || 'unknown';
      errorCounts[error] = (errorCounts[error] || 0) + 1;
    });

    const topErrors = Object.entries(errorCounts)
      .map(([error, count]) => ({
        error,
        count,
        percentage: (count / failedFlows) * 100,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Calculate method breakdown
    const methodBreakdown: Record<string, { count: number; successRate: number; avgDuration: number }> = {};
    ['email', 'apple', 'google', 'magic_link'].forEach(method => {
      const methodFlows = relevantFlows.filter(f => f.method === method);
      const methodSuccesses = methodFlows.filter(f => f.success).length;
      const methodDurations = methodFlows.filter(f => f.duration).map(f => f.duration!);
      
      methodBreakdown[method] = {
        count: methodFlows.length,
        successRate: methodFlows.length > 0 ? (methodSuccesses / methodFlows.length) * 100 : 0,
        avgDuration: methodDurations.length > 0 
          ? methodDurations.reduce((sum, d) => sum + d, 0) / methodDurations.length 
          : 0,
      };
    });

    // Calculate flow type breakdown
    const flowTypeBreakdown: Record<string, { count: number; successRate: number; avgDuration: number }> = {};
    ['sign_in', 'sign_up', 'password_reset', 'email_verification', 'account_linking'].forEach(flowType => {
      const typeFlows = relevantFlows.filter(f => f.flowType === flowType);
      const typeSuccesses = typeFlows.filter(f => f.success).length;
      const typeDurations = typeFlows.filter(f => f.duration).map(f => f.duration!);
      
      flowTypeBreakdown[flowType] = {
        count: typeFlows.length,
        successRate: typeFlows.length > 0 ? (typeSuccesses / typeFlows.length) * 100 : 0,
        avgDuration: typeDurations.length > 0 
          ? typeDurations.reduce((sum, d) => sum + d, 0) / typeDurations.length 
          : 0,
      };
    });

    // Calculate hourly trends
    const hourlyTrends: Array<{ hour: number; count: number; successRate: number }> = [];
    for (let hour = 0; hour < 24; hour++) {
      const hourFlows = relevantFlows.filter(f => f.startTime.getHours() === hour);
      const hourSuccesses = hourFlows.filter(f => f.success).length;
      
      hourlyTrends.push({
        hour,
        count: hourFlows.length,
        successRate: hourFlows.length > 0 ? (hourSuccesses / hourFlows.length) * 100 : 0,
      });
    }

    return {
      timeRange,
      totalFlows,
      successfulFlows,
      failedFlows,
      successRate,
      averageDuration,
      medianDuration,
      p95Duration,
      topErrors,
      methodBreakdown,
      flowTypeBreakdown,
      hourlyTrends,
    };
  }

  /**
   * Get authentication security report
   */
  public getSecurityReport(timeRange: 'hour' | 'day' | 'week' | 'month' = 'day'): AuthSecurityReport {
    const securityAlerts = analyticsService.getSecurityAlerts(timeRange);
    
    const totalSecurityEvents = securityAlerts.length;
    const criticalAlerts = securityAlerts.filter(a => a.severity === 'critical').length;
    const highAlerts = securityAlerts.filter(a => a.severity === 'high').length;
    const mediumAlerts = securityAlerts.filter(a => a.severity === 'medium').length;
    const lowAlerts = securityAlerts.filter(a => a.severity === 'low').length;

    // Calculate top security events
    const eventCounts: Record<string, { count: number; severity: string }> = {};
    securityAlerts.forEach(alert => {
      const key = alert.type;
      if (!eventCounts[key]) {
        eventCounts[key] = { count: 0, severity: alert.severity };
      }
      eventCounts[key].count++;
    });

    const topSecurityEvents = Object.entries(eventCounts)
      .map(([type, data]) => ({
        type,
        count: data.count,
        severity: data.severity,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Calculate suspicious users
    const userEventCounts: Record<string, { count: number; lastEvent: Date }> = {};
    securityAlerts.forEach(alert => {
      if (alert.userId) {
        if (!userEventCounts[alert.userId]) {
          userEventCounts[alert.userId] = { count: 0, lastEvent: alert.timestamp };
        }
        userEventCounts[alert.userId].count++;
        if (alert.timestamp > userEventCounts[alert.userId].lastEvent) {
          userEventCounts[alert.userId].lastEvent = alert.timestamp;
        }
      }
    });

    const suspiciousUsers = Object.entries(userEventCounts)
      .filter(([_, data]) => data.count >= 3) // Users with 3+ security events
      .map(([userId, data]) => ({
        userId,
        eventCount: data.count,
        lastEvent: data.lastEvent,
      }))
      .sort((a, b) => b.eventCount - a.eventCount)
      .slice(0, 10);

    // Calculate specific metrics
    const rateLimitHits = securityAlerts.filter(a => a.type === 'rate_limit_exceeded').length;
    const multipleFailureUsers = securityAlerts.filter(a => a.type === 'multiple_failures').length;
    const geographicAnomalies = securityAlerts.filter(a => a.type === 'unusual_location').length;

    return {
      timeRange,
      totalSecurityEvents,
      criticalAlerts,
      highAlerts,
      mediumAlerts,
      lowAlerts,
      topSecurityEvents,
      suspiciousUsers,
      rateLimitHits,
      multipleFailureUsers,
      geographicAnomalies,
    };
  }

  /**
   * Get current authentication health status
   */
  public getHealthStatus(): AuthHealthStatus {
    const systemMetrics = monitoringService.getSystemMetrics();
    const authMetrics = analyticsService.getAuthMetrics('hour');
    const recentFlows = this.completedFlows.filter(
      f => f.startTime > new Date(Date.now() - 60 * 60 * 1000) // Last hour
    );

    // Calculate current metrics
    const successRate = authMetrics.successRate;
    const errorRate = authMetrics.failureRate;
    const averageResponseTime = authMetrics.averageAuthTime;
    const activeUsers = authMetrics.uniqueUsers;

    // Determine overall health
    let overall: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    if (successRate < 90 || errorRate > 10 || averageResponseTime > 5000) {
      overall = 'unhealthy';
    } else if (successRate < 95 || errorRate > 5 || averageResponseTime > 3000) {
      overall = 'degraded';
    }

    // Get auth service health
    const authService = systemMetrics?.authServiceHealth.status || 'unknown';

    // Get recent errors
    const recentErrors = authMetrics.topErrors.map(error => ({
      error: error.error,
      count: error.count,
      timestamp: new Date(), // Would be more specific in production
    }));

    // Check for performance issues
    const performanceIssues: Array<{ issue: string; severity: string; timestamp: Date }> = [];
    
    if (averageResponseTime > this.alertThresholds.averageResponseTime) {
      performanceIssues.push({
        issue: 'High average response time',
        severity: 'medium',
        timestamp: new Date(),
      });
    }
    
    if (successRate < this.alertThresholds.successRate) {
      performanceIssues.push({
        issue: 'Low success rate',
        severity: 'high',
        timestamp: new Date(),
      });
    }

    return {
      overall,
      authService: authService as 'healthy' | 'degraded' | 'unhealthy',
      successRate,
      errorRate,
      averageResponseTime,
      activeUsers,
      recentErrors,
      performanceIssues,
    };
  }

  /**
   * Set alert thresholds
   */
  public setAlertThresholds(thresholds: Partial<typeof this.alertThresholds>): void {
    this.alertThresholds = { ...this.alertThresholds, ...thresholds };
    logInfo('AuthMonitoring: Alert thresholds updated', thresholds);
  }

  // Private methods

  private async performAuthHealthCheck(): Promise<void> {
    try {
      const healthStatus = this.getHealthStatus();
      
      // Track health metrics
      analyticsService.trackPerformance('auth_success_rate', healthStatus.successRate, 'percentage');
      analyticsService.trackPerformance('auth_error_rate', healthStatus.errorRate, 'percentage');
      analyticsService.trackPerformance('auth_response_time', healthStatus.averageResponseTime, 'ms');
      analyticsService.trackPerformance('auth_active_users', healthStatus.activeUsers, 'count');

      logInfo('AuthMonitoring: Health check completed', {
        overall: healthStatus.overall,
        successRate: healthStatus.successRate,
        errorRate: healthStatus.errorRate,
        responseTime: healthStatus.averageResponseTime,
      });
    } catch (error) {
      logError('AuthMonitoring: Health check failed', error as Error);
    }
  }

  private checkAlertConditions(): void {
    try {
      const healthStatus = this.getHealthStatus();
      
      // Check success rate threshold
      if (healthStatus.successRate < this.alertThresholds.successRate) {
        this.trackSecurityEvent(
          'low_success_rate',
          'high',
          `Authentication success rate dropped to ${healthStatus.successRate.toFixed(1)}%`,
          undefined,
          { successRate: healthStatus.successRate, threshold: this.alertThresholds.successRate }
        );
      }

      // Check error rate threshold
      if (healthStatus.errorRate > this.alertThresholds.errorRate) {
        this.trackSecurityEvent(
          'high_error_rate',
          'medium',
          `Authentication error rate increased to ${healthStatus.errorRate.toFixed(1)}%`,
          undefined,
          { errorRate: healthStatus.errorRate, threshold: this.alertThresholds.errorRate }
        );
      }

      // Check response time threshold
      if (healthStatus.averageResponseTime > this.alertThresholds.averageResponseTime) {
        this.trackSecurityEvent(
          'slow_response_time',
          'medium',
          `Authentication response time increased to ${healthStatus.averageResponseTime}ms`,
          undefined,
          { responseTime: healthStatus.averageResponseTime, threshold: this.alertThresholds.averageResponseTime }
        );
      }

    } catch (error) {
      logError('AuthMonitoring: Alert check failed', error as Error);
    }
  }

  private cleanupOldData(): void {
    try {
      const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
      
      // Clean up completed flows older than 24 hours
      const initialCount = this.completedFlows.length;
      this.completedFlows = this.completedFlows.filter(flow => flow.startTime >= cutoffTime);
      
      const removedCount = initialCount - this.completedFlows.length;
      if (removedCount > 0) {
        logInfo('AuthMonitoring: Cleaned up old flow data', { removedCount });
      }

      // Clean up stale active flows (older than 1 hour)
      const staleFlowCutoff = new Date(Date.now() - 60 * 60 * 1000);
      const staleFlows: string[] = [];
      
      for (const [flowId, flow] of this.activeFlows.entries()) {
        if (flow.startTime < staleFlowCutoff) {
          staleFlows.push(flowId);
        }
      }
      
      staleFlows.forEach(flowId => {
        this.activeFlows.delete(flowId);
      });
      
      if (staleFlows.length > 0) {
        logInfo('AuthMonitoring: Cleaned up stale active flows', { count: staleFlows.length });
      }

    } catch (error) {
      logError('AuthMonitoring: Data cleanup failed', error as Error);
    }
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
}

// Export singleton instance
export const authMonitoringService = AuthMonitoringService.getInstance();