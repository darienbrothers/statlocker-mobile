/**
 * Progress Component - Progress bar for goal tracking
 * 
 * Features:
 * - Animated progress bar
 * - Support for different colors
 * - Label and percentage display
 * - Accessibility compliance
 */
import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';

export type ProgressVariant = 'primary' | 'success' | 'warning' | 'danger';

export interface ProgressProps {
  value: number; // 0-100
  max?: number;
  variant?: ProgressVariant;
  label?: string;
  showPercentage?: boolean;
  height?: number;
  testID?: string;
  className?: string;
}

export function Progress({
  value,
  max = 100,
  variant = 'primary',
  label,
  showPercentage = true,
  height = 8,
  testID,
  className = '',
}: ProgressProps) {
  const progress = useSharedValue(0);
  
  // Calculate percentage
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  // Update progress animation
  useEffect(() => {
    progress.value = withTiming(percentage, {
      duration: 800,
      easing: Easing.out(Easing.cubic),
    });
  }, [percentage, progress]);

  // Animated style for progress bar
  const animatedStyle = useAnimatedStyle(() => ({
    width: `${progress.value}%`,
  }));

  // Variant colors
  const variantClasses = {
    primary: 'bg-primary-900',
    success: 'bg-green-600',
    warning: 'bg-yellow-500',
    danger: 'bg-red-600',
  };

  return (
    <View className={className} testID={testID}>
      {/* Label and percentage */}
      {(label || showPercentage) && (
        <View className="flex-row justify-between items-center mb-2">
          {label && (
            <Text className="text-gray-700 text-sm font-medium">
              {label}
            </Text>
          )}
          {showPercentage && (
            <Text className="text-gray-500 text-sm">
              {Math.round(percentage)}%
            </Text>
          )}
        </View>
      )}

      {/* Progress bar container */}
      <View 
        className="bg-gray-200 rounded-full overflow-hidden"
        style={{ height }}
        accessibilityRole="progressbar"
        accessibilityValue={{
          min: 0,
          max: max,
          now: value,
        }}
        accessibilityLabel={label || `Progress: ${Math.round(percentage)}%`}
      >
        {/* Progress bar fill */}
        <Animated.View
          className={`h-full rounded-full ${variantClasses[variant]}`}
          style={animatedStyle}
        />
      </View>
    </View>
  );
}

export default Progress;