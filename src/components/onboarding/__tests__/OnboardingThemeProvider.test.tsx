/**
 * Tests for OnboardingThemeProvider and related hooks
 */

import React from 'react';
import { render, renderHook } from '@testing-library/react-native';
import { Dimensions } from 'react-native';
import {
  OnboardingThemeProvider,
  useOnboardingTheme,
  useOnboardingResponsive,
  useOnboardingAnimation,
} from '../OnboardingThemeProvider';
import { ThemeProvider } from '../../../lib/theme';

// Mock Dimensions
jest.mock('react-native', () => ({
  ...jest.requireActual('react-native'),
  Dimensions: {
    get: jest.fn(() => ({ width: 375, height: 812 })),
  },
}));

const TestWrapper: React.FC<{ children: React.ReactNode; reducedMotion?: boolean }> = ({ 
  children, 
  reducedMotion 
}) => (
  <ThemeProvider>
    <OnboardingThemeProvider reducedMotion={reducedMotion}>
      {children}
    </OnboardingThemeProvider>
  </ThemeProvider>
);

describe('OnboardingThemeProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('useOnboardingTheme', () => {
    it('provides onboarding theme tokens and utilities', () => {
      const { result } = renderHook(() => useOnboardingTheme(), {
        wrapper: TestWrapper,
      });

      expect(result.current.tokens).toBeDefined();
      expect(result.current.utils).toBeDefined();
      expect(result.current.baseTheme).toBeDefined();
      expect(result.current.getStepColors).toBeInstanceOf(Function);
      expect(result.current.getAnimationConfig).toBeInstanceOf(Function);
    });

    it('throws error when used outside provider', () => {
      const { result } = renderHook(() => useOnboardingTheme());
      
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('useOnboardingTheme must be used within an OnboardingThemeProvider');
    });

    it('provides step-specific colors', () => {
      const { result } = renderHook(() => useOnboardingTheme(), {
        wrapper: TestWrapper,
      });

      const stepColors = result.current.getStepColors(1, false);
      expect(stepColors).toHaveProperty('primary');
      expect(stepColors).toHaveProperty('background');
      expect(stepColors).toHaveProperty('text');

      const completedStepColors = result.current.getStepColors(1, true);
      expect(completedStepColors.primary).not.toBe(stepColors.primary);
    });

    it('provides animation configuration', () => {
      const { result } = renderHook(() => useOnboardingTheme(), {
        wrapper: TestWrapper,
      });

      const animConfig = result.current.getAnimationConfig();
      expect(animConfig).toHaveProperty('duration');
      expect(animConfig).toHaveProperty('easing');
    });

    it('respects reduced motion preference', () => {
      const { result } = renderHook(() => useOnboardingTheme(), {
        wrapper: ({ children }) => (
          <TestWrapper reducedMotion={true}>{children}</TestWrapper>
        ),
      });

      const animConfig = result.current.getAnimationConfig();
      expect(animConfig.duration).toBeLessThan(200); // Reduced motion should have shorter duration
    });
  });

  describe('useOnboardingResponsive', () => {
    it('provides responsive utilities for medium screen', () => {
      (Dimensions.get as jest.Mock).mockReturnValue({ width: 375, height: 812 });

      const { result } = renderHook(() => useOnboardingResponsive(), {
        wrapper: TestWrapper,
      });

      expect(result.current.screenWidth).toBe(375);
      expect(result.current.isMediumScreen).toBe(true);
      expect(result.current.isSmallScreen).toBe(false);
      expect(result.current.isLargeScreen).toBe(false);
      expect(result.current.isTablet).toBe(false);
    });

    it('provides responsive utilities for small screen', () => {
      (Dimensions.get as jest.Mock).mockReturnValue({ width: 320, height: 568 });

      const { result } = renderHook(() => useOnboardingResponsive(), {
        wrapper: TestWrapper,
      });

      expect(result.current.screenWidth).toBe(320);
      expect(result.current.isSmallScreen).toBe(true);
      expect(result.current.isMediumScreen).toBe(false);
    });

    it('provides responsive utilities for tablet', () => {
      (Dimensions.get as jest.Mock).mockReturnValue({ width: 768, height: 1024 });

      const { result } = renderHook(() => useOnboardingResponsive(), {
        wrapper: TestWrapper,
      });

      expect(result.current.screenWidth).toBe(768);
      expect(result.current.isTablet).toBe(true);
      expect(result.current.isLargeScreen).toBe(false);
    });

    it('provides responsive spacing function', () => {
      const { result } = renderHook(() => useOnboardingResponsive(), {
        wrapper: TestWrapper,
      });

      const baseSpacing = 16;
      const responsiveSpacing = result.current.responsiveSpacing(baseSpacing);
      expect(typeof responsiveSpacing).toBe('number');
      expect(responsiveSpacing).toBeGreaterThanOrEqual(baseSpacing);
    });

    it('provides responsive font size function', () => {
      const { result } = renderHook(() => useOnboardingResponsive(), {
        wrapper: TestWrapper,
      });

      const baseFontSize = 16;
      const responsiveFontSize = result.current.getResponsiveFontSize(baseFontSize);
      expect(typeof responsiveFontSize).toBe('number');
      expect(responsiveFontSize).toBeGreaterThan(0);
    });
  });

  describe('useOnboardingAnimation', () => {
    it('provides animation utilities with motion enabled', () => {
      const { result } = renderHook(() => useOnboardingAnimation(), {
        wrapper: TestWrapper,
      });

      expect(result.current.shouldAnimate).toBe(true);
      expect(result.current.reducedMotion).toBe(false);
      expect(result.current.getAnimationProps).toBeInstanceOf(Function);
      expect(result.current.getSpringConfig).toBeInstanceOf(Function);
    });

    it('provides animation utilities with reduced motion', () => {
      const { result } = renderHook(() => useOnboardingAnimation(), {
        wrapper: ({ children }) => (
          <TestWrapper reducedMotion={true}>{children}</TestWrapper>
        ),
      });

      expect(result.current.shouldAnimate).toBe(false);
      expect(result.current.reducedMotion).toBe(true);
    });

    it('provides different animation configs for different types', () => {
      const { result } = renderHook(() => useOnboardingAnimation(), {
        wrapper: TestWrapper,
      });

      const stepConfig = result.current.getAnimationProps('step');
      const microConfig = result.current.getAnimationProps('micro');
      const celebrationConfig = result.current.getAnimationProps('celebration');

      expect(stepConfig.duration).toBeDefined();
      expect(microConfig.duration).toBeDefined();
      expect(celebrationConfig.duration).toBeDefined();

      // Celebration should be longer than micro
      expect(celebrationConfig.duration).toBeGreaterThan(microConfig.duration);
    });

    it('provides spring configuration', () => {
      const { result } = renderHook(() => useOnboardingAnimation(), {
        wrapper: TestWrapper,
      });

      const normalSpring = result.current.getSpringConfig('normal');
      const bounceSpring = result.current.getSpringConfig('bounce');

      expect(normalSpring).toBeDefined();
      expect(bounceSpring).toBeDefined();
      
      // With reduced motion, should return simple config
      const { result: reducedResult } = renderHook(() => useOnboardingAnimation(), {
        wrapper: ({ children }) => (
          <TestWrapper reducedMotion={true}>{children}</TestWrapper>
        ),
      });

      const reducedSpring = reducedResult.current.getSpringConfig('normal');
      expect(reducedSpring).toHaveProperty('duration');
      expect(reducedSpring).toHaveProperty('easing');
    });
  });

  describe('Design Token Integration', () => {
    it('provides consistent color values', () => {
      const { result } = renderHook(() => useOnboardingTheme(), {
        wrapper: TestWrapper,
      });

      const { tokens } = result.current;
      
      // Check that colors are properly defined
      expect(tokens.colors.stepAccent).toBeDefined();
      expect(tokens.colors.celebration).toBeDefined();
      expect(tokens.colors.motivational).toBeDefined();
      
      // Check color format (should be hex or named colors)
      expect(tokens.colors.stepAccent).toMatch(/^#[0-9A-Fa-f]{6}$|^[a-zA-Z]+$/);
    });

    it('provides consistent spacing values', () => {
      const { result } = renderHook(() => useOnboardingTheme(), {
        wrapper: TestWrapper,
      });

      const { tokens } = result.current;
      
      expect(tokens.spacing.stepPadding).toBeGreaterThan(0);
      expect(tokens.spacing.cardGap).toBeGreaterThan(0);
      expect(tokens.spacing.buttonHeight).toBeGreaterThan(tokens.spacing.inputHeight);
    });

    it('provides consistent typography values', () => {
      const { result } = renderHook(() => useOnboardingTheme(), {
        wrapper: TestWrapper,
      });

      const { tokens } = result.current;
      
      expect(tokens.typography.stepTitle.fontSize).toBeGreaterThan(tokens.typography.stepSubtitle.fontSize);
      expect(tokens.typography.buttonPrimary.fontWeight).toBeDefined();
      expect(tokens.typography.formLabel.lineHeight).toBeGreaterThan(0);
    });

    it('provides consistent animation timing', () => {
      const { result } = renderHook(() => useOnboardingTheme(), {
        wrapper: TestWrapper,
      });

      const { tokens } = result.current;
      
      expect(tokens.animation.stepTransition).toBeGreaterThan(0);
      expect(tokens.animation.celebration).toBeGreaterThan(tokens.animation.micro);
      expect(tokens.animation.confetti).toBeGreaterThan(tokens.animation.success);
    });
  });
});