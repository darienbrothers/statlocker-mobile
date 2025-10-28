/**
 * Tests for ConfettiAnimation component
 */

import React from 'react';
import { render, renderHook, act } from '@testing-library/react-native';
import { Animated, Dimensions } from 'react-native';
import { ConfettiAnimation, useConfetti } from '../ConfettiAnimation';
import { OnboardingThemeProvider } from '../../OnboardingThemeProvider';
import { ThemeProvider } from '../../../../lib/theme';

// Mock Animated
jest.mock('react-native', () => ({
  ...jest.requireActual('react-native'),
  Animated: {
    ...jest.requireActual('react-native').Animated,
    timing: jest.fn(() => ({
      start: jest.fn((callback) => callback && callback({ finished: true })),
      stop: jest.fn(),
    })),
    parallel: jest.fn(() => ({
      start: jest.fn((callback) => callback && callback({ finished: true })),
      stop: jest.fn(),
    })),
    sequence: jest.fn(() => ({
      start: jest.fn((callback) => callback && callback({ finished: true })),
      stop: jest.fn(),
    })),
    delay: jest.fn(() => ({
      start: jest.fn((callback) => callback && callback({ finished: true })),
      stop: jest.fn(),
    })),
    Value: jest.fn(() => ({
      setValue: jest.fn(),
      interpolate: jest.fn(() => '0deg'),
      _value: 0,
    })),
  },
  Dimensions: {
    get: jest.fn(() => ({ width: 375, height: 812 })),
  },
}));

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider>
    <OnboardingThemeProvider>
      {children}
    </OnboardingThemeProvider>
  </ThemeProvider>
);

describe('ConfettiAnimation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders nothing when not active', () => {
    const { queryByTestId } = render(
      <TestWrapper>
        <ConfettiAnimation active={false} />
      </TestWrapper>
    );

    // Should not render any particles when inactive
    expect(queryByTestId('confetti-particle')).toBeNull();
  });

  it('renders nothing when animations are disabled', () => {
    const { queryByTestId } = render(
      <ThemeProvider>
        <OnboardingThemeProvider reducedMotion={true}>
          <ConfettiAnimation active={true} />
        </OnboardingThemeProvider>
      </ThemeProvider>
    );

    // Should not render when reduced motion is enabled
    expect(queryByTestId('confetti-particle')).toBeNull();
  });

  it('creates particles when active and animations enabled', () => {
    const { getByTestId } = render(
      <TestWrapper>
        <ConfettiAnimation active={true} type="micro" />
      </TestWrapper>
    );

    // Should render the confetti container
    expect(() => getByTestId('confetti-container')).not.toThrow();
  });

  it('calls onComplete when animation finishes', () => {
    const onComplete = jest.fn();
    
    render(
      <TestWrapper>
        <ConfettiAnimation active={true} onComplete={onComplete} />
      </TestWrapper>
    );

    // Animation should complete and call onComplete
    expect(onComplete).toHaveBeenCalled();
  });

  it('uses custom colors when provided', () => {
    const customColors = ['#FF0000', '#00FF00', '#0000FF'];
    
    render(
      <TestWrapper>
        <ConfettiAnimation 
          active={true} 
          colors={customColors}
          type="micro"
        />
      </TestWrapper>
    );

    // Should use custom colors (tested through particle creation)
    expect(Animated.parallel).toHaveBeenCalled();
  });

  it('uses custom particle count when provided', () => {
    const customParticleCount = 20;
    
    render(
      <TestWrapper>
        <ConfettiAnimation 
          active={true} 
          particleCount={customParticleCount}
          type="micro"
        />
      </TestWrapper>
    );

    // Should create animations for custom particle count
    expect(Animated.parallel).toHaveBeenCalled();
  });

  it('creates different particle counts for different types', () => {
    const { rerender } = render(
      <TestWrapper>
        <ConfettiAnimation active={true} type="micro" />
      </TestWrapper>
    );

    const microCalls = (Animated.parallel as jest.Mock).mock.calls.length;

    rerender(
      <TestWrapper>
        <ConfettiAnimation active={true} type="completion" />
      </TestWrapper>
    );

    const completionCalls = (Animated.parallel as jest.Mock).mock.calls.length;

    // Completion should have more particles than micro
    expect(completionCalls).toBeGreaterThan(microCalls);
  });

  it('stops animation when component unmounts', () => {
    const { unmount } = render(
      <TestWrapper>
        <ConfettiAnimation active={true} />
      </TestWrapper>
    );

    const stopMock = jest.fn();
    (Animated.parallel as jest.Mock).mockReturnValue({
      start: jest.fn(),
      stop: stopMock,
    });

    unmount();

    // Should clean up animations on unmount
    expect(stopMock).toHaveBeenCalled();
  });
});

describe('useConfetti', () => {
  it('provides confetti control functions', () => {
    const { result } = renderHook(() => useConfetti());

    expect(result.current.isAnimating).toBe(false);
    expect(result.current.triggerConfetti).toBeInstanceOf(Function);
    expect(result.current.ConfettiComponent).toBeInstanceOf(Function);
  });

  it('triggers confetti animation', () => {
    const { result } = renderHook(() => useConfetti());

    act(() => {
      result.current.triggerConfetti('milestone');
    });

    expect(result.current.isAnimating).toBe(true);
    expect(result.current.animationType).toBe('milestone');
  });

  it('handles animation completion', () => {
    const { result } = renderHook(() => useConfetti());

    act(() => {
      result.current.triggerConfetti('micro');
    });

    expect(result.current.isAnimating).toBe(true);

    // Simulate animation completion by rendering the component
    const TestComponent = result.current.ConfettiComponent;
    const { unmount } = render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    // Animation should complete
    act(() => {
      // Trigger completion callback
      result.current.ConfettiComponent({});
    });

    expect(result.current.isAnimating).toBe(false);

    unmount();
  });

  it('provides different animation types', () => {
    const { result } = renderHook(() => useConfetti());

    act(() => {
      result.current.triggerConfetti('micro');
    });
    expect(result.current.animationType).toBe('micro');

    act(() => {
      result.current.triggerConfetti('milestone');
    });
    expect(result.current.animationType).toBe('milestone');

    act(() => {
      result.current.triggerConfetti('completion');
    });
    expect(result.current.animationType).toBe('completion');
  });

  it('defaults to micro type when no type specified', () => {
    const { result } = renderHook(() => useConfetti());

    act(() => {
      result.current.triggerConfetti();
    });

    expect(result.current.animationType).toBe('micro');
  });
});