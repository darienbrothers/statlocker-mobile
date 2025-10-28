/**
 * Authentication Monitoring Hook
 * 
 * Provides easy integration of authentication monitoring
 * into React components with automatic flow tracking,
 * performance monitoring, and health status reporting.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  authMonitoringService,
  AuthFlowMetrics, 
  AuthPerformanceReport, 
  AuthSecurityReport, 
  AuthHealthStatus 
} from '@/services/AuthMonitoringService';
import { logInfo, logError } from '@/lib/logging';

export interface UseAuthMonitoringOptions {
  autoStart?: boolean;
  flowType?: AuthFlowMetrics['flowType'];
  method?: AuthFlowMetrics['method'];
  metadata?: Record<string, any>;
}

export interface AuthMonitoringState {
  isTracking: boolean;
  flowId: string | null;
  startTime: Date | null;
  duration: number | null;
  healthStatus: AuthHealthStatus | null;
  performanceReport: AuthPerformanceReport | null;
  securityReport: AuthSecurityReport | null;
  isLoading: boolean;
  error: string | null;
}

export interface AuthMonitoringActions {
  startFlow: (flowType: AuthFlowMetrics['flowType'], method: AuthFlowMetrics['method'], metadata?: Record<string, any>) => string;
  completeFlow: (success: boolean, userId?: string, errorCode?: string, errorMessage?: string, metadata?: Record<string, any>) => void;
  trackSecurityEvent: (type: string, severity: 'low' | 'medium' | 'high' | 'critical', description: string, userId?: string, metadata?: Record<string, any>) => void;
  refreshHealthStatus: () => Promise<void>;
  refreshPerformanceReport: (timeRange?: 'hour' | 'day' | 'week' | 'month') => Promise<void>;
  refreshSecurityReport: (timeRange?: 'hour' | 'day' | 'week' | 'month') => Promise<void>;
  reset: () => void;
}

/**
 * Hook for authentication monitoring integration
 */
export function useAuthMonitoring(options: UseAuthMonitoringOptions = {}): {
  state: AuthMonitoringState;
  actions: AuthMonitoringActions;
} {
  const [state, setState] = useState<AuthMonitoringState>({
    isTracking: false,
    flowId: null,
    startTime: null,
    duration: null,
    healthStatus: null,
    performanceReport: null,
    securityReport: null,
    isLoading: false,
    error: null,
  });

  const flowIdRef = useRef<string | null>(null);
  const startTimeRef = useRef<Date | null>(null);

  // Auto-start flow if configured
  useEffect(() => {
    if (options.autoStart && options.flowType && options.method) {
      const flowId = generateFlowId();
      startFlow(options.flowType, options.method, options.metadata);
    }
  }, [options.autoStart, options.flowType, options.method]);

  // Start authentication flow tracking
  const startFlow = useCallback((
    flowType: AuthFlowMetrics['flowType'],
    method: AuthFlowMetrics['method'],
    metadata: Record<string, any> = {}
  ): string => {
    try {
      const flowId = generateFlowId();
      const startTime = new Date();
      
      flowIdRef.current = flowId;
      startTimeRef.current = startTime;
      
      authMonitoringService.startAuthFlow(flowId, flowType, method, metadata);
      
      setState(prev => ({
        ...prev,
        isTracking: true,
        flowId,
        startTime,
        duration: null,
        error: null,
      }));
      
      logInfo('useAuthMonitoring: Flow started', { flowId, flowType, method });
      return flowId;
    } catch (error) {
      const errorMessage = (error as Error).message;
      setState(prev => ({ ...prev, error: errorMessage }));
      logError('useAuthMonitoring: Failed to start flow', error as Error);
      throw error;
    }
  }, []);

  // Complete authentication flow tracking
  const completeFlow = useCallback((
    success: boolean,
    userId?: string,
    errorCode?: string,
    errorMessage?: string,
    metadata: Record<string, any> = {}
  ): void => {
    try {
      const flowId = flowIdRef.current;
      const startTime = startTimeRef.current;
      
      if (!flowId || !startTime) {
        throw new Error('No active flow to complete');
      }
      
      const duration = Date.now() - startTime.getTime();
      
      authMonitoringService.completeAuthFlow(
        flowId,
        success,
        userId,
        errorCode,
        errorMessage,
        metadata
      );
      
      setState(prev => ({
        ...prev,
        isTracking: false,
        duration,
        error: null,
      }));
      
      // Clear refs
      flowIdRef.current = null;
      startTimeRef.current = null;
      
      logInfo('useAuthMonitoring: Flow completed', {
        flowId,
        success,
        duration,
        errorCode,
      });
    } catch (error) {
      const errorMessage = (error as Error).message;
      setState(prev => ({ ...prev, error: errorMessage }));
      logError('useAuthMonitoring: Failed to complete flow', error as Error);
    }
  }, []);

  // Track security event
  const trackSecurityEvent = useCallback((
    type: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    description: string,
    userId?: string,
    metadata: Record<string, any> = {}
  ): void => {
    try {
      authMonitoringService.trackSecurityEvent(type, severity, description, userId, metadata);
      logInfo('useAuthMonitoring: Security event tracked', { type, severity, userId });
    } catch (error) {
      const errorMessage = (error as Error).message;
      setState(prev => ({ ...prev, error: errorMessage }));
      logError('useAuthMonitoring: Failed to track security event', error as Error);
    }
  }, []);

  // Refresh health status
  const refreshHealthStatus = useCallback(async (): Promise<void> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const healthStatus = authMonitoringService.getHealthStatus();
      
      setState(prev => ({
        ...prev,
        healthStatus,
        isLoading: false,
      }));
    } catch (error) {
      const errorMessage = (error as Error).message;
      setState(prev => ({
        ...prev,
        error: errorMessage,
        isLoading: false,
      }));
      logError('useAuthMonitoring: Failed to refresh health status', error as Error);
    }
  }, []);

  // Refresh performance report
  const refreshPerformanceReport = useCallback(async (
    timeRange: 'hour' | 'day' | 'week' | 'month' = 'day'
  ): Promise<void> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const performanceReport = authMonitoringService.getPerformanceReport(timeRange);
      
      setState(prev => ({
        ...prev,
        performanceReport,
        isLoading: false,
      }));
    } catch (error) {
      const errorMessage = (error as Error).message;
      setState(prev => ({
        ...prev,
        error: errorMessage,
        isLoading: false,
      }));
      logError('useAuthMonitoring: Failed to refresh performance report', error as Error);
    }
  }, []);

  // Refresh security report
  const refreshSecurityReport = useCallback(async (
    timeRange: 'hour' | 'day' | 'week' | 'month' = 'day'
  ): Promise<void> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const securityReport = authMonitoringService.getSecurityReport(timeRange);
      
      setState(prev => ({
        ...prev,
        securityReport,
        isLoading: false,
      }));
    } catch (error) {
      const errorMessage = (error as Error).message;
      setState(prev => ({
        ...prev,
        error: errorMessage,
        isLoading: false,
      }));
      logError('useAuthMonitoring: Failed to refresh security report', error as Error);
    }
  }, []);

  // Reset monitoring state
  const reset = useCallback((): void => {
    flowIdRef.current = null;
    startTimeRef.current = null;
    
    setState({
      isTracking: false,
      flowId: null,
      startTime: null,
      duration: null,
      healthStatus: null,
      performanceReport: null,
      securityReport: null,
      isLoading: false,
      error: null,
    });
    
    logInfo('useAuthMonitoring: State reset');
  }, []);

  return {
    state,
    actions: {
      startFlow,
      completeFlow,
      trackSecurityEvent,
      refreshHealthStatus,
      refreshPerformanceReport,
      refreshSecurityReport,
      reset,
    },
  };
}

