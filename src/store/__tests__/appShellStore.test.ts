/**
 * App Shell Store Tests
 */
import { renderHook, act } from '@testing-library/react-native';
import { useAppShellStore, useAuth, useAppActions } from '../appShellStore';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
}));

describe('App Shell Store', () => {
  beforeEach(() => {
    // Reset store before each test
    const { result } = renderHook(() => useAppActions());
    act(() => {
      result.current.reset();
    });
  });

  describe('Auth State', () => {
    it('initializes with default auth state', () => {
      const { result } = renderHook(() => useAuth());
      
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.hasCompletedOnboarding).toBe(false);
    });

    it('sets user correctly', () => {
      const { result: authResult } = renderHook(() => useAuth());
      const { result: actionsResult } = renderHook(() => useAppActions());
      
      const testUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'athlete' as const,
      };

      act(() => {
        actionsResult.current.setUser(testUser);
      });

      expect(authResult.current.user).toEqual(testUser);
    });

    it('sets authenticated state correctly', () => {
      const { result: authResult } = renderHook(() => useAuth());
      const { result: actionsResult } = renderHook(() => useAppActions());

      act(() => {
        actionsResult.current.setAuthenticated(true);
      });

      expect(authResult.current.isAuthenticated).toBe(true);
    });

    it('sets loading state correctly', () => {
      const { result: authResult } = renderHook(() => useAuth());
      const { result: actionsResult } = renderHook(() => useAppActions());

      act(() => {
        actionsResult.current.setLoading(true);
      });

      expect(authResult.current.isLoading).toBe(true);
    });

    it('handles sign out correctly', () => {
      const { result: authResult } = renderHook(() => useAuth());
      const { result: actionsResult } = renderHook(() => useAppActions());
      
      // Set up authenticated state
      const testUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'athlete' as const,
      };

      act(() => {
        actionsResult.current.setUser(testUser);
        actionsResult.current.setAuthenticated(true);
      });

      // Sign out
      act(() => {
        actionsResult.current.signOut();
      });

      expect(authResult.current.user).toBeNull();
      expect(authResult.current.isAuthenticated).toBe(false);
    });
  });

  describe('Navigation State', () => {
    it('initializes with default navigation state', () => {
      const { result } = renderHook(() => useAppShellStore());
      
      expect(result.current.navigation.activeTab).toBe('dashboard');
      expect(result.current.navigation.previousRoute).toBeNull();
      expect(result.current.navigation.routeHistory).toEqual([]);
    });

    it('sets active tab correctly', () => {
      const { result } = renderHook(() => useAppShellStore());

      act(() => {
        result.current.actions.setActiveTab('stats');
      });

      expect(result.current.navigation.activeTab).toBe('stats');
    });

    it('manages route history correctly', () => {
      const { result } = renderHook(() => useAppShellStore());

      act(() => {
        result.current.actions.addToHistory('/dashboard');
        result.current.actions.addToHistory('/stats');
        result.current.actions.addToHistory('/goals');
      });

      expect(result.current.navigation.routeHistory).toEqual([
        '/dashboard',
        '/stats',
        '/goals',
      ]);
    });

    it('limits route history to 10 items', () => {
      const { result } = renderHook(() => useAppShellStore());

      // Add 12 routes
      act(() => {
        for (let i = 1; i <= 12; i++) {
          result.current.actions.addToHistory(`/route-${i}`);
        }
      });

      expect(result.current.navigation.routeHistory).toHaveLength(10);
      expect(result.current.navigation.routeHistory[0]).toBe('/route-3');
      expect(result.current.navigation.routeHistory[9]).toBe('/route-12');
    });

    it('clears history correctly', () => {
      const { result } = renderHook(() => useAppShellStore());

      act(() => {
        result.current.actions.addToHistory('/dashboard');
        result.current.actions.addToHistory('/stats');
        result.current.actions.clearHistory();
      });

      expect(result.current.navigation.routeHistory).toEqual([]);
    });
  });

  describe('UI State', () => {
    it('initializes with default UI state', () => {
      const { result } = renderHook(() => useAppShellStore());
      
      expect(result.current.ui.isKeyboardVisible).toBe(false);
      expect(result.current.ui.isOffline).toBe(false);
      expect(result.current.ui.theme).toBe('system');
      expect(result.current.ui.notifications.enabled).toBe(true);
    });

    it('sets keyboard visibility correctly', () => {
      const { result } = renderHook(() => useAppShellStore());

      act(() => {
        result.current.actions.setKeyboardVisible(true);
      });

      expect(result.current.ui.isKeyboardVisible).toBe(true);
    });

    it('sets offline status correctly', () => {
      const { result } = renderHook(() => useAppShellStore());

      act(() => {
        result.current.actions.setOfflineStatus(true);
      });

      expect(result.current.ui.isOffline).toBe(true);
    });

    it('sets theme correctly', () => {
      const { result } = renderHook(() => useAppShellStore());

      act(() => {
        result.current.actions.setTheme('dark');
      });

      expect(result.current.ui.theme).toBe('dark');
    });

    it('updates notification settings correctly', () => {
      const { result } = renderHook(() => useAppShellStore());

      act(() => {
        result.current.actions.updateNotificationSettings({
          sound: false,
          vibration: false,
        });
      });

      expect(result.current.ui.notifications.enabled).toBe(true);
      expect(result.current.ui.notifications.sound).toBe(false);
      expect(result.current.ui.notifications.vibration).toBe(false);
    });
  });

  describe('Store Reset', () => {
    it('resets all state to initial values', () => {
      const { result } = renderHook(() => useAppShellStore());
      
      // Modify state
      act(() => {
        result.current.actions.setUser({
          id: '1',
          email: 'test@example.com',
          name: 'Test User',
          role: 'athlete',
        });
        result.current.actions.setAuthenticated(true);
        result.current.actions.setActiveTab('stats');
        result.current.actions.setKeyboardVisible(true);
      });

      // Reset
      act(() => {
        result.current.actions.reset();
      });

      expect(result.current.auth.user).toBeNull();
      expect(result.current.auth.isAuthenticated).toBe(false);
      expect(result.current.navigation.activeTab).toBe('dashboard');
      expect(result.current.ui.isKeyboardVisible).toBe(false);
    });
  });
});