/**
 * SLToast - StatLocker Toast Component
 * 
 * A toast notification system for displaying temporary messages
 * with different types and animations
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import { CheckCircle, AlertCircle, Info, X, AlertTriangle } from 'lucide-react-native';
import { haptic } from '@/lib/haptics';

const { width: screenWidth } = Dimensions.get('window');

export interface SLToastProps {
  /** Toast message */
  message: string;
  
  /** Toast type */
  type?: 'success' | 'error' | 'info' | 'warning';
  
  /** Whether toast is visible */
  visible: boolean;
  
  /** Callback when toast is dismissed */
  onDismiss: () => void;
  
  /** Auto dismiss duration in milliseconds (0 to disable) */
  duration?: number;
  
  /** Toast position */
  position?: 'top' | 'bottom';
  
  /** Whether to show close button */
  showCloseButton?: boolean;
  
  /** Action button configuration */
  action?: {
    label: string;
    onPress: () => void;
  };
  
  /** Test ID for testing */
  testID?: string;
}

export const SLToast: React.FC<SLToastProps> = ({
  message,
  type = 'info',
  visible,
  onDismiss,
  duration = 3500,
  position = 'top',
  showCloseButton = true,
  action,
  testID,
}) => {
  const translateY = useRef(new Animated.Value(position === 'top' ? -100 : 100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const timeoutRef = useRef<number | null>(null);

  // Type configurations
  const getTypeConfig = () => {
    switch (type) {
      case 'success':
        return {
          backgroundColor: 'bg-green-50',
          borderColor: 'border-green-200',
          textColor: 'text-green-800',
          iconColor: '#16A34A',
          icon: CheckCircle,
        };
      
      case 'error':
        return {
          backgroundColor: 'bg-red-50',
          borderColor: 'border-red-200',
          textColor: 'text-red-800',
          iconColor: '#DC2626',
          icon: AlertCircle,
        };
      
      case 'warning':
        return {
          backgroundColor: 'bg-amber-50',
          borderColor: 'border-amber-200',
          textColor: 'text-amber-800',
          iconColor: '#D97706',
          icon: AlertTriangle,
        };
      
      case 'info':
      default:
        return {
          backgroundColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          textColor: 'text-blue-800',
          iconColor: '#2563EB',
          icon: Info,
        };
    }
  };

  const typeConfig = getTypeConfig();
  const IconComponent = typeConfig.icon;

  // Animation effects
  useEffect(() => {
    if (visible) {
      // Show animation
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto dismiss
      if (duration > 0) {
        timeoutRef.current = setTimeout(() => {
          handleDismiss();
        }, duration);
      }
    } else {
      // Hide animation
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: position === 'top' ? -100 : 100,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [visible, duration, position]);

  const handleDismiss = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    haptic.light();
    onDismiss();
  };

  const handleActionPress = () => {
    haptic.medium();
    action?.onPress();
  };

  if (!visible) return null;

  return (
    <SafeAreaView 
      className={`absolute left-0 right-0 z-50 ${position === 'top' ? 'top-0' : 'bottom-0'}`}
      pointerEvents="box-none"
      testID={testID}
    >
      <Animated.View
        style={{
          transform: [{ translateY }],
          opacity,
        }}
        className="mx-4 mt-2"
      >
        <View 
          className={`
            ${typeConfig.backgroundColor} 
            ${typeConfig.borderColor} 
            border rounded-2xl p-4 shadow-lg
            flex-row items-start
          `}
          testID={`${testID}-container`}
        >
          {/* Icon */}
          <View className="mr-3 mt-0.5">
            <IconComponent 
              size={20} 
              color={typeConfig.iconColor}
              testID={`${testID}-icon`}
            />
          </View>

          {/* Content */}
          <View className="flex-1">
            <Text 
              className={`${typeConfig.textColor} text-base font-medium leading-relaxed`}
              testID={`${testID}-message`}
            >
              {message}
            </Text>

            {/* Action Button */}
            {action && (
              <TouchableOpacity
                onPress={handleActionPress}
                className="mt-2 self-start"
                testID={`${testID}-action`}
              >
                <Text className={`${typeConfig.textColor} text-sm font-semibold underline`}>
                  {action.label}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Close Button */}
          {showCloseButton && (
            <TouchableOpacity
              onPress={handleDismiss}
              className="ml-2 p-1"
              accessibilityRole="button"
              accessibilityLabel="Dismiss notification"
              testID={`${testID}-close`}
            >
              <X size={18} color={typeConfig.iconColor} />
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>
    </SafeAreaView>
  );
};

/**
 * Toast Manager Hook
 * Provides a simple interface for showing toasts
 */
export interface ToastState {
  visible: boolean;
  message: string;
  type: SLToastProps['type'];
  duration?: number;
  action?: SLToastProps['action'];
}

export const useToast = () => {
  const [toast, setToast] = React.useState<ToastState>({
    visible: false,
    message: '',
    type: 'info',
  });

  const showToast = React.useCallback((
    message: string,
    type: SLToastProps['type'] = 'info',
    options?: {
      duration?: number;
      action?: SLToastProps['action'];
    }
  ) => {
    setToast({
      visible: true,
      message,
      type,
      duration: options?.duration,
      action: options?.action,
    });
  }, []);

  const hideToast = React.useCallback(() => {
    setToast(prev => ({ ...prev, visible: false }));
  }, []);

  const showSuccess = React.useCallback((message: string, options?: { duration?: number; action?: SLToastProps['action'] }) => {
    showToast(message, 'success', options);
  }, [showToast]);

  const showError = React.useCallback((message: string, options?: { duration?: number; action?: SLToastProps['action'] }) => {
    showToast(message, 'error', options);
  }, [showToast]);

  const showWarning = React.useCallback((message: string, options?: { duration?: number; action?: SLToastProps['action'] }) => {
    showToast(message, 'warning', options);
  }, [showToast]);

  const showInfo = React.useCallback((message: string, options?: { duration?: number; action?: SLToastProps['action'] }) => {
    showToast(message, 'info', options);
  }, [showToast]);

  return {
    toast,
    showToast,
    hideToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };
};