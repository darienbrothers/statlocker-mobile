/**
 * Monitoring Service
 * 
 * Provides performance monitoring, health checks, and system
 * monitoring for the authentication system.
 */

import { logInfo, logError } from '@/lib/logging';
import { analyticsService } from './AnalyticsService';

export interface HealthCheck {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number;
  timestamp: Date;
  details?: Record<string, any>;
  error?: string;
}

export interface SystemMetrics {
  authServiceHealth: HealthCheck;
  databaseHealth: HealthCheck;
  networkHealth: HealthCheck;
  overallHealth: 'healthy' | 'degraded' | 'unhealthy';
  uptime: number;
  lastChecked: Date;
}

export interface PerformanceThresholds {
  authResponseTime: number; // ms
  databaseQueryTime: number; // ms
  networkRequestTime: number; // ms
  errorRate: number; // percentage
  successRate: number; // percentage
}

export class MonitoringService {
  private static instance: MonitoringService;
  private healthChecks: Map<string, HealthCheck> = new Map();
  private isMonitoring: boolean = false;
  private monitoringInterval?: NodeJS.Timeout;
  
  private thresholds: PerformanceThresholds = {
    authResponseTime: 3000, // 3 seconds
    databaseQueryTime: 1000, // 1 second
    networkRequestTime: 5000, // 5 seconds
    errorRate: 5, // 5%
    successRate: 95, // 95%
  };

  private constructor() {}

