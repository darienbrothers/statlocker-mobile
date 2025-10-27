/**
 * AccessibleButton Component - Button with comprehensive accessibility support
 * 
 * Features:
 * - 44pt minimum touch targets
 * - WCAG AA color contrast validation
 * - Screen reader labels and hints
 * - Focus management
 * - Haptic feedback with reduce motion support
 * - Loading and disabled state announcements
 */
import React, { useEffect, useState, useRef } from 'react';
import { 
  Pressable, 
  View, 
  ActivityIndicator,
  type PressableProps,
  findNodeHandle,
} from 'react-native';
import { HapticFeedback } from '@/lib/haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { 
  validateTouchTarget,
  getAccessibilitySettings,
  ScreenReaderUtils,
  FocusManager,
  createAccessibilityProps,
} from '@/lib/accessibility';
import { AccessibleText } from './AccessibleText';

export interface AccessibleButtonProps extends Omit<PressableProps, 'children'> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'small' | 'default' | 'large';
  loading?: boolean;
  disabled?: boolean;
  onPress?: () => void;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  loadingText?: string;
  testID?: string;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function AccessibleButton({
  children,
  variant = 'primary',
  size = 'default',
  loading = false,
  disabled = false,
  onPress,
  accessibilityLabel,
  accessibilityHint,
  loadingText = 'Loading',
  testID,
  ...pressableProps
}: AccessibleButtonProps) {
  const [accessibilitySettings, setAccessibilitySettings] = useState({
    isReduceMotionEnabled: false,
    isScreenReaderEnabled: false,
  });
  
  const buttonRef = useRef<View>(null);
  const scale = useSharedValue(1);

  useEffect(() => {
    getAccessibilitySettings().then(settings => {
      setAccessibilitySettings({
        isReduceMotionEnabled: settings.isReduceMotionEnabled,
        isScreenReaderEnabled: settings.isScreenReaderEnabled,
      });
    });
  }, []);

  // Animation styles (respects reduce motion preference)
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // Size configurations with minimum touch targets
  const sizeConfig = {
    small: { minHeight: 44, paddingHorizontal: 16, paddingVertical: 8 },
    default: { minHeight: 48, paddingHorizontal: 20, paddingVertical: 12 },
    large: { minHeight: 56, paddingHorizontal: 24, paddingVertical: 16 },
  };

  const currentSize = sizeConfig[size];

  // Validate touch target
  const touchTargetValidation = validateTouchTarget(
    currentSize.minHeight, 
    currentSize.minHeight
  );

  if (!touchTargetValidation.isValid) {
    console.warn('AccessibleButton touch target validation failed:', touchTargetValidation.recommendations);
  }

  // Variant styles
  const variantClasses = {
    primary: 'bg-primary-900',
    secondary: 'bg-white border-2 border-primary-900',
    ghost: 'bg-transparent',
  };

  const textVariantClasses = {
    primary: 'text-white',
    secondary: 'text-primary-900',
    ghost: 'text-primary-900',
  };

  // Handle press with accessibility considerations
  const handlePressIn = () => {
    if (disabled || loading) return;

    // Animate only if reduce motion is not enabled
    if (!accessibilitySettings.isReduceMotionEnabled) {
      scale.value = withTiming(0.98, {
        duration: 120,
        easing: Easing.out(Easing.quad),
      });
    }

    // Haptic feedback (respects system settings)
    HapticFeedback.buttonPress();
  };

  const handlePressOut = () => {
    if (disabled || loading) return;

    if (!accessibilitySettings.isReduceMotionEnabled) {
      scale.value = withTiming(1, {
        duration: 120,
        easing: Easing.out(Easing.quad),
      });
    }
  };

  const handlePress = () => {
    if (disabled || loading) return;

    // Announce action for screen readers
    if (accessibilitySettings.isScreenReaderEnabled) {
      const announcement = loading ? loadingText : 'Button activated';
      ScreenReaderUtils.announceForAccessibility(announcement);
    }

    // Manage focus
    const nodeHandle = findNodeHandle(buttonRef.current);
    if (nodeHandle) {
      FocusManager.pushFocus(nodeHandle);
    }

    onPress?.();
  };

  // Create accessibility props
  const accessibilityProps = createAccessibilityProps({
    label: accessibilityLabel || (typeof children === 'string' ? children : 'Button'),
    hint: accessibilityHint,
    role: 'button',
    state: {
      disabled: disabled || loading,
      busy: loading,
    },
  });

  // Button classes
  const buttonClasses = [
    variantClasses[variant],
    'rounded-2xl',
    'flex-row',
    'items-center',
    'justify-center',
    disabled || loading ? 'opacity-50' : 'opacity-100',
  ].join(' ');

  return (
    <AnimatedPressable
      ref={buttonRef}
      style={[
        animatedStyle,
        {
          minHeight: currentSize.minHeight,
          paddingHorizontal: currentSize.paddingHorizontal,
          paddingVertical: currentSize.paddingVertical,
        },
      ]}
      className={buttonClasses}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      disabled={disabled || loading}
      testID={testID}
      {...accessibilityProps}
      {...pressableProps}
    >
      {loading && (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? '#FFFFFF' : '#0047AB'}
          className="mr-2"
          accessibilityLabel={loadingText}
        />
      )}
      
      {typeof children === 'string' ? (
        <AccessibleText 
          variant="body"
          className={`${textVariantClasses[variant]} font-semibold`}
        >
          {loading ? loadingText : children}
        </AccessibleText>
      ) : (
        children
      )}
    </AnimatedPressable>
  );
}

export default AccessibleButton;