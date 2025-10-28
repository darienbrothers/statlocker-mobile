/**
 * SLButton - StatLocker Button Component
 * 
 * A comprehensive button component with multiple variants, loading states,
 * and accessibility features for authentication flows
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  View,
  ActivityIndicator,
  TouchableOpacityProps,
} from 'react-native';
import { haptic } from '@/lib/haptics';

export interface SLButtonProps extends Omit<TouchableOpacityProps, 'style'> {
  /** Button text */
  children: React.ReactNode;
  
  /** Button variant */
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive';
  
  /** Button size */
  size?: 'small' | 'medium' | 'large';
  
  /** Whether button is in loading state */
  loading?: boolean;
  
  /** Whether button is disabled */
  disabled?: boolean;
  
  /** Icon to display before text */
  leftIcon?: React.ReactNode;
  
  /** Icon to display after text */
  rightIcon?: React.ReactNode;
  
  /** Whether button should take full width */
  fullWidth?: boolean;
  
  /** Custom loading text */
  loadingText?: string;
  
  /** Test ID for testing */
  testID?: string;
  
  /** Haptic feedback type */
  hapticFeedback?: 'light' | 'medium' | 'heavy' | 'none';
}

export const SLButton: React.FC<SLButtonProps> = ({
  children,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  loadingText,
  testID,
  hapticFeedback = 'light',
  onPress,
  ...touchableProps
}) => {
  // Size configurations
  const sizeConfig = {
    small: {
      height: 'h-10',
      padding: 'px-4',
      text: 'text-sm',
      icon: 16,
      minWidth: 'min-w-[80px]',
    },
    medium: {
      height: 'h-12',
      padding: 'px-6',
      text: 'text-base',
      icon: 20,
      minWidth: 'min-w-[120px]',
    },
    large: {
      height: 'h-14',
      padding: 'px-8',
      text: 'text-lg',
      icon: 24,
      minWidth: 'min-w-[140px]',
    },
  };

  const config = sizeConfig[size];

  // Variant configurations
  const getVariantStyles = () => {
    const isDisabledOrLoading = disabled || loading;
    
    switch (variant) {
      case 'primary':
        if (isDisabledOrLoading) {
          return 'bg-blue-300 border-blue-300';
        }
        return 'bg-blue-600 border-blue-600 active:bg-blue-700';
      
      case 'secondary':
        if (isDisabledOrLoading) {
          return 'bg-transparent border-gray-200';
        }
        return 'bg-transparent border-gray-300 active:bg-gray-50';
      
      case 'ghost':
        if (isDisabledOrLoading) {
          return 'bg-transparent border-transparent';
        }
        return 'bg-transparent border-transparent active:bg-gray-100';
      
      case 'destructive':
        if (isDisabledOrLoading) {
          return 'bg-red-300 border-red-300';
        }
        return 'bg-red-600 border-red-600 active:bg-red-700';
      
      default:
        return 'bg-blue-600 border-blue-600';
    }
  };

  const getTextStyles = () => {
    const isDisabledOrLoading = disabled || loading;
    
    switch (variant) {
      case 'primary':
        return isDisabledOrLoading ? 'text-white' : 'text-white';
      
      case 'secondary':
        return isDisabledOrLoading ? 'text-gray-400' : 'text-gray-700';
      
      case 'ghost':
        return isDisabledOrLoading ? 'text-gray-400' : 'text-blue-600';
      
      case 'destructive':
        return isDisabledOrLoading ? 'text-white' : 'text-white';
      
      default:
        return 'text-white';
    }
  };

  const getLoadingColor = () => {
    switch (variant) {
      case 'primary':
      case 'destructive':
        return '#FFFFFF';
      case 'secondary':
      case 'ghost':
        return '#6B7280';
      default:
        return '#FFFFFF';
    }
  };

  // Handle press with haptic feedback
  const handlePress = (event: any) => {
    if (disabled || loading) return;
    
    // Provide haptic feedback
    if (hapticFeedback !== 'none') {
      switch (hapticFeedback) {
        case 'light':
          haptic.light();
          break;
        case 'medium':
          haptic.medium();
          break;
        case 'heavy':
          haptic.heavy();
          break;
      }
    }
    
    onPress?.(event);
  };

  // Build container styles
  const containerStyles = [
    // Base styles
    `${config.height} ${config.padding} border rounded-2xl`,
    'flex-row items-center justify-center',
    
    // Width
    fullWidth ? 'w-full' : config.minWidth,
    
    // Variant styles
    getVariantStyles(),
    
    // Shadow for primary and destructive variants
    (variant === 'primary' || variant === 'destructive') && !disabled && !loading
      ? 'shadow-sm'
      : '',
  ].filter(Boolean).join(' ');

  // Accessibility
  const accessibilityLabel = typeof children === 'string' 
    ? `${children}${loading ? ', loading' : ''}${disabled ? ', disabled' : ''}`
    : undefined;

  const accessibilityState = {
    disabled: disabled || loading,
    busy: loading,
  };

  return (
    <TouchableOpacity
      className={containerStyles}
      onPress={handlePress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={accessibilityState}
      testID={testID}
      {...touchableProps}
    >
      {/* Loading State */}
      {loading && (
        <View className="flex-row items-center">
          <ActivityIndicator 
            size="small" 
            color={getLoadingColor()}
            testID={`${testID}-loading`}
          />
          {loadingText && (
            <Text className={`${config.text} font-medium ml-2 ${getTextStyles()}`}>
              {loadingText}
            </Text>
          )}
        </View>
      )}

      {/* Normal State */}
      {!loading && (
        <View className="flex-row items-center">
          {/* Left Icon */}
          {leftIcon && (
            <View className="mr-2">
              {leftIcon}
            </View>
          )}

          {/* Button Text */}
          <Text 
            className={`${config.text} font-medium ${getTextStyles()}`}
            testID={`${testID}-text`}
          >
            {children}
          </Text>

          {/* Right Icon */}
          {rightIcon && (
            <View className="ml-2">
              {rightIcon}
            </View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};