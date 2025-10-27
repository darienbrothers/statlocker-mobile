/**
 * OfflineBanner Component - Persistent offline banner
 * 
 * Features:
 * - Appears when disconnected from internet
 * - Auto-hide behavior when connection is restored
 * - Warning colors and appropriate messaging
 * - Smooth slide animations
 */
import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useIsOffline } from '@/store';
import { Icon } from './Icon';
import { useTranslation } from '@/hooks/useTranslation';

export interface OfflineBannerProps {
  message?: string;
  testID?: string;
}

export function OfflineBanner({ 
  message,
  testID = 'offline-banner',
}: OfflineBannerProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const isOffline = useIsOffline();
  
  const translateY = useSharedValue(-100);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (isOffline) {
      // Show banner
      translateY.value = withTiming(0, {
        duration: 300,
        easing: Easing.out(Easing.cubic),
      });
      opacity.value = withTiming(1, {
        duration: 300,
        easing: Easing.out(Easing.cubic),
      });
    } else {
      // Hide banner
      translateY.value = withTiming(-100, {
        duration: 300,
        easing: Easing.in(Easing.cubic),
      });
      opacity.value = withTiming(0, {
        duration: 300,
        easing: Easing.in(Easing.cubic),
      });
    }
  }, [isOffline, translateY, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        animatedStyle,
        {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          paddingTop: insets.top,
        },
      ]}
      testID={testID}
      pointerEvents={isOffline ? 'auto' : 'none'}
    >
      <View className="bg-yellow-500 px-4 py-3 flex-row items-center justify-center">
        <Icon 
          name="alert" 
          size="small" 
          color="white"
        />
        <Text className="text-white font-medium text-sm ml-2">
          {message || t('offline.banner')}
        </Text>
      </View>
    </Animated.View>
  );
}

export default OfflineBanner;