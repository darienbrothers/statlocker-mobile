/**
 * Offline Banner Component
 * 
 * Displays network status and offline mode indicators
 * with clear messaging and retry functionality.
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { useOnboardingTheme } from './OnboardingThemeProvider';

interface OfflineBannerProps {
  /** Whether to show the banner */
  visible?: boolean;
  /** Custom offline message */
  message?: string;
  /** Callback when retry is pressed */
  onRetry?: () => void;
  /** Whether retry is in progress */
  retrying?: boolean;
  /** Position of the banner */
  position?: 'top' | 'bottom';
}

export function OfflineBanner({
  visible,
  message = "You're offline. Some features may not work.",
  onRetry,
  retrying = false,
  position = 'top',
}: OfflineBannerProps) {
  const { tokens } = useOnboardingTheme();
  const [isOffline, setIsOffline] = React.useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  // Monitor network status
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOffline(!state.isConnected);
    });

    return unsubscribe;
  }, []);

  // Control banner visibility
  const shouldShow = visible !== undefined ? visible : isOffline;

  // Animate banner appearance
  useEffect(() => {
    if (shouldShow) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 1,
          duration: tokens.animation.content,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: tokens.animation.content,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: tokens.animation.content,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: tokens.animation.content,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [shouldShow, slideAnim, opacityAnim, tokens.animation.content]);

  if (!shouldShow) {
    return null;
  }

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: position === 'top' ? [-60, 0] : [60, 0],
  });

  const bannerStyle = {
    transform: [{ translateY }],
    opacity: opacityAnim,
  };

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: 0,
          right: 0,
          [position]: 0,
          backgroundColor: tokens.colors.warning,
          paddingHorizontal: tokens.spacing.stepPadding,
          paddingVertical: 12,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: tokens.zIndex.toast,
          ...tokens.shadows.card,
        },
        bannerStyle,
      ]}
      accessibilityRole="alert"
      accessibilityLiveRegion="assertive"
    >
      {/* Offline Icon */}
      <View
        style={{
          width: 20,
          height: 20,
          borderRadius: 10,
          backgroundColor: tokens.colors.white,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 12,
        }}
      >
        <Text
          style={{
            fontSize: 12,
            color: tokens.colors.warning,
            fontWeight: 'bold',
          }}
        >
          !
        </Text>
      </View>

      {/* Message */}
      <Text
        style={{
          flex: 1,
          color: tokens.colors.white,
          fontSize: tokens.typography.formLabel.fontSize,
          fontWeight: tokens.typography.formLabel.fontWeight,
        }}
      >
        {message}
      </Text>

      {/* Retry Button */}
      {onRetry && (
        <TouchableOpacity
          onPress={onRetry}
          disabled={retrying}
          style={{
            backgroundColor: tokens.colors.white,
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 16,
            marginLeft: 12,
            opacity: retrying ? 0.6 : 1,
          }}
          accessibilityRole="button"
          accessibilityLabel={retrying ? "Retrying connection" : "Retry connection"}
          accessibilityState={{ disabled: retrying }}
        >
          <Text
            style={{
              color: tokens.colors.warning,
              fontSize: tokens.typography.formHint.fontSize,
              fontWeight: tokens.typography.formLabel.fontWeight,
            }}
          >
            {retrying ? 'Retrying...' : 'Retry'}
          </Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
}

/**
 * Hook for managing offline state and retry logic
 * 
 * @example
 * const { isOffline, retryConnection, isRetrying } = useOfflineState();
 */
export function useOfflineState() {
  const [isOffline, setIsOffline] = React.useState(false);
  const [isRetrying, setIsRetrying] = React.useState(false);
  const [lastRetryTime, setLastRetryTime] = React.useState<Date | null>(null);

  // Monitor network status
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const wasOffline = isOffline;
      const nowOffline = !state.isConnected;
      
      setIsOffline(nowOffline);
      
      // If we just came back online, stop retrying
      if (wasOffline && !nowOffline) {
        setIsRetrying(false);
      }
    });

    return unsubscribe;
  }, [isOffline]);

  const retryConnection = React.useCallback(async () => {
    if (isRetrying) return;

    setIsRetrying(true);
    setLastRetryTime(new Date());

    try {
      // Check network state
      const state = await NetInfo.fetch();
      setIsOffline(!state.isConnected);
      
      // Simulate retry delay for UX
      await new Promise(resolve => setTimeout(resolve, 1500));
    } catch (error) {
      console.warn('Network retry failed:', error);
    } finally {
      setIsRetrying(false);
    }
  }, [isRetrying]);

  return {
    isOffline,
    isRetrying,
    lastRetryTime,
    retryConnection,
  };
}