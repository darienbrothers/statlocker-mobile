/**
 * PerformanceProvider Component - Performance monitoring and optimization
 * 
 * Features:
 * - FPS monitoring and warnings
 * - Memory usage tracking
 * - Bundle size logging
 * - Performance metrics collection
 */
import React, { useEffect, type ReactNode } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { 
  performanceMonitor, 
  logBundleSize, 
  useMemoryMonitor 
} from '@/lib/performance';
import { logInfo, logWarning } from '@/lib/logging';

interface PerformanceProviderProps {
  children: ReactNode;
  enableFPSMonitoring?: boolean;
  enableMemoryMonitoring?: boolean;
  enableBundleSizeLogging?: boolean;
}

export function PerformanceProvider({
  children,
  enableFPSMonitoring = __DEV__,
  enableMemoryMonitoring = __DEV__,
  enableBundleSizeLogging = __DEV__,
}: PerformanceProviderProps) {
  const memoryInfo = useMemoryMonitor();

  useEffect(() => {
    // Log bundle size on startup
    if (enableBundleSizeLogging) {
      logBundleSize();
    }

    // Start FPS monitoring when app becomes active
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (enableFPSMonitoring) {
        if (nextAppState === 'active') {
          performanceMonitor.startMonitoring();
          logInfo('Performance monitoring started');
        } else {
          performanceMonitor.stopMonitoring();
          logInfo('Performance monitoring stopped');
        }
      }
    };

    // Start initial monitoring
    if (enableFPSMonitoring) {
      performanceMonitor.startMonitoring();
    }

    // Listen for app state changes
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      performanceMonitor.stopMonitoring();
      subscription?.remove();
    };
  }, [enableFPSMonitoring, enableBundleSizeLogging]);

  // Log memory warnings
  useEffect(() => {
    if (enableMemoryMonitoring && memoryInfo.isHighMemoryUsage) {
      logWarning('High memory usage detected', {
        usedMemory: `${(memoryInfo.usedMemory / 1024 / 1024).toFixed(2)}MB`,
        totalMemory: `${(memoryInfo.totalMemory / 1024 / 1024).toFixed(2)}MB`,
        percentage: `${((memoryInfo.usedMemory / memoryInfo.totalMemory) * 100).toFixed(1)}%`,
      });
    }
  }, [enableMemoryMonitoring, memoryInfo.isHighMemoryUsage, memoryInfo.usedMemory, memoryInfo.totalMemory]);

  return <>{children}</>;
}

export default PerformanceProvider;