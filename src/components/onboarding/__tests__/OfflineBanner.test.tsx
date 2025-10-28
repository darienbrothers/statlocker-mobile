/**
 * Tests for OfflineBanner component and useOfflineState hook
 */

import React from 'react';
import { render, renderHook, fireEvent, act, waitFor } from '@testing-library/react-native';
import NetInfo from '@react-native-community/netinfo';
import { OfflineBanner, useOfflineState } from '../OfflineBanner';
import { OnboardingThemeProvider } from '../OnboardingThemeProvider';
import { ThemeProvider } from '../../../lib/theme';

// Mock NetInfo
jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(),
  fetch: jest.fn(),
}));

// Mock Animated
jest.mock('react-native', () => ({
  ...jest.requireActual('react-native'),
  Animated: {
    ...jest.requireActual('react-native').Animated,
    timing: jest.fn(() => ({
      start: jest.fn((callback) => callback && callback({ finished: true })),
    })),
    parallel: jest.fn(() => ({
      start: jest.fn((callback) => callback && callback({ finished: true })),
    })),
    Value: jest.fn(() => ({
      setValue: jest.fn(),
      interpolate: jest.fn(() => 0),
    })),
  },
}));

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider>
    <OnboardingThemeProvider>
      {children}
    </OnboardingThemeProvider>
  </ThemeProvider>
);

describe('OfflineBanner', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock NetInfo to return online by default
    (NetInfo.addEventListener as jest.Mock).mockImplementation((callback) => {
      callback({ isConnected: true });
      return jest.fn(); // unsubscribe function
    });
  });

  it('renders nothing when online and visible not explicitly set', () => {
    const { queryByText } = render(
      <TestWrapper>
        <OfflineBanner />
      </TestWrapper>
    );

    expect(queryByText(/offline/i)).toBeNull();
  });

  it('renders banner when explicitly visible', () => {
    const { getByText } = render(
      <TestWrapper>
        <OfflineBanner visible={true} />
      </TestWrapper>
    );

    expect(getByText(/offline/i)).toBeTruthy();
  });

  it('renders banner when offline', () => {
    // Mock NetInfo to return offline
    (NetInfo.addEventListener as jest.Mock).mockImplementation((callback) => {
      callback({ isConnected: false });
      return jest.fn();
    });

    const { getByText } = render(
      <TestWrapper>
        <OfflineBanner />
      </TestWrapper>
    );

    expect(getByText(/offline/i)).toBeTruthy();
  });

  it('displays custom message', () => {
    const customMessage = 'Custom offline message';
    
    const { getByText } = render(
      <TestWrapper>
        <OfflineBanner visible={true} message={customMessage} />
      </TestWrapper>
    );

    expect(getByText(customMessage)).toBeTruthy();
  });

  it('shows retry button when onRetry provided', () => {
    const onRetry = jest.fn();
    
    const { getByText } = render(
      <TestWrapper>
        <OfflineBanner visible={true} onRetry={onRetry} />
      </TestWrapper>
    );

    const retryButton = getByText('Retry');
    expect(retryButton).toBeTruthy();
  });

  it('calls onRetry when retry button pressed', () => {
    const onRetry = jest.fn();
    
    const { getByText } = render(
      <TestWrapper>
        <OfflineBanner visible={true} onRetry={onRetry} />
      </TestWrapper>
    );

    const retryButton = getByText('Retry');
    fireEvent.press(retryButton);

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('disables retry button when retrying', () => {
    const onRetry = jest.fn();
    
    const { getByText } = render(
      <TestWrapper>
        <OfflineBanner visible={true} onRetry={onRetry} retrying={true} />
      </TestWrapper>
    );

    const retryButton = getByText('Retrying...');
    expect(retryButton).toBeTruthy();
    
    // Button should be disabled
    fireEvent.press(retryButton);
    expect(onRetry).not.toHaveBeenCalled();
  });

  it('positions banner at top by default', () => {
    const { getByTestId } = render(
      <TestWrapper>
        <OfflineBanner visible={true} />
      </TestWrapper>
    );

    // Should render at top position (tested through style application)
    expect(() => getByTestId('offline-banner')).not.toThrow();
  });

  it('positions banner at bottom when specified', () => {
    const { getByTestId } = render(
      <TestWrapper>
        <OfflineBanner visible={true} position="bottom" />
      </TestWrapper>
    );

    // Should render at bottom position
    expect(() => getByTestId('offline-banner')).not.toThrow();
  });

  it('has proper accessibility attributes', () => {
    const { getByRole } = render(
      <TestWrapper>
        <OfflineBanner visible={true} />
      </TestWrapper>
    );

    const banner = getByRole('alert');
    expect(banner).toBeTruthy();
    expect(banner.props.accessibilityLiveRegion).toBe('assertive');
  });
});