/**
 * Hook for simplified authentication flow tracking
 */
export function useAuthFlowTracking(
  flowType: AuthFlowMetrics['flowType'],
  method: AuthFlowMetrics['method'],
  metadata?: Record<string, any>
) {
  const { state, actions } = useAuthMonitoring();
  const [hasStarted, setHasStarted] = useState(false);

  // Auto-start flow on mount
  useEffect(() => {
    if (!hasStarted) {
      actions.startFlow(flowType, method, metadata);
      setHasStarted(true);
    }
  }, [flowType, method, metadata, hasStarted, actions]);

  // Auto-cleanup on unmount
  useEffect(() => {
    return () => {
      if (state.isTracking) {
        // Complete flow as cancelled if still tracking
        actions.completeFlow(false, undefined, 'cancelled', 'Flow cancelled due to component unmount');
      }
    };
  }, []);

  return {
    isTracking: state.isTracking,
    flowId: state.flowId,
    duration: state.duration,
    error: state.error,
    completeFlow: actions.completeFlow,
    trackSecurityEvent: actions.trackSecurityEvent,
  };
}

/**
 * Hook for authentication health monitoring
 */
export function useAuthHealthMonitoring(refreshInterval: number = 30000) {
  const { state, actions } = useAuthMonitoring();
  const [isMonitoring, setIsMonitoring] = useState(false);

  // Start monitoring
  const startMonitoring = useCallback(() => {
    if (!isMonitoring) {
      setIsMonitoring(true);
      actions.refreshHealthStatus();
    }
  }, [isMonitoring, actions]);

  // Stop monitoring
  const stopMonitoring = useCallback(() => {
    setIsMonitoring(false);
  }, []);

  // Auto-refresh health status
  useEffect(() => {
    if (!isMonitoring) return;

    const interval = setInterval(() => {
      actions.refreshHealthStatus();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [isMonitoring, refreshInterval, actions]);

  return {
    healthStatus: state.healthStatus,
    isLoading: state.isLoading,
    error: state.error,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    refreshHealthStatus: actions.refreshHealthStatus,
  };
}

// Helper function to generate unique flow IDs
function generateFlowId(): string {
  return `flow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export default useAuthMonitoring;