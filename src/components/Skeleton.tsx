/**
 * Skeleton Component - Loading placeholders
 * 
 * Features:
 * - Rectangles and text bars matching card/grid proportions
 * - Subtle shimmer animation
 * - Consistent styling with actual content
 * - Multiple preset shapes
 */
import React, { useEffect } from 'react';
import { View, type ViewStyle, type DimensionValue } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useTranslation } from '@/hooks/useTranslation';

export type SkeletonVariant = 'text' | 'title' | 'card' | 'circle' | 'rectangle';

export interface SkeletonProps {
  variant?: SkeletonVariant;
  width?: DimensionValue;
  height?: DimensionValue;
  className?: string;
  testID?: string;
  animate?: boolean;
}

export function Skeleton({
  variant = 'text',
  width,
  height,
  className = '',
  testID,
  animate = true,
}: SkeletonProps) {
  const { t } = useTranslation();
  const opacity = useSharedValue(1);

  // Shimmer animation
  useEffect(() => {
    if (animate) {
      opacity.value = withRepeat(
        withTiming(0.5, {
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
        }),
        -1,
        true
      );
    }
  }, [animate, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  // Variant-specific dimensions and styling
  const getVariantStyles = (): ViewStyle => {
    switch (variant) {
      case 'text':
        return {
          width: width || '100%',
          height: height || 16,
          borderRadius: 4,
        };
      case 'title':
        return {
          width: width || '60%',
          height: height || 24,
          borderRadius: 6,
        };
      case 'card':
        return {
          width: width || '100%',
          height: height || 120,
          borderRadius: 16,
        };
      case 'circle':
        const size = width || height || 40;
        return {
          width: size,
          height: size,
          borderRadius: typeof size === 'number' ? size / 2 : undefined,
        };
      case 'rectangle':
      default:
        return {
          width: width || '100%',
          height: height || 20,
          borderRadius: 8,
        };
    }
  };

  const variantStyles = getVariantStyles();

  return (
    <Animated.View
      className={`bg-gray-200 ${className}`}
      style={animatedStyle}
      testID={testID}
      accessibilityLabel={t('a11y.loading')}
      accessibilityRole="progressbar"
    >
      <View style={variantStyles} />
    </Animated.View>
  );
}

// Preset skeleton layouts
export function SkeletonCard({ className = '', ...props }: Omit<SkeletonProps, 'variant'>) {
  return (
    <View className={`bg-white rounded-2xl p-5 shadow-card border border-gray-100 ${className}`} {...props}>
      <View className="space-y-3">
        <Skeleton variant="title" width="40%" />
        <Skeleton variant="text" width="100%" />
        <Skeleton variant="text" width="80%" />
      </View>
    </View>
  );
}

export function SkeletonStatCard({ className = '', ...props }: Omit<SkeletonProps, 'variant'>) {
  return (
    <View className={`bg-white rounded-2xl p-5 shadow-card border border-gray-100 ${className}`} {...props}>
      <View className="space-y-2">
        <View className="flex-row justify-between items-start">
          <Skeleton variant="text" width="50%" height={16} />
          <Skeleton variant="rectangle" width={40} height={20} />
        </View>
        <Skeleton variant="title" width="30%" height={28} />
        <Skeleton variant="text" width="40%" height={14} />
      </View>
    </View>
  );
}

export default Skeleton;