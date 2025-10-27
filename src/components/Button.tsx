/**
 * Button Component - Core button with all variants
 * 
 * Features:
 * - Primary, secondary, and ghost variants
 * - Loading, disabled, and pressed states
 * - 44pt minimum touch targets for accessibility
 * - Haptic feedback integration
 * - Focus ring support
 */
import React from 'react';
import { 
  Pressable, 
  Text, 
  ActivityIndicator, 
  View,
  type PressableProps 
} from 'react-native';
import { HapticFeedback } from '@/lib/haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';
export type ButtonSize = 'default' | 'large';

export interface ButtonProps extends Omit<PressableProps, 'children'> {
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  onPress?: () => void;
  testID?: string;
  accessibilityLabel?: string;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function Button({
  children,
  variant = 'primary',
  size = 'default',
  loading = false,
  disabled = false,
  fullWidth = true,
  onPress,
  testID,
  accessibilityLabel,
  ...pressableProps
}: ButtonProps) {
  const scale = useSharedValue(1);

  // Animation styles
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // Handle press with haptic feedback and animation
  const handlePressIn = () => {
    if (!disabled && !loading) {
      scale.value = withTiming(0.98, {
        duration: 120,
        easing: Easing.out(Easing.quad),
      });
      // Light haptic feedback
      HapticFeedback.buttonPress(testID);
    }
  };

  const handlePressOut = () => {
    if (!disabled && !loading) {
      scale.value = withTiming(1, {
        duration: 120,
        easing: Easing.out(Easing.quad),
      });
    }
  };

  const handlePress = () => {
    if (!disabled && !loading && onPress) {
      onPress();
    }
  };

  // Base styles
  const baseClasses = [
    'rounded-2xl',
    'font-semibold',
    'text-base',
    'flex-row',
    'items-center',
    'justify-center',
    fullWidth ? 'w-full' : 'self-start',
    size === 'large' ? 'min-h-[56px] px-6 py-4' : 'min-h-[44px] px-4 py-3',
  ];

  // Variant-specific styles
  const variantClasses = {
    primary: [
      'bg-primary-900',
      disabled || loading ? 'bg-gray-200' : 'bg-primary-900',
    ],
    secondary: [
      'bg-white',
      'border-2',
      disabled || loading ? 'border-gray-200' : 'border-primary-900',
    ],
    ghost: [
      'bg-transparent',
    ],
  };

  // Text color classes
  const textClasses = {
    primary: disabled || loading ? 'text-gray-400' : 'text-white',
    secondary: disabled || loading ? 'text-gray-400' : 'text-primary-900',
    ghost: disabled || loading ? 'text-gray-400' : 'text-primary-900',
  };

  const buttonClasses = [
    ...baseClasses,
    ...variantClasses[variant],
  ].join(' ');

  const textClass = textClasses[variant];

  return (
    <AnimatedPressable
      style={animatedStyle}
      className={buttonClasses}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      disabled={disabled || loading}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || (typeof children === 'string' ? children : undefined)}
      accessibilityState={{
        disabled: disabled || loading,
        busy: loading,
      }}
      {...pressableProps}
    >
      {loading && (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? '#FFFFFF' : '#0047AB'}
          className="mr-2"
        />
      )}
      
      {typeof children === 'string' ? (
        <Text className={`${textClass} font-semibold text-base`}>
          {children}
        </Text>
      ) : (
        <View className="flex-row items-center">
          {children}
        </View>
      )}
    </AnimatedPressable>
  );
}

export default Button;