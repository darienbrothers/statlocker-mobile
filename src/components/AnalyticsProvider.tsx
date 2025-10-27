/**
 * AnalyticsProvider Component - Sets up analytics for the app
 * 
 * Features:
 * - Initializes analytics tracking
 * - Manages session lifecycle
 * - Provides analytics context to children
 */
import React, { useEffect, type ReactNode } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { analytics } from '@/lib/analytics';
import { useAnalytics } from '@/hooks/useAnalytics';

interface AnalyticsProviderProps {
  children: ReactNode;
  enabled?: boolean;
}

export function AnalyticsProvider({ 
  children, 
  enabled = true 
}: AnalyticsProviderProps) {
  // Initialize analytics hook
  useAnalytics();

  useEffect(() => {
    // Set analytics enabled state
    analytics.setEnabled(enabled);

    // Start session when app becomes active
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        analytics.startSession();
      } else if (nextAppState === 'background' || nextAppState === 'inactive') {
        analytics.endSession();
      }
    };

    // Start initial session
    analytics.startSession();

    // Listen for app state changes
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      // End session and cleanup
      analytics.endSession();
      subscription?.remove();
    };
  }, [enabled]);

  return <>{children}</>;
}

export default AnalyticsProvider;