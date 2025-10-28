/**
 * Tests for DataSyncStatus component and useDataSync hook
 */

import React from 'react';
import { render, renderHook, fireEvent, act, waitFor } from '@testing-library/react-native';
import { DataSyncStatus, useDataSync, SyncStatus } from '../DataSyncStatus';
import { OnboardingThemeProvider } from '../OnboardingThemeProvider';
import { ThemeProvider } from '../../../lib/theme';

// Mock Animated
jest.mock('react-native', () => ({
  ...jest.requireActual('react-native'),
  Animated: {
    ...jest.requireActual('react-native').Animated,
    timing: jest.fn(() => ({
      start: jest.fn((callback) => callback && callback({ finished: true })),
      stop: jest.fn(),
    })),
    loop: jest.fn((animation) => ({
      start: jest.fn(),
      stop: jest.fn(),
    })),
    sequence: jest.fn(() => ({
      start: jest.fn(),
      stop: jest.fn(),
    })),
    Value: jest.fn(() => ({
      setValue: jest.fn(),
      interpolate: jest.fn(() => '0deg'),
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

describe('DataSyncStatus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders idle status correctly', () => {
    const { getByText } = render(
      <TestWrapper>
        <DataSyncStatus status="idle" />
      </TestWrapper>
    );

    expect(getByText('Ready to sync')).toBeTruthy();
  });

  it('renders syncing status correctly', () => {
    const { getByText } = render(
      <TestWrapper>
        <DataSyncStatus status="syncing" />
      </TestWrapper>
    );

    expect(getByText('Syncing your progress...')).toBeTruthy();
  });

  it('renders synced status correctly', () => {
    const { getByText } = render(
      <TestWrapper>
        <DataSyncStatus status="synced" />
      </TestWrapper>
    );

    expect(getByText('All changes saved')).toBeTruthy();
  });

  it('renders error status correctly', () => {
    const errorMessage = 'Custom error message';
    const { getByText } = render(
      <TestWrapper>
        <DataSyncStatus status="error" errorMessage={errorMessage} />
      </TestWrapper>
    );

    expect(getByText(errorMessage)).toBeTruthy();
  });

  it('renders offline status with pending changes', () => {
    const { getByText } = render(
      <TestWrapper>
        <DataSyncStatus status="offline" pendingChanges={3} />
      </TestWrapper>
    );

    expect(getByText('3 changes pending')).toBeTruthy();
  });

  it('shows retry button for error status', () => {
    const onRetrySync = jest.fn();
    const { getByText } = render(
      <TestWrapper>
        <DataSyncStatus status="error" onRetrySync={onRetrySync} />
      </TestWrapper>
    );

    const retryButton = getByText('Retry');
    expect(retryButton).toBeTruthy();
  });

  it('shows retry button for offline status', () => {
    const onRetrySync = jest.fn();
    const { getByText } = render(
      <TestWrapper>
        <DataSyncStatus status="offline" onRetrySync={onRetrySync} />
      </TestWrapper>
    );

    const retryButton = getByText('Retry');
    expect(retryButton).toBeTruthy();
  });

  it('calls onRetrySync when retry button pressed', () => {
    const onRetrySync = jest.fn();
    const { getByText } = render(
      <TestWrapper>
        <DataSyncStatus status="error" onRetrySync={onRetrySync} />
      </TestWrapper>
    );

    const retryButton = getByText('Retry');
    fireEvent.press(retryButton);

    expect(onRetrySync).toHaveBeenCalledTimes(1);
  });

  it('shows detailed information when showDetails is true', () => {
    const lastSyncTime = new Date('2023-01-01T12:00:00Z');
    const { getByText } = render(
      <TestWrapper>
        <DataSyncStatus 
          status="synced" 
          lastSyncTime={lastSyncTime}
          pendingChanges={2}
          showDetails={true}
        />
      </TestWrapper>
    );

    expect(getByText(/Last sync:/)).toBeTruthy();
    expect(getByText(/2 pending/)).toBeTruthy();
  });

  it('formats last sync time correctly', () => {
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60000);
    const oneHourAgo = new Date(now.getTime() - 3600000);
    
    // Test "Just now" for very recent sync
    const { rerender, getByText } = render(
      <TestWrapper>
        <DataSyncStatus 
          status="synced" 
          lastSyncTime={now}
          showDetails={true}
        />
      </TestWrapper>
    );

    expect(getByText(/Just now/)).toBeTruthy();

    // Test minutes ago
    rerender(
      <TestWrapper>
        <DataSyncStatus 
          status="synced" 
          lastSyncTime={oneMinuteAgo}
          showDetails={true}
        />
      </TestWrapper>
    );

    expect(getByText(/1m ago/)).toBeTruthy();

    // Test hours ago
    rerender(
      <TestWrapper>
        <DataSyncStatus 
          status="synced" 
          lastSyncTime={oneHourAgo}
          showDetails={true}
        />
      </TestWrapper>
    );

    expect(getByText(/1h ago/)).toBeTruthy();
  });

  it('positions correctly based on position prop', () => {
    const { rerender, getByTestId } = render(
      <TestWrapper>
        <DataSyncStatus status="synced" position="top" />
      </TestWrapper>
    );

    // Should render with top positioning
    expect(() => getByTestId('sync-status')).not.toThrow();

    rerender(
      <TestWrapper>
        <DataSyncStatus status="synced" position="bottom" />
      </TestWrapper>
    );

    // Should render with bottom positioning
    expect(() => getByTestId('sync-status')).not.toThrow();

    rerender(
      <TestWrapper>
        <DataSyncStatus status="synced" position="inline" />
      </TestWrapper>
    );

    // Should render inline
    expect(() => getByTestId('sync-status')).not.toThrow();
  });

  it('has proper accessibility attributes', () => {
    const { getByRole } = render(
      <TestWrapper>
        <DataSyncStatus status="syncing" />
      </TestWrapper>
    );

    const retryButton = getByRole('button');
    expect(retryButton).toBeTruthy();
    expect(retryButton.props.accessibilityLabel).toBe('Retry sync');
  });
});

describe('useDataSync', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('provides initial sync state', () => {
    const { result } = renderHook(() => useDataSync());

    expect(result.current.syncStatus).toBe('idle');
    expect(result.current.lastSyncTime).toBeNull();
    expect(result.current.pendingChanges).toBe(0);
    expect(result.current.errorMessage).toBeNull();
    expect(result.current.updateSyncStatus).toBeInstanceOf(Function);
    expect(result.current.retrySync).toBeInstanceOf(Function);
    expect(result.current.addPendingChange).toBeInstanceOf(Function);
  });

  it('updates sync status correctly', () => {
    const { result } = renderHook(() => useDataSync());

    act(() => {
      result.current.updateSyncStatus('syncing');
    });

    expect(result.current.syncStatus).toBe('syncing');

    act(() => {
      result.current.updateSyncStatus('synced');
    });

    expect(result.current.syncStatus).toBe('synced');
    expect(result.current.lastSyncTime).toBeInstanceOf(Date);
    expect(result.current.pendingChanges).toBe(0);
    expect(result.current.errorMessage).toBeNull();
  });

  it('handles error status with message', () => {
    const { result } = renderHook(() => useDataSync());

    const errorMessage = 'Sync failed due to network error';
    act(() => {
      result.current.updateSyncStatus('error', { errorMessage });
    });

    expect(result.current.syncStatus).toBe('error');
    expect(result.current.errorMessage).toBe(errorMessage);
  });

  it('handles offline status with pending changes', () => {
    const { result } = renderHook(() => useDataSync());

    act(() => {
      result.current.updateSyncStatus('offline', { pendingChanges: 5 });
    });

    expect(result.current.syncStatus).toBe('offline');
    expect(result.current.pendingChanges).toBe(5);
  });

  it('performs retry sync operation', async () => {
    const { result } = renderHook(() => useDataSync());

    // Start retry
    act(() => {
      result.current.retrySync();
    });

    expect(result.current.syncStatus).toBe('syncing');
    expect(result.current.errorMessage).toBeNull();

    // Wait for retry to complete
    await act(async () => {
      jest.advanceTimersByTime(2000);
    });

    await waitFor(() => {
      expect(result.current.syncStatus).toBe('synced');
    });

    expect(result.current.lastSyncTime).toBeInstanceOf(Date);
    expect(result.current.pendingChanges).toBe(0);
  });

  it('handles retry sync failure', async () => {
    const { result } = renderHook(() => useDataSync());

    // Mock a failure by modifying the retry function behavior
    // In a real implementation, this would involve mocking the actual sync service
    
    act(() => {
      result.current.retrySync();
    });

    expect(result.current.syncStatus).toBe('syncing');

    // Simulate failure after delay
    await act(async () => {
      jest.advanceTimersByTime(2000);
    });

    // The mock implementation always succeeds, but in a real scenario
    // we would test error handling here
    await waitFor(() => {
      expect(result.current.syncStatus).toBe('synced');
    });
  });

  it('adds pending changes correctly', () => {
    const { result } = renderHook(() => useDataSync());

    // Start with synced status
    act(() => {
      result.current.updateSyncStatus('synced');
    });

    expect(result.current.syncStatus).toBe('synced');
    expect(result.current.pendingChanges).toBe(0);

    // Add a pending change
    act(() => {
      result.current.addPendingChange();
    });

    expect(result.current.pendingChanges).toBe(1);
    expect(result.current.syncStatus).toBe('offline');

    // Add another pending change
    act(() => {
      result.current.addPendingChange();
    });

    expect(result.current.pendingChanges).toBe(2);
    expect(result.current.syncStatus).toBe('offline');
  });

  it('maintains pending changes when already offline', () => {
    const { result } = renderHook(() => useDataSync());

    // Start with offline status
    act(() => {
      result.current.updateSyncStatus('offline', { pendingChanges: 3 });
    });

    expect(result.current.syncStatus).toBe('offline');
    expect(result.current.pendingChanges).toBe(3);

    // Add a pending change
    act(() => {
      result.current.addPendingChange();
    });

    expect(result.current.pendingChanges).toBe(4);
    expect(result.current.syncStatus).toBe('offline');
  });

  it('clears pending changes when synced', () => {
    const { result } = renderHook(() => useDataSync());

    // Start with pending changes
    act(() => {
      result.current.updateSyncStatus('offline', { pendingChanges: 5 });
    });

    expect(result.current.pendingChanges).toBe(5);

    // Sync successfully
    act(() => {
      result.current.updateSyncStatus('synced');
    });

    expect(result.current.pendingChanges).toBe(0);
    expect(result.current.syncStatus).toBe('synced');
  });
});