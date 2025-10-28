/**
 * Onboarding-Specific Design Tokens
 * 
 * Extends the base design tokens with onboarding-specific values
 * for animations, spacing, and visual hierarchy.
 */

import { colors, spacing, typography, shadows, animation as baseAnimation } from '../tokens';

export const onboardingTokens = {
  // Onboarding-specific colors
  colors: {
    ...colors,
    // Step-specific accent colors
    stepAccent: colors.success, // Aqua Glow for progress
    celebration: '#FFD700', // Gold for celebrations
    motivational: colors.primary[600], // Royal Blue variant
    
    // Background variations
    stepBackground: colors.white,
    cardBackground: colors.gray[50],
    progressBackground: colors.gray[100],
    
    // Interactive states
    cardHover: colors.primary[100],
    cardSelected: colors.primary[600],
    cardDisabled: colors.gray[200],
  },

  // Onboarding-specific spacing
  spacing: {
    ...spacing,
    // Step layout spacing
    stepPadding: 24,
    stepMargin: 16,
    
    // Card spacing
    cardGap: 16,
    cardPadding: 20,
    cardRadius: 16,
    
    // Form element spacing
    inputHeight: 48,
    buttonHeight: 56,
    toggleHeight: 32,
    
    // Progress elements
    progressBarHeight: 8,
    progressDotSize: 12,
    
    // Navigation spacing
    navBarHeight: 80,
    navButtonWidth: 120,
  },

  // Enhanced typography for onboarding
  typography: {
    ...typography,
    // Step titles and headers
    stepTitle: {
      fontSize: 28,
      lineHeight: 34,
      fontWeight: '700' as const,
      letterSpacing: -0.5,
    },
    stepSubtitle: {
      fontSize: 16,
      lineHeight: 22,
      fontWeight: '400' as const,
      letterSpacing: 0,
    },
    
    // Form labels and hints
    formLabel: {
      fontSize: 14,
      lineHeight: 20,
      fontWeight: '600' as const,
    },
    formHint: {
      fontSize: 12,
      lineHeight: 16,
      fontWeight: '400' as const,
    },
    
    // Button text
    buttonPrimary: {
      fontSize: 18,
      lineHeight: 24,
      fontWeight: '600' as const,
    },
    buttonSecondary: {
      fontSize: 16,
      lineHeight: 22,
      fontWeight: '500' as const,
    },
    
    // Progress and status text
    progressText: {
      fontSize: 14,
      lineHeight: 18,
      fontWeight: '500' as const,
    },
    celebrationText: {
      fontSize: 20,
      lineHeight: 26,
      fontWeight: '700' as const,
    },
  },

  // Animation timing and easing
  animation: {
    ...baseAnimation,
    // Step transitions
    stepTransition: 300,
    stepEasing: 'cubic-bezier(0.4, 0.0, 0.2, 1)', // Material Design standard
    
    // Micro-interactions
    buttonPress: 80,
    cardSelect: 150,
    inputFocus: 120,
    
    // Progress animations
    progressFill: 400,
    progressPulse: 1200,
    
    // Celebration animations
    confetti: 800,
    celebration: 1200,
    success: 600,
    
    // Spring physics for delightful animations
    spring: {
      tension: 300,
      friction: 30,
    },
    
    // Bounce for celebrations
    bounce: {
      tension: 400,
      friction: 8,
    },
  },

  // Onboarding-specific shadows
  shadows: {
    ...shadows,
    stepCard: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 2,
    },
    selectedCard: {
      shadowColor: colors.primary[600],
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 4,
    },
    floatingButton: {
      shadowColor: colors.primary[900],
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 16,
      elevation: 8,
    },
  },

  // Responsive breakpoints for different screen sizes
  breakpoints: {
    small: 320,  // iPhone SE
    medium: 375, // iPhone 12/13/14
    large: 414,  // iPhone 12/13/14 Pro Max
    tablet: 768, // iPad
  },

  // Layout ratios and proportions
  ratios: {
    golden: 1.618,
    cardAspect: 1.5,
    buttonAspect: 7.5,
    iconScale: 0.6,
  },

  // Accessibility enhancements
  accessibility: {
    minTouchTarget: 44,
    focusRingWidth: 3,
    focusRingOffset: 2,
    highContrastRatio: 4.5,
    
    // Reduced motion alternatives
    reducedMotionDuration: 100,
    reducedMotionEasing: 'ease-out',
  },

  // Z-index layers for proper stacking
  zIndex: {
    base: 0,
    card: 1,
    dropdown: 10,
    modal: 100,
    toast: 1000,
    confetti: 9999,
  },
} as const;

