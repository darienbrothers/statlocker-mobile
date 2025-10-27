/**
 * useAnalytics Hook Tests
 */
import { renderHook, act } from '@testing-library/react-native';
import { useAnalytics } from '../useAnalytics';
import { analytics } from '@/lib/analytics';
import { useUser, useActiveTab } from '@/store';

// Mock dependencies
jest.mock('expo-router', () => ({
  usePathname: jest.fn(),
}));

jest.mock('@/lib/analytics', () => ({
  analytics: {
    identify: jest.fn(),
    track: jest.fn(),
    ctaPress: jest.fn(),
    buttonPress: jest.fn(),
  },
  trackScreen: jest.fn(),
  trackTabChange: jest.fn(),
}));

jest.mock('@/store', () => ({
  useUser: jest.fn(),
  useActiveTab: jest.fn(),
}));

const mockUsePathname = require('expo-router').usePathname;
const mockTrackScreen = require('@/lib/analytics').trackScreen;
const mockTrackTabChange = require('@/lib/analytics').trackTabChange;
const mockUseUser = useUser as jest.Mock;
const mockUseActiveTab = useActiveTab as jest.Mock;

describe('useAnalytics Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePathname.mockReturnValue('/dashboard');
    mockUseUser.mockReturnValue(null);
    mockUseActiveTab.mockReturnValue('dashboard');
  });

  it('identifies user when available', () => {
    const testUser = {
      id: '123',
      email: 'test@example.com',
      role: 'athlete' as const,
      sport: 'lacrosse',
    };

    mockUseUser.mockReturnValue(testUser);

    renderHook(() => useAnalytics());

    expect(analytics.identify).toHaveBeenCalledWith({
      id: '123',
      email: 'test@example.com',
      role: 'athlete',
      sport: 'lacrosse',
      position: undefined,
      team: undefined,
    });
  });

  it('tracks screen views on path changes', () => {
    const { rerender } = renderHook(() => useAnalytics());

    // Change pathname
    mockUsePathname.mockReturnValue('/(tabs)/stats');
    rerender({});

    expect(mockTrackScreen).toHaveBeenCalledWith(
      'Stats',
      expect.objectContaining({
        path: '/(tabs)/stats',
      })
    );
  });

  it('tracks tab changes', () => {
    const { rerender } = renderHook(() => useAnalytics());

    // Change active tab
    mockUseActiveTab.mockReturnValue('stats');
    rerender({});

    expect(mockTrackTabChange).toHaveBeenCalledWith('dashboard', 'stats');
  });

  it('provides tracking methods with context', () => {
    const testUser = {
      id: '123',
      role: 'athlete' as const,
    };

    mockUseUser.mockReturnValue(testUser);
    mockUseActiveTab.mockReturnValue('dashboard');
    mockUsePathname.mockReturnValue('/dashboard');

    const { result } = renderHook(() => useAnalytics());

    act(() => {
      result.current.trackEvent('test_event', { custom: 'property' });
    });

    expect(analytics.track).toHaveBeenCalledWith('test_event', {
      custom: 'property',
      user_id: '123',
      user_role: 'athlete',
      current_tab: 'dashboard',
      current_path: '/dashboard',
    });
  });

  it('provides CTA tracking with context', () => {
    const testUser = { id: '123', role: 'athlete' as const };

    mockUseUser.mockReturnValue(testUser);
    mockUseActiveTab.mockReturnValue('dashboard');

    const { result } = renderHook(() => useAnalytics());

    act(() => {
      result.current.trackCTAPress('sign_up', { source: 'header' });
    });

    expect(analytics.ctaPress).toHaveBeenCalledWith('sign_up', {
      source: 'header',
      user_id: '123',
      user_role: 'athlete',
      current_tab: 'dashboard',
      current_path: '/dashboard',
    });
  });

  it('provides button tracking with context', () => {
    const { result } = renderHook(() => useAnalytics());

    act(() => {
      result.current.trackButtonPress('save', { form: 'profile' });
    });

    expect(analytics.buttonPress).toHaveBeenCalledWith('save', {
      form: 'profile',
      user_id: null,
      user_role: undefined,
      current_tab: 'dashboard',
      current_path: '/dashboard',
    });
  });

  it('handles screen name mapping correctly', () => {
    const pathMappings = [
      { path: '', expected: 'Auth Gate' },
      { path: '(auth)/sign-in', expected: 'Sign In' },
      { path: '(auth)/onboarding', expected: 'Onboarding' },
      { path: '(tabs)/dashboard', expected: 'Dashboard' },
      { path: '(tabs)/stats', expected: 'Stats' },
      { path: 'unknown/path', expected: 'unknown/path' },
    ];

    pathMappings.forEach(({ path, expected }) => {
      mockUsePathname.mockReturnValue(`/${path}`);
      
      const { rerender } = renderHook(() => useAnalytics());
      rerender({});

      expect(mockTrackScreen).toHaveBeenCalledWith(
        expected,
        expect.any(Object)
      );
    });
  });

  it('does not track tab change on initial render', () => {
    renderHook(() => useAnalytics());

    // Should not track tab change on first render
    expect(mockTrackTabChange).not.toHaveBeenCalled();
  });

  it('handles null user gracefully', () => {
    mockUseUser.mockReturnValue(null);

    const { result } = renderHook(() => useAnalytics());

    act(() => {
      result.current.trackEvent('test_event');
    });

    expect(analytics.track).toHaveBeenCalledWith('test_event', {
      user_id: null,
      user_role: undefined,
      current_tab: 'dashboard',
      current_path: '/dashboard',
    });
  });
});