  public static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService();
    }
    return MonitoringService.instance;
  }

  /**
   * Start monitoring system health
   */
  public startMonitoring(intervalMs: number = 60000): void {
    if (this.isMonitoring) {
      return;
    }

    this.isMonitoring = true;
    
    // Run initial health check
    this.runHealthChecks();
    
    // Set up periodic monitoring
    this.monitoringInterval = setInterval(() => {
      this.runHealthChecks();
    }, intervalMs);

    logInfo('Monitoring: Service started', { intervalMs });
  }

  /**
   * Stop monitoring
   */
  public stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }
    
    this.isMonitoring = false;
    logInfo('Monitoring: Service stopped');
  }

  /**
   * Run all health checks
   */
  public async runHealthChecks(): Promise<SystemMetrics> {
    try {
      const startTime = Date.now();

      // Run individual health checks
      const [authHealth, dbHealth, networkHealth] = await Promise.allSettled([
        this.checkAuthServiceHealth(),
        this.checkDatabaseHealth(),
        this.checkNetworkHealth(),
      ]);

      // Process results
      const authServiceHealth = authHealth.status === 'fulfilled' 
        ? authHealth.value 
        : this.createFailedHealthCheck('auth_service', authHealth.reason);

      const databaseHealth = dbHealth.status === 'fulfilled' 
        ? dbHealth.value 
        : this.createFailedHealthCheck('database', dbHealth.reason);

      const networkServiceHealth = networkHealth.status === 'fulfilled' 
        ? networkHealth.value 
        : this.createFailedHealthCheck('network', networkHealth.reason);

      // Store health checks
      this.healthChecks.set('auth_service', authServiceHealth);
      this.healthChecks.set('database', databaseHealth);
      this.healthChecks.set('network', networkServiceHealth);

      // Determine overall health
      const overallHealth = this.calculateOverallHealth([
        authServiceHealth,
        databaseHealth,
        networkServiceHealth,
      ]);

      const metrics: SystemMetrics = {
        authServiceHealth,
        databaseHealth,
        networkHealth: networkServiceHealth,
        overallHealth,
        uptime: Date.now() - startTime,
        lastChecked: new Date(),
      };

      // Track performance
      analyticsService.trackPerformance('health_check_duration', Date.now() - startTime, 'ms');

      // Alert on health issues
      this.checkHealthAlerts(metrics);

      logInfo('Monitoring: Health checks completed', {
        overallHealth,
        authHealth: authServiceHealth.status,
        dbHealth: databaseHealth.status,
        networkHealth: networkHealth.status,
      });

      return metrics;
    } catch (error) {
      logError('Monitoring: Health check failed', error as Error);
      throw error;
    }
  }

  /**
   * Get current system metrics
   */
  public getSystemMetrics(): SystemMetrics | null {
    const authHealth = this.healthChecks.get('auth_service');
    const dbHealth = this.healthChecks.get('database');
    const networkHealth = this.healthChecks.get('network');

    if (!authHealth || !dbHealth || !networkHealth) {
      return null;
    }

    return {
      authServiceHealth: authHealth,
      databaseHealth: dbHealth,
      networkHealth: networkHealth,
      overallHealth: this.calculateOverallHealth([authHealth, dbHealth, networkHealth]),
      uptime: 0, // Would be calculated from app start time
      lastChecked: new Date(),
    };
  }

  /**
   * Set performance thresholds
   */
  public setThresholds(thresholds: Partial<PerformanceThresholds>): void {
    this.thresholds = { ...this.thresholds, ...thresholds };
    logInfo('Monitoring: Thresholds updated', thresholds);
  }

  /**
   * Check if metric exceeds threshold
   */
  public checkThreshold(metricName: keyof PerformanceThresholds, value: number): boolean {
    const threshold = this.thresholds[metricName];
    return value > threshold;
  }

  // Private health check methods

  private async checkAuthServiceHealth(): Promise<HealthCheck> {
    const startTime = Date.now();
    
    try {
      // Test basic auth service functionality
      // This is a simplified check - in production you'd test actual endpoints
      const responseTime = Date.now() - startTime;
      
      const status = responseTime > this.thresholds.authResponseTime ? 'degraded' : 'healthy';
      
      return {
        name: 'auth_service',
        status,
        responseTime,
        timestamp: new Date(),
        details: {
          threshold: this.thresholds.authResponseTime,
          withinThreshold: responseTime <= this.thresholds.authResponseTime,
        },
      };
    } catch (error) {
      return {
        name: 'auth_service',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        timestamp: new Date(),
        error: (error as Error).message,
      };
    }
  }

  private async checkDatabaseHealth(): Promise<HealthCheck> {
    const startTime = Date.now();
    
    try {
      // Test database connectivity
      // This is a placeholder - in production you'd test actual database queries
      await new Promise(resolve => setTimeout(resolve, 100)); // Simulate DB query
      
      const responseTime = Date.now() - startTime;
      const status = responseTime > this.thresholds.databaseQueryTime ? 'degraded' : 'healthy';
      
      return {
        name: 'database',
        status,
        responseTime,
        timestamp: new Date(),
        details: {
          threshold: this.thresholds.databaseQueryTime,
          withinThreshold: responseTime <= this.thresholds.databaseQueryTime,
        },
      };
    } catch (error) {
      return {
        name: 'database',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        timestamp: new Date(),
        error: (error as Error).message,
      };
    }
  }

  private async checkNetworkHealth(): Promise<HealthCheck> {
    const startTime = Date.now();
    
    try {
      // Test network connectivity
      // This is a placeholder - in production you'd test actual network requests
      await new Promise(resolve => setTimeout(resolve, 200)); // Simulate network request
      
      const responseTime = Date.now() - startTime;
      const status = responseTime > this.thresholds.networkRequestTime ? 'degraded' : 'healthy';
      
      return {
        name: 'network',
        status,
        responseTime,
        timestamp: new Date(),
        details: {
          threshold: this.thresholds.networkRequestTime,
          withinThreshold: responseTime <= this.thresholds.networkRequestTime,
        },
      };
    } catch (error) {
      return {
        name: 'network',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        timestamp: new Date(),
        error: (error as Error).message,
      };
    }
  }

  private createFailedHealthCheck(name: string, error: any): HealthCheck {
    return {
      name,
      status: 'unhealthy',
      responseTime: 0,
      timestamp: new Date(),
      error: error?.message || 'Health check failed',
    };
  }

  private calculateOverallHealth(healthChecks: HealthCheck[]): 'healthy' | 'degraded' | 'unhealthy' {
    const unhealthyCount = healthChecks.filter(h => h.status === 'unhealthy').length;
    const degradedCount = healthChecks.filter(h => h.status === 'degraded').length;

    if (unhealthyCount > 0) {
      return 'unhealthy';
    } else if (degradedCount > 0) {
      return 'degraded';
    } else {
      return 'healthy';
    }
  }

  private checkHealthAlerts(metrics: SystemMetrics): void {
    // Alert on unhealthy systems
    if (metrics.overallHealth === 'unhealthy') {
      analyticsService.trackSecurityEvent(
        'system_unhealthy',
        'high',
        'System health check failed',
        undefined,
        {
          authHealth: metrics.authServiceHealth.status,
          dbHealth: metrics.databaseHealth.status,
          networkHealth: metrics.networkHealth.status,
        }
      );
    }

    // Alert on degraded performance
    if (metrics.overallHealth === 'degraded') {
      analyticsService.trackSecurityEvent(
        'system_degraded',
        'medium',
        'System performance degraded',
        undefined,
        {
          authResponseTime: metrics.authServiceHealth.responseTime,
          dbResponseTime: metrics.databaseHealth.responseTime,
          networkResponseTime: metrics.networkHealth.responseTime,
        }
      );
    }
  }
}

// Export singleton instance
export const monitoringService = MonitoringService.getInstance();