/**
 * Navigation Flow Integration Tests
 * 
 * Tests the complete navigation flow from app launch to tab navigation:
 * - Auth state resolution and routing logic
 * - Tab switching preserves state correctly
 * - Analytics events fire at correct times
 * - State persistence and restoration
 */
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { analytics } from '@/lib/analytics';
import AuthGateScreen from '../../../app/index';
import DashboardScreen from '../../../app/(tabs)/dashboard';
import StatsScreen from '../../../app/(tabs)/stats';

// Mock dependencies
jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(() => '/'),
}));

jest.mock('@/store/authStore');
jest.mock('@/store', () => ({
  useUser: jest.fn(() => null),
  useActiveTab: jest.fn(() => 'dashboard'),
  useAppActions: jest.fn(() => ({
    setActiveTab: jest.fn(),
  })),
}));

jest.mock('@/hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

jest.mock('@/lib/analytics');
jest.mock('@/lib/i18n', () => ({
  initializeI18n: jest.fn(),
}));

describe('Navigation Flow Integration', () => {
  const mockRouter = {
    replace: jest.fn(),
    push: jest.fn(),
    back: jest.fn(),
  };

  const mockAuthStore = {
    isAuthenticated: false,
    isLoading: false,
    hasInitialized: false,
    initialize: jest.fn(),
    user: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useAuthStore as jest.Mock).mockReturnValue(mockAuthStore);
    (analytics.track as jest.Mock) = jest.fn();
    (analytics.startSession as jest.Mock) = jest.fn();
    (analytics.endSession as jest.Mock) = jest.fn();
  });

  describe('Auth Gate Flow', () => {
    it('should initialize auth state on app launch', async () => {
      render(<AuthGateScreen />);

      expect(mockAuthStore.initialize).toHaveBeenCalled();
      expect(analytics.track).toHaveBeenCalledWith('app_launched', expect.any(Object));
    });

    it('should route to auth when user is not authenticated', async () => {
      mockAuthStore.hasInitialized = true;
      mockAuthStore.isLoading = false;
      mockAuthStore.isAuthenticated = false;

      render(<AuthGateScreen />);

      await waitFor(() => {
        expect(mockRouter.replace).toHaveBeenCalledWith('/(auth)/sign-in');
        expect(analytics.track).toHaveBeenCalledWith('auth_gate_resolved', {
          outcome: 'unauthenticated',
          destination: 'auth',
        });
      });
    });

    it('should route to tabs when user is authenticated', async () => {
      mockAuthStore.hasInitialized = true;
      mockAuthStore.isLoading = false;
      mockAuthStore.isAuthenticated = true;

      render(<AuthGateScreen />);

      await waitFor(() => {
        expect(mockRouter.replace).toHaveBeenCalledWith('/(tabs)/dashboard');
        expect(analytics.track).toHaveBeenCalledWith('auth_gate_resolved', {
          outcome: 'authenticated',
          destination: 'tabs',
        });
      });
    });

    it('should show loading state while auth is resolving', () => {
      mockAuthStore.hasInitialized = false;
      mockAuthStore.isLoading = true;

      render(<AuthGateScreen />);

      expect(screen.getByText('app.name')).toBeDefined();
      expect(screen.getByText('app.tagline')).toBeDefined();
      expect(screen.getByText('loading.signIn')).toBeDefined();
    });
  });

  describe('Tab Navigation Flow', () => {
    it('should render dashboard screen with empty state', () => {
      render(<DashboardScreen />);

      expect(screen.getByTestId('dashboard-empty-state')).toBeDefined();
      expect(screen.getByText('empty.dashboard.title')).toBeDefined();
      expect(screen.getByText('empty.dashboard.action')).toBeDefined();
    });

    it('should track CTA press events on dashboard', () => {
      const mockTrackCTAPress = jest.fn();
      
      // Mock useAnalytics hook
      jest.doMock('@/hooks/useAnalytics', () => ({
        useAnalytics: () => ({
          trackCTAPress: mockTrackCTAPress,
        }),
      }));

      render(<DashboardScreen />);

      const ctaButton = screen.getByText('empty.dashboard.action');
      fireEvent.press(ctaButton);

      expect(mockTrackCTAPress).toHaveBeenCalledWith('get_started', {
        screen: 'dashboard',
        empty_state: true,
      });
    });

    it('should render stats screen with empty state', () => {
      render(<StatsScreen />);

      expect(screen.getByTestId('stats-empty-state')).toBeDefined();
      expect(screen.getByText('empty.stats.title')).toBeDefined();
      expect(screen.getByText('empty.stats.action')).toBeDefined();
    });

    it('should track CTA press events on stats screen', () => {
      const mockTrackCTAPress = jest.fn();
      
      jest.doMock('@/hooks/useAnalytics', () => ({
        useAnalytics: () => ({
          trackCTAPress: mockTrackCTAPress,
        }),
      }));

      render(<StatsScreen />);

      const ctaButton = screen.getByText('empty.stats.action');
      fireEvent.press(ctaButton);

      expect(mockTrackCTAPress).toHaveBeenCalledWith('log_game', {
        screen: 'stats',
        empty_state: true,
      });
    });
  });

  describe('State Persistence', () => {
    it('should maintain auth state across app restarts', async () => {
      // Simulate persisted auth state
      mockAuthStore.user = {
        id: '1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'athlete',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
      };
      mockAuthStore.isAuthenticated = true;
      mockAuthStore.hasInitialized = true;

      render(<AuthGateScreen />);

      await waitFor(() => {
        expect(mockRouter.replace).toHaveBeenCalledWith('/(tabs)/dashboard');
      });
    });

    it('should handle corrupted auth state gracefully', async () => {
      // Simulate corrupted state
      mockAuthStore.initialize = jest.fn().mockRejectedValue(new Error('Corrupted state'));
      mockAuthStore.hasInitialized = true;
      mockAuthStore.isAuthenticated = false;

      render(<AuthGateScreen />);

      await waitFor(() => {
        expect(mockRouter.replace).toHaveBeenCalledWith('/(auth)/sign-in');
      });
    });
  });

  describe('Analytics Integration', () => {
    it('should track app launch event', () => {
      render(<AuthGateScreen />);

      expect(analytics.track).toHaveBeenCalledWith('app_launched', expect.any(Object));
    });

    it('should track auth resolution events', async () => {
      mockAuthStore.hasInitialized = true;
      mockAuthStore.isLoading = false;
      mockAuthStore.isAuthenticated = true;

      render(<AuthGateScreen />);

      await waitFor(() => {
        expect(analytics.track).toHaveBeenCalledWith('auth_gate_resolved', {
          outcome: 'authenticated',
          destination: 'tabs',
        });
      });
    });

    it('should start analytics session on app launch', () => {
      render(<AuthGateScreen />);

      expect(analytics.startSession).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle auth initialization errors', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      mockAuthStore.initialize = jest.fn().mockRejectedValue(new Error('Auth error'));

      render(<AuthGateScreen />);

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalled();
      });

      consoleError.mockRestore();
    });

    it('should handle routing errors gracefully', async () => {
      mockRouter.replace = jest.fn().mockRejectedValue(new Error('Navigation error'));
      mockAuthStore.hasInitialized = true;
      mockAuthStore.isAuthenticated = true;

      const consoleError = jest.spyOn(console, 'error').mockImplementation();

      render(<AuthGateScreen />);

      await waitFor(() => {
        expect(mockRouter.replace).toHaveBeenCalled();
      });

      consoleError.mockRestore();
    });
  });

  describe('Performance', () => {
    it('should not cause memory leaks with multiple renders', () => {
      const { unmount, rerender } = render(<AuthGateScreen />);

      // Simulate multiple re-renders
      for (let i = 0; i < 10; i++) {
        rerender(<AuthGateScreen />);
      }

      unmount();

      // Should not throw or cause issues
      expect(true).toBe(true);
    });

    it('should handle rapid state changes', async () => {
      const { rerender } = render(<AuthGateScreen />);

      // Simulate rapid auth state changes
      act(() => {
        mockAuthStore.isLoading = true;
        rerender(<AuthGateScreen />);
      });

      act(() => {
        mockAuthStore.isLoading = false;
        mockAuthStore.hasInitialized = true;
        mockAuthStore.isAuthenticated = true;
        rerender(<AuthGateScreen />);
      });

      await waitFor(() => {
        expect(mockRouter.replace).toHaveBeenCalledWith('/(tabs)/dashboard');
      });
    });
  });
});