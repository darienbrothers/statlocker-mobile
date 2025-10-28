/**
 * Completion Celebration Component
 * 
 * Full-screen celebration animation for onboarding completion
 * with confetti, success messaging, and smooth transitions.
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, Dimensions } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useOnboardingTheme, useOnboardingAnimation } from '../OnboardingThemeProvider';
import { ConfettiAnimation } from './ConfettiAnimation';

interface CompletionCelebrationProps {
  /** Whether the celebration should be active */
  active: boolean;
  /** Celebration message */
  message?: string;
  /** Subtitle message */
  subtitle?: string;
  /** Duration of the celebration in milliseconds */
  duration?: number;
  /** Callback when celebration completes */
  onComplete?: () => void;
  /** Whether to show confetti */
  showConfetti?: boolean;
}

export function CompletionCelebration({
  active,
  message = "Welcome to StatLocker!",
  subtitle = "Your profile is ready — let's make some magic happen!",
  duration = 3000,
  onComplete,
  showConfetti = true,
}: CompletionCelebrationProps) {
  const { tokens } = useOnboardingTheme();
  const { shouldAnimate, getAnimationProps } = useOnboardingAnimation();
  
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  
  // Animation values
  const backgroundOpacity = useRef(new Animated.Value(0)).current;
  const contentScale = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const messageTranslateY = useRef(new Animated.Value(50)).current;
  const subtitleTranslateY = useRef(new Animated.Value(30)).current;
  
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (!active) {
      // Reset animation values when not active
      backgroundOpacity.setValue(0);
      contentScale.setValue(0);
      contentOpacity.setValue(0);
      messageTranslateY.setValue(50);
      subtitleTranslateY.setValue(30);
      return;
    }

    if (!shouldAnimate) {
      // Skip animation but show final state briefly
      backgroundOpacity.setValue(0.95);
      contentScale.setValue(1);
      contentOpacity.setValue(1);
      messageTranslateY.setValue(0);
      subtitleTranslateY.setValue(0);
      
      const timeout = setTimeout(() => {
        onComplete?.();
      }, 1000);
      
      return () => clearTimeout(timeout);
    }

    // Trigger success haptic
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const animationConfig = getAnimationProps('celebration');
    
    // Create celebration sequence
    const celebrationSequence = Animated.sequence([
      // Phase 1: Background fade in
      Animated.timing(backgroundOpacity, {
        toValue: 0.95,
        duration: animationConfig.duration * 0.2,
        useNativeDriver: true,
      }),
      
      // Phase 2: Content entrance with spring
      Animated.parallel([
        Animated.spring(contentScale, {
          toValue: 1,
          tension: tokens.animation.bounce.tension,
          friction: tokens.animation.bounce.friction,
          useNativeDriver: true,
        }),
        Animated.timing(contentOpacity, {
          toValue: 1,
          duration: animationConfig.duration * 0.3,
          useNativeDriver: true,
        }),
      ]),
      
      // Phase 3: Message animations with stagger
      Animated.stagger(150, [
        Animated.spring(messageTranslateY, {
          toValue: 0,
          tension: tokens.animation.spring.tension,
          friction: tokens.animation.spring.friction,
          useNativeDriver: true,
        }),
        Animated.spring(subtitleTranslateY, {
          toValue: 0,
          tension: tokens.animation.spring.tension,
          friction: tokens.animation.spring.friction,
          useNativeDriver: true,
        }),
      ]),
      
      // Phase 4: Hold the celebration
      Animated.delay(duration - animationConfig.duration),
      
      // Phase 5: Fade out
      Animated.parallel([
        Animated.timing(backgroundOpacity, {
          toValue: 0,
          duration: animationConfig.duration * 0.3,
          useNativeDriver: true,
        }),
        Animated.timing(contentOpacity, {
          toValue: 0,
          duration: animationConfig.duration * 0.3,
          useNativeDriver: true,
        }),
      ]),
    ]);

    animationRef.current = celebrationSequence;
    
    celebrationSequence.start((finished) => {
      if (finished) {
        onComplete?.();
      }
    });

    return () => {
      if (animationRef.current) {
        animationRef.current.stop();
      }
    };
  }, [
    active,
    shouldAnimate,
    duration,
    backgroundOpacity,
    contentScale,
    contentOpacity,
    messageTranslateY,
    subtitleTranslateY,
    tokens.animation.bounce,
    tokens.animation.spring,
    getAnimationProps,
    onComplete,
  ]);

  if (!active) {
    return null;
  }

  const backgroundStyle = {
    opacity: backgroundOpacity,
  };

  const contentContainerStyle = {
    transform: [{ scale: contentScale }],
    opacity: contentOpacity,
  };

  const messageStyle = {
    transform: [{ translateY: messageTranslateY }],
  };

  const subtitleStyle = {
    transform: [{ translateY: subtitleTranslateY }],
  };

  return (
    <View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: tokens.zIndex.modal,
      }}
    >
      {/* Background overlay */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: tokens.colors.primary[900],
          },
          backgroundStyle,
        ]}
      />

      {/* Confetti animation */}
      {showConfetti && (
        <ConfettiAnimation
          active={active}
          type="completion"
          colors={[
            tokens.colors.success,
            tokens.colors.celebration,
            tokens.colors.primary[600],
            tokens.colors.warning,
          ]}
        />
      )}

      {/* Content */}
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: tokens.spacing.stepPadding,
        }}
      >
        <Animated.View
          style={[
            {
              alignItems: 'center',
              maxWidth: screenWidth * 0.8,
            },
            contentContainerStyle,
          ]}
        >
          {/* Success icon/graphic could go here */}
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: tokens.colors.success,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: tokens.spacing.stepMargin * 2,
            }}
          >
            <Text
              style={{
                fontSize: 40,
                color: tokens.colors.white,
              }}
            >
              ✓
            </Text>
          </View>

          {/* Main message */}
          <Animated.Text
            style={[
              {
                fontSize: tokens.typography.celebrationText.fontSize,
                fontWeight: tokens.typography.celebrationText.fontWeight,
                lineHeight: tokens.typography.celebrationText.lineHeight,
                color: tokens.colors.white,
                textAlign: 'center',
                marginBottom: tokens.spacing.stepMargin,
              },
              messageStyle,
            ]}
          >
            {message}
          </Animated.Text>

          {/* Subtitle */}
          <Animated.Text
            style={[
              {
                fontSize: tokens.typography.stepSubtitle.fontSize,
                fontWeight: tokens.typography.stepSubtitle.fontWeight,
                lineHeight: tokens.typography.stepSubtitle.lineHeight,
                color: tokens.colors.gray[200],
                textAlign: 'center',
              },
              subtitleStyle,
            ]}
          >
            {subtitle}
          </Animated.Text>
        </Animated.View>
      </View>
    </View>
  );
}

