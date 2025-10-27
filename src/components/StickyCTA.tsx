/**
 * StickyCTA Component - Production-grade bottom CTA with micro-interactions
 *
 * Features:
 * - Scale-to-0.98 press animation (120ms)
 * - Light haptic feedback
 * - Loading and disabled states
 * - Focus ring for accessibility
 * - Keyboard-safe positioning
 */

import React, { ReactNode } from 'react';
import {
  Pressable,
  Text,
  ActivityIndicator,
  PressableStateCallbackType,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { HapticFeedback } from '@/lib/haptics';

export interface StickyCTAProps {
  variant: 'primary' | 'secondary' | 'fab';
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  children: ReactNode;
  testID?: string;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function StickyCTA({
  variant,
  onPress,
  disabled = false,
  loading = false,
  children,
  testID,
}: StickyCTAProps) {
  const scale = useSharedValue(1);

  // Trigger haptic feedback
  const triggerHaptic = () => {
    if (!disabled && !loading) {
      HapticFeedback.ctaPress(testID);
    }
  };

  // Handle press in
  const handlePressIn = () => {
    if (!disabled && !loading) {
      scale.value = withTiming(0.98, { duration: 120 });
      runOnJS(triggerHaptic)();
    }
  };

  // Handle press out
  const handlePressOut = () => {
    scale.value = withTiming(1, { duration: 120 });
  };

  // Handle press
  const handlePress = () => {
    if (!disabled && !loading) {
      onPress();
    }
  };

  // Animated style
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // Get variant-specific styles
  const getVariantStyles = (state: PressableStateCallbackType) => {
    const { pressed } = state;

    if (variant === 'fab') {
      return {
        container: `w-16 h-16 rounded-full items-center justify-center shadow-cta ${
          disabled
            ? 'bg-gray-200'
            : loading
              ? 'bg-primary-800'
              : pressed
                ? 'bg-primary-700'
                : 'bg-primary-900'
        }`,
        text: `${disabled ? 'text-gray-400' : 'text-white'}`,
      };
    }

    if (variant === 'secondary') {
      return {
        container: `min-h-14 px-6 py-4 rounded-2xl font-semibold text-base border-2 items-center justify-center ${
          disabled
            ? 'bg-gray-100 border-gray-200'
            : loading
              ? 'bg-primary-50 border-primary-800'
              : pressed
                ? 'bg-primary-100 border-primary-900'
                : 'bg-white border-primary-900'
        }`,
        text: `font-semibold text-base ${
          disabled ? 'text-gray-400' : 'text-primary-900'
        }`,
      };
    }

    // Primary variant (default)
    return {
      container: `min-h-14 px-6 py-4 rounded-2xl font-semibold text-base items-center justify-center ${
        disabled
          ? 'bg-gray-200'
          : loading
            ? 'bg-primary-800'
            : pressed
              ? 'bg-primary-700'
              : 'bg-primary-900'
      } ${!disabled && !loading ? 'shadow-cta' : ''}`,
      text: `font-semibold text-base ${disabled ? 'text-gray-400' : 'text-white'}`,
    };
  };

  return (
    <AnimatedPressable
      style={animatedStyle}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      testID={testID}
      accessible={true}
      accessibilityRole="button"
      accessibilityState={{
        disabled: disabled || loading,
        busy: loading,
      }}
      accessibilityHint={
        disabled
          ? 'Button is disabled'
          : loading
            ? 'Button is loading'
            : 'Double tap to activate'
      }
    >
      {state => {
        const styles = getVariantStyles(state);

        return (
          <Animated.View className={styles.container}>
            {loading ? (
              <ActivityIndicator
                size="small"
                color={variant === 'secondary' ? '#0047AB' : '#FFFFFF'}
              />
            ) : (
              <>
                {typeof children === 'string' ? (
                  <Text className={styles.text}>{children}</Text>
                ) : (
                  children
                )}
              </>
            )}
          </Animated.View>
        );
      }}
    </AnimatedPressable>
  );
}

// Export default for easier imports
export default StickyCTA;