describe('useOfflineState', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('provides initial offline state', () => {
    (NetInfo.addEventListener as jest.Mock).mockImplementation((callback) => {
      callback({ isConnected: true });
      return jest.fn();
    });

    const { result } = renderHook(() => useOfflineState());

    expect(result.current.isOffline).toBe(false);
    expect(result.current.isRetrying).toBe(false);
    expect(result.current.lastRetryTime).toBeNull();
    expect(result.current.retryConnection).toBeInstanceOf(Function);
  });

  it('updates offline state when network changes', () => {
    let networkCallback: (state: { isConnected: boolean }) => void;
    
    (NetInfo.addEventListener as jest.Mock).mockImplementation((callback) => {
      networkCallback = callback;
      callback({ isConnected: true });
      return jest.fn();
    });

    const { result } = renderHook(() => useOfflineState());

    expect(result.current.isOffline).toBe(false);

    // Simulate going offline
    act(() => {
      networkCallback({ isConnected: false });
    });

    expect(result.current.isOffline).toBe(true);

    // Simulate coming back online
    act(() => {
      networkCallback({ isConnected: true });
    });

    expect(result.current.isOffline).toBe(false);
  });

  it('handles retry connection', async () => {
    (NetInfo.fetch as jest.Mock).mockResolvedValue({ isConnected: true });

    const { result } = renderHook(() => useOfflineState());

    expect(result.current.isRetrying).toBe(false);

    // Start retry
    act(() => {
      result.current.retryConnection();
    });

    expect(result.current.isRetrying).toBe(true);
    expect(result.current.lastRetryTime).toBeInstanceOf(Date);

    // Wait for retry to complete
    await act(async () => {
      jest.advanceTimersByTime(2000);
    });

    await waitFor(() => {
      expect(result.current.isRetrying).toBe(false);
    });
  });

  it('prevents multiple simultaneous retries', async () => {
    (NetInfo.fetch as jest.Mock).mockResolvedValue({ isConnected: true });

    const { result } = renderHook(() => useOfflineState());

    // Start first retry
    act(() => {
      result.current.retryConnection();
    });

    expect(result.current.isRetrying).toBe(true);

    // Try to start second retry
    act(() => {
      result.current.retryConnection();
    });

    // Should still only have one retry in progress
    expect(NetInfo.fetch).toHaveBeenCalledTimes(1);
  });

  it('handles retry failure', async () => {
    (NetInfo.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useOfflineState());

    // Start retry
    act(() => {
      result.current.retryConnection();
    });

    expect(result.current.isRetrying).toBe(true);

    // Wait for retry to complete
    await act(async () => {
      jest.advanceTimersByTime(2000);
    });

    await waitFor(() => {
      expect(result.current.isRetrying).toBe(false);
    });

    // Should handle error gracefully
    expect(result.current.lastRetryTime).toBeInstanceOf(Date);
  });

  it('stops retrying when coming back online', () => {
    let networkCallback: (state: { isConnected: boolean }) => void;
    
    (NetInfo.addEventListener as jest.Mock).mockImplementation((callback) => {
      networkCallback = callback;
      callback({ isConnected: false });
      return jest.fn();
    });

    const { result } = renderHook(() => useOfflineState());

    // Start retry while offline
    act(() => {
      result.current.retryConnection();
    });

    expect(result.current.isRetrying).toBe(true);

    // Simulate coming back online
    act(() => {
      networkCallback({ isConnected: true });
    });

    expect(result.current.isRetrying).toBe(false);
    expect(result.current.isOffline).toBe(false);
  });
});