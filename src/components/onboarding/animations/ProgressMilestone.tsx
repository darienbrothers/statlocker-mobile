/**
 * Progress Milestone Animation Component
 * 
 * Creates celebratory animations when users reach progress milestones
 * with haptic feedback and visual celebrations.
 */

import React, { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useOnboardingTheme, useOnboardingAnimation } from '../OnboardingThemeProvider';

interface ProgressMilestoneProps {
  /** Whether the milestone animation should trigger */
  trigger: boolean;
  /** Progress percentage (0-100) */
  progress: number;
  /** Milestone thresholds that trigger celebrations */
  milestones?: number[];
  /** Callback when milestone is reached */
  onMilestone?: (milestone: number) => void;
  /** Custom colors for the celebration */
  colors?: string[];
}

export function ProgressMilestone({
  trigger,
  progress,
  milestones = [25, 50, 75, 100],
  onMilestone,
  colors: customColors,
}: ProgressMilestoneProps) {
  const { tokens } = useOnboardingTheme();
  const { shouldAnimate, getAnimationProps } = useOnboardingAnimation();
  
  const pulseScale = useRef(new Animated.Value(1)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;
  const sparkleScale = useRef(new Animated.Value(0)).current;
  const sparkleRotation = useRef(new Animated.Value(0)).current;
  
  const lastMilestone = useRef<number>(-1);
  const colors = customColors ?? [tokens.colors.success, tokens.colors.celebration];

  useEffect(() => {
    if (!trigger || !shouldAnimate) return;

    // Check if we've hit a new milestone
    const currentMilestone = milestones.find(
      milestone => progress >= milestone && milestone > lastMilestone.current
    );

    if (!currentMilestone) return;

    // Update last milestone
    lastMilestone.current = currentMilestone;
    
    // Trigger haptic feedback
    if (currentMilestone === 100) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    // Call milestone callback
    onMilestone?.(currentMilestone);

    // Animation intensity based on milestone
    const isCompletion = currentMilestone === 100;
    const animationConfig = getAnimationProps(isCompletion ? 'celebration' : 'micro');

    // Create milestone animation sequence
    const milestoneAnimation = Animated.sequence([
      // Initial pulse
      Animated.parallel([
        Animated.timing(pulseScale, {
          toValue: 1.2,
          duration: animationConfig.duration * 0.3,
          useNativeDriver: true,
        }),
        Animated.timing(glowOpacity, {
          toValue: 0.8,
          duration: animationConfig.duration * 0.3,
          useNativeDriver: true,
        }),
      ]),
      
      // Sparkle effect for major milestones
      ...(currentMilestone >= 50 ? [
        Animated.parallel([
          Animated.timing(sparkleScale, {
            toValue: 1,
            duration: animationConfig.duration * 0.2,
            useNativeDriver: true,
          }),
          Animated.timing(sparkleRotation, {
            toValue: 1,
            duration: animationConfig.duration * 0.8,
            useNativeDriver: true,
          }),
        ]),
      ] : []),
      
      // Return to normal
      Animated.parallel([
        Animated.spring(pulseScale, {
          toValue: 1,
          tension: tokens.animation.spring.tension,
          friction: tokens.animation.spring.friction,
          useNativeDriver: true,
        }),
        Animated.timing(glowOpacity, {
          toValue: 0,
          duration: animationConfig.duration * 0.4,
          useNativeDriver: true,
        }),
        Animated.timing(sparkleScale, {
          toValue: 0,
          duration: animationConfig.duration * 0.3,
          useNativeDriver: true,
        }),
      ]),
    ]);

    milestoneAnimation.start();

    return () => {
      milestoneAnimation.stop();
    };
  }, [
    trigger,
    progress,
    milestones,
    shouldAnimate,
    onMilestone,
    pulseScale,
    glowOpacity,
    sparkleScale,
    sparkleRotation,
    tokens.animation.spring,
    getAnimationProps,
  ]);

  if (!shouldAnimate) {
    return null;
  }

  const pulseStyle = {
    transform: [{ scale: pulseScale }],
  };

  const glowStyle = {
    opacity: glowOpacity,
    position: 'absolute' as const,
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: 12,
    backgroundColor: colors[0],
  };

  const sparkleStyle = {
    transform: [
      { scale: sparkleScale },
      {
        rotate: sparkleRotation.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', '360deg'],
        }),
      },
    ],
  };

  return (
    <View style={{ position: 'relative' }}>
      {/* Glow effect */}
      <Animated.View style={glowStyle} />
      
      {/* Main pulse container */}
      <Animated.View style={pulseStyle}>
        {/* Sparkle effects for major milestones */}
        <Animated.View
          style={[
            {
              position: 'absolute',
              top: -8,
              right: -8,
              width: 16,
              height: 16,
              backgroundColor: colors[1] ?? colors[0],
              borderRadius: 8,
            },
            sparkleStyle,
          ]}
        />
        <Animated.View
          style={[
            {
              position: 'absolute',
              bottom: -6,
              left: -6,
              width: 12,
              height: 12,
              backgroundColor: colors[0],
              borderRadius: 6,
            },
            sparkleStyle,
          ]}
        />
      </Animated.View>
    </View>
  );
}

/**
 * Hook for managing progress milestones
 * 
 * @example
 * const { triggerMilestone, currentMilestone } = useProgressMilestone();
 * 
 * useEffect(() => {
 *   if (progress >= 50 && !hasTriggered50) {
 *     triggerMilestone(50);
 *     setHasTriggered50(true);
 *   }
 * }, [progress]);
 */
export function useProgressMilestone(milestones: number[] = [25, 50, 75, 100]) {
  const [triggeredMilestones, setTriggeredMilestones] = React.useState<Set<number>>(new Set());
  const [currentMilestone, setCurrentMilestone] = React.useState<number | null>(null);
  const [shouldTrigger, setShouldTrigger] = React.useState(false);

  const checkProgress = React.useCallback((progress: number) => {
    const newMilestone = milestones.find(
      milestone => progress >= milestone && !triggeredMilestones.has(milestone)
    );

    if (newMilestone) {
      setTriggeredMilestones(prev => new Set([...prev, newMilestone]));
      setCurrentMilestone(newMilestone);
      setShouldTrigger(true);
      
      // Reset trigger after a short delay
      setTimeout(() => setShouldTrigger(false), 100);
    }
  }, [milestones, triggeredMilestones]);

  const resetMilestones = React.useCallback(() => {
    setTriggeredMilestones(new Set());
    setCurrentMilestone(null);
    setShouldTrigger(false);
  }, []);

  return {
    checkProgress,
    resetMilestones,
    currentMilestone,
    shouldTrigger,
    triggeredMilestones: Array.from(triggeredMilestones),
  };
}