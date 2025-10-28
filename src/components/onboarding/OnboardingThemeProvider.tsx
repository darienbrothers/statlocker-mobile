/**
 * Onboarding Theme Provider
 * 
 * Provides onboarding-specific design tokens and utilities
 * while maintaining compatibility with the base theme system.
 */

import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { useColorScheme, Dimensions } from 'react-native';
import { useTheme } from '../../lib/theme';
import { onboardingTokens, onboardingUtils } from '../../lib/onboarding/designTokens';

interface OnboardingThemeContextValue {
  // Base theme tokens
  baseTheme: ReturnType<typeof useTheme>;
  
  // Onboarding-specific tokens
  tokens: typeof onboardingTokens;
  utils: typeof onboardingUtils;
  
  // Device and accessibility context
  screenWidth: number;
  screenHeight: number;
  colorScheme: 'light' | 'dark' | null;
  reducedMotion: boolean;
  
  // Convenience methods
  getStepColors: (stepNumber: number, isCompleted?: boolean) => ReturnType<typeof onboardingUtils.getStepColors>;
  getAnimationConfig: (reducedMotion?: boolean) => ReturnType<typeof onboardingUtils.getAnimationConfig>;
  getCelebrationConfig: (type: 'micro' | 'milestone' | 'completion') => ReturnType<typeof onboardingUtils.getCelebrationConfig>;
  getCardStyle: (state: 'default' | 'selected' | 'disabled' | 'hover') => ReturnType<typeof onboardingUtils.getCardStyle>;
  getProgressStyle: (progress: number, animated?: boolean) => ReturnType<typeof onboardingUtils.getProgressStyle>;
  getResponsiveSpacing: (baseSpacing: number) => number;
}

const OnboardingThemeContext = createContext<OnboardingThemeContextValue | undefined>(undefined);

interface OnboardingThemeProviderProps {
  children: ReactNode;
  reducedMotion?: boolean; // Allow override for testing
}

export function OnboardingThemeProvider({ 
  children, 
  reducedMotion: forcedReducedMotion 
}: OnboardingThemeProviderProps) {
  const baseTheme = useTheme();
  const colorScheme = useColorScheme();
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  
  // In a real app, this would come from accessibility settings
  // For now, we'll use the forced value or default to false
  const reducedMotion = forcedReducedMotion ?? false;

  const contextValue = useMemo<OnboardingThemeContextValue>(() => ({
    baseTheme,
    tokens: onboardingTokens,
    utils: onboardingUtils,
    screenWidth,
    screenHeight,
    colorScheme,
    reducedMotion,
    
    // Convenience methods with context applied
    getStepColors: (stepNumber: number, isCompleted?: boolean) => 
      onboardingUtils.getStepColors(stepNumber, isCompleted),
    
    getAnimationConfig: (overrideReducedMotion?: boolean) => 
      onboardingUtils.getAnimationConfig(overrideReducedMotion ?? reducedMotion),
    
    getCelebrationConfig: (type: 'micro' | 'milestone' | 'completion') => 
      onboardingUtils.getCelebrationConfig(type),
    
    getCardStyle: (state: 'default' | 'selected' | 'disabled' | 'hover') => 
      onboardingUtils.getCardStyle(state),
    
    getProgressStyle: (progress: number, animated?: boolean) => 
      onboardingUtils.getProgressStyle(progress, animated && !reducedMotion),
    
    getResponsiveSpacing: (baseSpacing: number) => 
      onboardingUtils.getResponsiveSpacing(baseSpacing, screenWidth),
  }), [
    baseTheme, 
    screenWidth, 
    screenHeight, 
    colorScheme, 
    reducedMotion
  ]);

  return (
    <OnboardingThemeContext.Provider value={contextValue}>
      {children}
    </OnboardingThemeContext.Provider>
  );
}

/**
 * Hook to access onboarding theme tokens and utilities
 * 
 * @example
 * const { tokens, getStepColors, getAnimationConfig } = useOnboardingTheme();
 * const stepColors = getStepColors(1, false);
 * const animConfig = getAnimationConfig();
 */
export function useOnboardingTheme() {
  const context = useContext(OnboardingThemeContext);

  if (context === undefined) {
    throw new Error('useOnboardingTheme must be used within an OnboardingThemeProvider');
  }

  return context;
}

/**
 * Higher-order component to inject onboarding theme
 * 
 * @example
 * const MyComponent = withOnboardingTheme(({ onboardingTheme, ...props }) => (
 *   <View style={{ backgroundColor: onboardingTheme.tokens.colors.stepBackground }}>
 *     {props.children}
 *   </View>
 * ));
 */
export function withOnboardingTheme<P extends object>(
  Component: React.ComponentType<P & { onboardingTheme: OnboardingThemeContextValue }>
) {
  return function OnboardingThemedComponent(props: P) {
    const onboardingTheme = useOnboardingTheme();
    return <Component {...props} onboardingTheme={onboardingTheme} />;
  };
}

/**
 * Utility hook for responsive design in onboarding
 * 
 * @example
 * const { isSmallScreen, isTablet, responsiveSpacing } = useOnboardingResponsive();
 */
export function useOnboardingResponsive() {
  const { screenWidth, getResponsiveSpacing, tokens } = useOnboardingTheme();
  
  return useMemo(() => ({
    screenWidth,
    isSmallScreen: screenWidth < tokens.breakpoints.medium,
    isMediumScreen: screenWidth >= tokens.breakpoints.medium && screenWidth < tokens.breakpoints.large,
    isLargeScreen: screenWidth >= tokens.breakpoints.large && screenWidth < tokens.breakpoints.tablet,
    isTablet: screenWidth >= tokens.breakpoints.tablet,
    
    // Responsive spacing helper
    responsiveSpacing: (baseSpacing: number) => getResponsiveSpacing(baseSpacing),
    
    // Responsive typography scaling
    getResponsiveFontSize: (baseFontSize: number) => {
      if (screenWidth >= tokens.breakpoints.tablet) {
        return baseFontSize * 1.1;
      }
      if (screenWidth < tokens.breakpoints.small) {
        return baseFontSize * 0.9;
      }
      return baseFontSize;
    },
  }), [screenWidth, getResponsiveSpacing, tokens.breakpoints]);
}

/**
 * Hook for managing animation preferences
 * 
 * @example
 * const { shouldAnimate, getAnimationProps } = useOnboardingAnimation();
 */
export function useOnboardingAnimation() {
  const { reducedMotion, getAnimationConfig, tokens } = useOnboardingTheme();
  
  return useMemo(() => ({
    shouldAnimate: !reducedMotion,
    reducedMotion,
    
    // Get animation props for different scenarios
    getAnimationProps: (type: 'step' | 'micro' | 'celebration' = 'step') => {
      const config = getAnimationConfig();
      
      switch (type) {
        case 'micro':
          return {
            duration: reducedMotion ? tokens.accessibility.reducedMotionDuration : tokens.animation.micro,
            easing: config.easing,
          };
        case 'celebration':
          return {
            duration: reducedMotion ? tokens.accessibility.reducedMotionDuration : tokens.animation.celebration,
            easing: config.easing,
          };
        default:
          return config;
      }
    },
    
    // Spring animation config
    getSpringConfig: (type: 'normal' | 'bounce' = 'normal') => {
      if (reducedMotion) {
        return {
          duration: tokens.accessibility.reducedMotionDuration,
          easing: tokens.accessibility.reducedMotionEasing,
        };
      }
      
      return type === 'bounce' ? tokens.animation.bounce : tokens.animation.spring;
    },
  }), [reducedMotion, getAnimationConfig, tokens]);
}