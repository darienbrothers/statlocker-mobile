/**
 * useAnalytics Hook - React integration for analytics
 * 
 * Features:
 * - Screen view tracking with route changes
 * - Automatic user identification
 * - Session management
 * - Performance-optimized tracking
 */
import { useEffect, useCallback, useRef } from 'react';
import { usePathname } from 'expo-router';
import { analytics, trackScreen, trackTabChange } from '@/lib/analytics';
import { useUser, useActiveTab } from '@/store';

export function useAnalytics() {
  const user = useUser();
  const activeTab = useActiveTab();
  const pathname = usePathname();
  const previousTab = useRef<string>('');
  const previousPath = useRef<string>('');

  // Identify user when available
  useEffect(() => {
    if (user) {
      analytics.identify({
        id: user.id,
        email: user.email,
        role: user.role,
        sport: user.sport,
        position: user.position,
        team: user.team,
      });
    }
  }, [user]);

  // Track screen views on route changes
  useEffect(() => {
    if (pathname && pathname !== previousPath.current) {
      const screenName = getScreenNameFromPath(pathname);
      trackScreen(screenName, {
        path: pathname,
        user_id: user?.id,
        user_role: user?.role,
      });
      previousPath.current = pathname;
    }
  }, [pathname, user]);

  // Track tab changes
  useEffect(() => {
    if (activeTab && activeTab !== previousTab.current && previousTab.current) {
      trackTabChange(previousTab.current, activeTab);
    }
    previousTab.current = activeTab;
  }, [activeTab]);

  // Tracking methods
  const trackEvent = useCallback((eventName: string, properties?: Record<string, any>) => {
    analytics.track(eventName, {
      ...properties,
      user_id: user?.id,
      user_role: user?.role,
      current_tab: activeTab,
      current_path: pathname,
    });
  }, [user, activeTab, pathname]);

  const trackCTAPress = useCallback((ctaName: string, context?: Record<string, any>) => {
    analytics.ctaPress(ctaName, {
      ...context,
      user_id: user?.id,
      current_tab: activeTab,
      current_path: pathname,
    });
  }, [user, activeTab, pathname]);

  const trackButtonPress = useCallback((buttonName: string, context?: Record<string, any>) => {
    analytics.buttonPress(buttonName, {
      ...context,
      user_id: user?.id,
      current_tab: activeTab,
      current_path: pathname,
    });
  }, [user, activeTab, pathname]);

  return {
    trackEvent,
    trackCTAPress,
    trackButtonPress,
    analytics,
  };
}

// Helper function to convert paths to screen names
function getScreenNameFromPath(path: string): string {
  // Remove leading slash and convert to screen name
  const cleanPath = path.replace(/^\//, '');
  
  // Map common paths to screen names
  const pathMap: Record<string, string> = {
    '': 'Auth Gate',
    '(auth)/sign-in': 'Sign In',
    '(auth)/onboarding': 'Onboarding',
    '(auth)/onboarding/profile': 'Onboarding Profile',
    '(auth)/onboarding/goals': 'Onboarding Goals',
    '(auth)/onboarding/notifications': 'Onboarding Notifications',
    '(tabs)/dashboard': 'Dashboard',
    '(tabs)/stats': 'Stats',
    '(tabs)/goals': 'Goals',
    '(tabs)/recruiting': 'Recruiting',
  };

  return pathMap[cleanPath] || cleanPath || 'Unknown Screen';
}

export default useAnalytics;