/**
 * SLProviderButton - StatLocker Provider Button Component
 * 
 * Specialized buttons for authentication providers (Apple, Google)
 * with proper branding, accessibility, and loading states
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

// Apple and Google brand colors and styling
const PROVIDER_CONFIG = {
  apple: {
    backgroundColor: '#000000',
    textColor: '#FFFFFF',
    borderColor: '#000000',
    loadingColor: '#FFFFFF',
    brandName: 'Apple',
    icon: '🍎', // We'll replace this with proper Apple logo
  },
  google: {
    backgroundColor: '#FFFFFF',
    textColor: '#1F2937',
    borderColor: '#D1D5DB',
    loadingColor: '#6B7280',
    brandName: 'Google',
    icon: 'G', // We'll replace this with proper Google logo
  },
} as const;

export interface SLProviderButtonProps extends Omit<TouchableOpacityProps, 'style'> {
  /** Provider type */
  variant: 'apple' | 'google';
  
  /** Whether button is in loading state */
  loading?: boolean;
  
  /** Whether button is disabled */
  disabled?: boolean;
  
  /** Button size */
  size?: 'medium' | 'large';
  
  /** Whether button should take full width */
  fullWidth?: boolean;
  
  /** Custom loading text */
  loadingText?: string;
  
  /** Test ID for testing */
  testID?: string;
  
  /** Haptic feedback type */
  hapticFeedback?: 'light' | 'medium' | 'heavy' | 'none';
}

export const SLProviderButton: React.FC<SLProviderButtonProps> = ({
  variant,
  loading = false,
  disabled = false,
  size = 'large',
  fullWidth = true,
  loadingText,
  testID,
  hapticFeedback = 'light',
  onPress,
  ...touchableProps
}) => {
  const config = PROVIDER_CONFIG[variant];
  
  // Size configurations
  const sizeConfig = {
    medium: {
      height: 'h-12',
      padding: 'px-6',
      text: 'text-base',
      icon: 20,
    },
    large: {
      height: 'h-14',
      padding: 'px-8',
      text: 'text-lg',
      icon: 24,
    },
  };

  const sizeStyles = sizeConfig[size];

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

  // Build dynamic styles
  const getContainerStyles = () => {
    const isDisabledOrLoading = disabled || loading;
    
    let styles = [
      // Base styles
      sizeStyles.height,
      sizeStyles.padding,
      'border',
      'rounded-2xl',
      'flex-row',
      'items-center',
      'justify-center',
      fullWidth ? 'w-full' : 'min-w-[200px]',
    ];

    // Provider-specific styles
    if (variant === 'apple') {
      if (isDisabledOrLoading) {
        styles.push('bg-gray-800', 'border-gray-800');
      } else {
        styles.push('bg-black', 'border-black', 'active:bg-gray-900');
      }
    } else if (variant === 'google') {
      if (isDisabledOrLoading) {
        styles.push('bg-gray-50', 'border-gray-200');
      } else {
        styles.push('bg-white', 'border-gray-300', 'active:bg-gray-50');
      }
      // Add shadow for Google button
      if (!isDisabledOrLoading) {
        styles.push('shadow-sm');
      }
    }

    return styles.join(' ');
  };

  const getTextStyles = () => {
    return `${sizeStyles.text} font-medium`;
  };

  const getTextColor = () => {
    const isDisabledOrLoading = disabled || loading;
    
    if (isDisabledOrLoading) {
      return variant === 'apple' ? '#9CA3AF' : '#6B7280';
    }
    
    return config.textColor;
  };

  // Accessibility
  const buttonText = `Continue with ${config.brandName}`;
  const accessibilityLabel = `${buttonText}${loading ? ', loading' : ''}${disabled ? ', disabled' : ''}`;
  
  const accessibilityState = {
    disabled: disabled || loading,
    busy: loading,
  };

  return (
    <TouchableOpacity
      className={getContainerStyles()}
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
            color={config.loadingColor}
            testID={`${testID}-loading`}
          />
          {loadingText && (
            <Text 
              className={`ml-3 ${getTextStyles()}`}
              style={{ color: config.loadingColor }}
            >
              {loadingText}
            </Text>
          )}
        </View>
      )}

      {/* Normal State */}
      {!loading && (
        <View className="flex-row items-center">
          {/* Provider Icon */}
          <View className="mr-3">
            {variant === 'apple' ? (
              <AppleIcon size={sizeStyles.icon} />
            ) : (
              <GoogleIcon size={sizeStyles.icon} />
            )}
          </View>

          {/* Button Text */}
          <Text 
            className={getTextStyles()}
            style={{ color: getTextColor() }}
            testID={`${testID}-text`}
          >
            {buttonText}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

/**
 * Apple Icon Component
 * Using a simple Apple logo representation
 */
const AppleIcon: React.FC<{ size: number }> = ({ size }) => (
  <View 
    style={{ 
      width: size, 
      height: size,
      backgroundColor: '#FFFFFF',
      borderRadius: size * 0.2,
    }}
    className="items-center justify-center"
  >
    <Text style={{ fontSize: size * 0.7, color: '#000000' }}>🍎</Text>
  </View>
);

/**
 * Google Icon Component  
 * Using a simple Google logo representation
 */
const GoogleIcon: React.FC<{ size: number }> = ({ size }) => (
  <View 
    style={{ 
      width: size, 
      height: size,
      borderRadius: size * 0.1,
    }}
    className="items-center justify-center bg-white border border-gray-200"
  >
    <Text style={{ fontSize: size * 0.6, fontWeight: 'bold', color: '#4285F4' }}>G</Text>
  </View>
);

/**
 * Specialized Apple Sign-In Button
 * Follows Apple's Human Interface Guidelines
 */
export interface SLAppleSignInButtonProps extends Omit<SLProviderButtonProps, 'variant'> {}

export const SLAppleSignInButton: React.FC<SLAppleSignInButtonProps> = (props) => (
  <SLProviderButton variant="apple" {...props} />
);

/**
 * Specialized Google Sign-In Button
 * Follows Google's branding guidelines
 */
export interface SLGoogleSignInButtonProps extends Omit<SLProviderButtonProps, 'variant'> {}

export const SLGoogleSignInButton: React.FC<SLGoogleSignInButtonProps> = (props) => (
  <SLProviderButton variant="google" {...props} />
);