// Utility functions for onboarding-specific styling
export const onboardingUtils = {
  /**
   * Get responsive spacing based on screen width
   */
  getResponsiveSpacing: (baseSpacing: number, screenWidth: number) => {
    if (screenWidth >= onboardingTokens.breakpoints.tablet) {
      return baseSpacing * 1.5;
    }
    if (screenWidth >= onboardingTokens.breakpoints.large) {
      return baseSpacing * 1.2;
    }
    return baseSpacing;
  },

  /**
   * Get step-specific color scheme
   */
  getStepColors: (stepNumber: number, isCompleted: boolean = false) => {
    const baseColors = onboardingTokens.colors;
    
    if (isCompleted) {
      return {
        primary: baseColors.success,
        background: baseColors.cardBackground,
        text: baseColors.gray[900],
      };
    }

    return {
      primary: baseColors.primary[600],
      background: baseColors.stepBackground,
      text: baseColors.gray[900],
    };
  },

  /**
   * Get animation config based on user preferences
   */
  getAnimationConfig: (reducedMotion: boolean = false) => {
    if (reducedMotion) {
      return {
        duration: onboardingTokens.accessibility.reducedMotionDuration,
        easing: onboardingTokens.accessibility.reducedMotionEasing,
      };
    }

    return {
      duration: onboardingTokens.animation.stepTransition,
      easing: onboardingTokens.animation.stepEasing,
    };
  },

  /**
   * Create celebration animation config
   */
  getCelebrationConfig: (type: 'micro' | 'milestone' | 'completion') => {
    switch (type) {
      case 'micro':
        return {
          duration: onboardingTokens.animation.success,
          particles: 5,
          colors: [onboardingTokens.colors.success, onboardingTokens.colors.celebration],
        };
      case 'milestone':
        return {
          duration: onboardingTokens.animation.celebration,
          particles: 15,
          colors: [
            onboardingTokens.colors.success,
            onboardingTokens.colors.celebration,
            onboardingTokens.colors.primary[600],
          ],
        };
      case 'completion':
        return {
          duration: onboardingTokens.animation.confetti,
          particles: 30,
          colors: [
            onboardingTokens.colors.success,
            onboardingTokens.colors.celebration,
            onboardingTokens.colors.primary[600],
            onboardingTokens.colors.warning,
          ],
        };
      default:
        return {
          duration: onboardingTokens.animation.success,
          particles: 5,
          colors: [onboardingTokens.colors.success],
        };
    }
  },

  /**
   * Get card style based on state
   */
  getCardStyle: (state: 'default' | 'selected' | 'disabled' | 'hover') => {
    const tokens = onboardingTokens;
    
    switch (state) {
      case 'selected':
        return {
          backgroundColor: tokens.colors.cardSelected,
          borderColor: tokens.colors.primary[600],
          borderWidth: 2,
          ...tokens.shadows.selectedCard,
        };
      case 'disabled':
        return {
          backgroundColor: tokens.colors.cardDisabled,
          borderColor: tokens.colors.gray[200],
          borderWidth: 1,
          opacity: 0.6,
        };
      case 'hover':
        return {
          backgroundColor: tokens.colors.cardHover,
          borderColor: tokens.colors.primary[100],
          borderWidth: 1,
          ...tokens.shadows.stepCard,
        };
      default:
        return {
          backgroundColor: tokens.colors.cardBackground,
          borderColor: tokens.colors.gray[200],
          borderWidth: 1,
          ...tokens.shadows.stepCard,
        };
    }
  },

  /**
   * Get progress bar style
   */
  getProgressStyle: (progress: number, animated: boolean = true) => {
    return {
      width: `${Math.max(0, Math.min(100, progress))}%`,
      backgroundColor: onboardingTokens.colors.stepAccent,
      height: onboardingTokens.spacing.progressBarHeight,
      borderRadius: onboardingTokens.spacing.progressBarHeight / 2,
      transition: animated ? `width ${onboardingTokens.animation.progressFill}ms ease-out` : 'none',
    };
  },
} as const;

// Type exports
export type OnboardingColorScheme = ReturnType<typeof onboardingUtils.getStepColors>;
export type AnimationConfig = ReturnType<typeof onboardingUtils.getAnimationConfig>;
export type CelebrationConfig = ReturnType<typeof onboardingUtils.getCelebrationConfig>;
export type CardState = 'default' | 'selected' | 'disabled' | 'hover';