/**
 * Hook for managing completion celebration
 * 
 * @example
 * const { triggerCelebration, isCelebrating } = useCompletionCelebration();
 * 
 * const handleOnboardingComplete = () => {
 *   triggerCelebration({
 *     message: "You're all set!",
 *     onComplete: () => router.push('/dashboard')
 *   });
 * };
 */
export function useCompletionCelebration() {
  const [isCelebrating, setIsCelebrating] = React.useState(false);
  const [celebrationConfig, setCelebrationConfig] = React.useState<Partial<CompletionCelebrationProps>>({});

  const triggerCelebration = React.useCallback((config: Partial<CompletionCelebrationProps> = {}) => {
    setCelebrationConfig(config);
    setIsCelebrating(true);
  }, []);

  const handleComplete = React.useCallback(() => {
    setIsCelebrating(false);
    celebrationConfig.onComplete?.();
  }, [celebrationConfig.onComplete]);

  const CelebrationComponent = React.useCallback(
    (props: Partial<CompletionCelebrationProps>) => (
      <CompletionCelebration
        {...celebrationConfig}
        {...props}
        active={isCelebrating}
        onComplete={handleComplete}
      />
    ),
    [isCelebrating, celebrationConfig, handleComplete]
  );

  return {
    isCelebrating,
    triggerCelebration,
    CelebrationComponent,
  };
}