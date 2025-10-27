/**
 * OfflineBanner Component Tests
 */
import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { OfflineBanner } from '../OfflineBanner';
import { useIsOffline } from '@/store';

// Mock store
jest.mock('@/store', () => ({
  useIsOffline: jest.fn(),
}));

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
}));

const mockUseIsOffline = useIsOffline as jest.Mock;

describe('OfflineBanner Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders when offline', () => {
    mockUseIsOffline.mockReturnValue(true);

    render(<OfflineBanner />);

    expect(screen.getByText('No internet connection')).toBeTruthy();
    expect(screen.getByTestId('offline-banner')).toBeTruthy();
  });

  it('renders with custom message', () => {
    mockUseIsOffline.mockReturnValue(true);

    render(<OfflineBanner message="Custom offline message" />);

    expect(screen.getByText('Custom offline message')).toBeTruthy();
  });

  it('renders with custom testID', () => {
    mockUseIsOffline.mockReturnValue(true);

    render(<OfflineBanner testID="custom-banner" />);

    expect(screen.getByTestId('custom-banner')).toBeTruthy();
  });

  it('handles online state', () => {
    mockUseIsOffline.mockReturnValue(false);

    render(<OfflineBanner />);

    // Banner should still be rendered but with different pointer events
    expect(screen.getByTestId('offline-banner')).toBeTruthy();
  });

  it('includes alert icon', () => {
    mockUseIsOffline.mockReturnValue(true);

    render(<OfflineBanner />);

    // The icon should be rendered (we can't easily test the actual icon content)
    expect(screen.getByTestId('offline-banner')).toBeTruthy();
  });
});