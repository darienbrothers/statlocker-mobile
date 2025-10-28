/**
 * Step Transition Animation Component
 * 
 * Provides smooth transitions between onboarding steps with spring physics
 * and proper accessibility support.
 */

import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions } from 'react-native';
import { useOnboardingTheme, useOnboardingAnimation } from '../OnboardingThemeProvider';

interface StepTransitionProps {
  /** Current step number */
  currentStep: number;
  /** Direction of transition */
  direction?: 'forward' | 'backward';
  /** Children to animate */
  children: React.ReactNode;
  /** Callback when transition completes */
  onTransitionComplete?: () => void;
}

export function StepTransition({
  currentStep,
  direction = 'forward',
  children,
  onTransitionComplete,
}: StepTransitionProps) {
  const { tokens } = useOnboardingTheme();
  const { shouldAnimate, getSpringConfig } = useOnboardingAnimation();
  
  const { width: screenWidth } = Dimensions.get('window');
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const scale = useRef(new Animated.Value(1)).current;
  
  const previousStep = useRef(currentStep);

  useEffect(() => {
    // Only animate if step actually changed
    if (previousStep.current === currentStep) {
      return;
    }

    const isForward = currentStep > previousStep.current;
    const actualDirection = direction === 'forward' ? isForward : !isForward;
    
    if (!shouldAnimate) {
      // Skip animation but still call completion callback
      previousStep.current = currentStep;
      onTransitionComplete?.();
      return;
    }

    // Determine animation direction
    const startX = actualDirection ? screenWidth : -screenWidth;
    const endX = 0;

    // Reset values for new transition
    translateX.setValue(startX);
    opacity.setValue(0);
    scale.setValue(0.95);

    // Create spring animation
    const springConfig = getSpringConfig('normal');
    
    const animation = Animated.parallel([
      // Slide in from side
      Animated.spring(translateX, {
        toValue: endX,
        ...springConfig,
        useNativeDriver: true,
      }),
      
      // Fade in
      Animated.timing(opacity, {
        toValue: 1,
        duration: tokens.animation.stepTransition,
        useNativeDriver: true,
      }),
      
      // Scale up slightly for depth
      Animated.spring(scale, {
        toValue: 1,
        ...springConfig,
        useNativeDriver: true,
      }),
    ]);

    animation.start((finished) => {
      if (finished) {
        previousStep.current = currentStep;
        onTransitionComplete?.();
      }
    });

    return () => {
      animation.stop();
    };
  }, [
    currentStep,
    direction,
    shouldAnimate,
    screenWidth,
    translateX,
    opacity,
    scale,
    tokens.animation.stepTransition,
    getSpringConfig,
    onTransitionComplete,
  ]);

  const animatedStyle = {
    transform: [
      { translateX },
      { scale },
    ],
    opacity,
  };

  return (
    <Animated.View style={[{ flex: 1 }, animatedStyle]}>
      {children}
    </Animated.View>
  );
}

/**
 * Hook for managing step transitions
 * 
 * @example
 * const { transitionToStep, isTransitioning } = useStepTransition();
 * 
 * const handleNext = () => {
 *   transitionToStep(currentStep + 1, 'forward');
 * };
 */
export function useStepTransition() {
  const [isTransitioning, setIsTransitioning] = React.useState(false);
  const [targetStep, setTargetStep] = React.useState<number | null>(null);
  const [transitionDirection, setTransitionDirection] = React.useState<'forward' | 'backward'>('forward');

  const transitionToStep = React.useCallback((
    step: number, 
    direction: 'forward' | 'backward' = 'forward'
  ) => {
    setTargetStep(step);
    setTransitionDirection(direction);
    setIsTransitioning(true);
  }, []);

  const handleTransitionComplete = React.useCallback(() => {
    setIsTransitioning(false);
    setTargetStep(null);
  }, []);

  return {
    isTransitioning,
    targetStep,
    transitionDirection,
    transitionToStep,
    handleTransitionComplete,
  };
}