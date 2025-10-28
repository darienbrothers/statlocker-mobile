/**
 * SLTextField - StatLocker Text Field Component
 * 
 * A comprehensive text input component with validation, error states,
 * and accessibility features for authentication forms
 */

import React, { useState, forwardRef } from 'react';
import {
  TextInput,
  View,
  Text,
  TouchableOpacity,
  TextInputProps,
  AccessibilityInfo,
} from 'react-native';
import { Eye, EyeOff, AlertCircle } from 'lucide-react-native';

export interface SLTextFieldProps extends Omit<TextInputProps, 'style'> {
  /** Field label */
  label: string;
  
  /** Current value */
  value: string;
  
  /** Change handler */
  onChangeText: (text: string) => void;
  
  /** Error message to display */
  error?: string;
  
  /** Helper text to display below the field */
  helperText?: string;
  
  /** Whether this is a password field */
  secure?: boolean;
  
  /** Whether the field is required */
  required?: boolean;
  
  /** Whether the field is disabled */
  disabled?: boolean;
  
  /** Icon to display on the left */
  leftIcon?: React.ReactNode;
  
  /** Icon to display on the right (excluding password toggle) */
  rightIcon?: React.ReactNode;
  
  /** Custom placeholder text */
  placeholder?: string;
  
  /** Field variant */
  variant?: 'default' | 'outlined' | 'filled';
  
  /** Field size */
  size?: 'small' | 'medium' | 'large';
  
  /** Test ID for testing */
  testID?: string;
}

export const SLTextField = forwardRef<TextInput, SLTextFieldProps>(
  (
    {
      label,
      value,
      onChangeText,
      error,
      helperText,
      secure = false,
      required = false,
      disabled = false,
      leftIcon,
      rightIcon,
      placeholder,
      variant = 'outlined',
      size = 'medium',
      testID,
      autoCapitalize = 'none',
      autoCorrect = false,
      ...textInputProps
    },
    ref
  ) => {
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [isFocused, setIsFocused] = useState(false);

    // Determine if field has content
    const hasContent = value.length > 0;
    const hasError = !!error;

    // Size configurations
    const sizeConfig = {
      small: {
        height: 'h-10',
        text: 'text-sm',
        padding: 'px-3',
        icon: 16,
      },
      medium: {
        height: 'h-12',
        text: 'text-base',
        padding: 'px-4',
        icon: 20,
      },
      large: {
        height: 'h-14',
        text: 'text-lg',
        padding: 'px-5',
        icon: 24,
      },
    };

    const config = sizeConfig[size];

    // Dynamic styles based on state
    const getContainerStyles = () => {
      const baseStyles = `${config.height} ${config.padding} flex-row items-center`;
      
      if (variant === 'outlined') {
        let borderColor = 'border-gray-200';
        if (hasError) borderColor = 'border-red-500';
        else if (isFocused) borderColor = 'border-blue-600';
        else if (disabled) borderColor = 'border-gray-100';
        
        return `${baseStyles} border rounded-xl bg-white ${borderColor}`;
      }
      
      if (variant === 'filled') {
        let bgColor = 'bg-gray-50';
        if (hasError) bgColor = 'bg-red-50';
        else if (isFocused) bgColor = 'bg-blue-50';
        else if (disabled) bgColor = 'bg-gray-100';
        
        return `${baseStyles} rounded-xl ${bgColor}`;
      }
      
      // Default variant
      let borderColor = 'border-gray-200';
      if (hasError) borderColor = 'border-red-500';
      else if (isFocused) borderColor = 'border-blue-600';
      
      return `${baseStyles} border-b-2 bg-transparent ${borderColor}`;
    };

    const getLabelStyles = () => {
      let textColor = 'text-gray-700';
      if (hasError) textColor = 'text-red-600';
      else if (isFocused) textColor = 'text-blue-600';
      else if (disabled) textColor = 'text-gray-400';
      
      return `text-sm font-medium mb-2 ${textColor}`;
    };

    const getTextInputStyles = () => {
      let textColor = 'text-gray-900';
      if (disabled) textColor = 'text-gray-400';
      
      return `flex-1 ${config.text} ${textColor}`;
    };

    const getHelperTextStyles = () => {
      if (hasError) return 'text-red-600 text-sm mt-1';
      return 'text-gray-500 text-sm mt-1';
    };

    // Accessibility
    const accessibilityLabel = `${label}${required ? ', required' : ''}${hasError ? ', has error' : ''}`;
    const accessibilityHint = error || helperText || undefined;

    // Handle password visibility toggle
    const togglePasswordVisibility = () => {
      setIsPasswordVisible(!isPasswordVisible);
      // Announce to screen readers
      AccessibilityInfo.announceForAccessibility(
        isPasswordVisible ? 'Password hidden' : 'Password visible'
      );
    };

    return (
      <View className="w-full" testID={testID}>
        {/* Label */}
        <Text className={getLabelStyles()}>
          {label}
          {required && <Text className="text-red-500 ml-1">*</Text>}
        </Text>

        {/* Input Container */}
        <View className={getContainerStyles()}>
          {/* Left Icon */}
          {leftIcon && (
            <View className="mr-3">
              {leftIcon}
            </View>
          )}

          {/* Text Input */}
          <TextInput
            ref={ref}
            className={getTextInputStyles()}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder || `Enter ${label.toLowerCase()}`}
            placeholderTextColor="#9CA3AF"
            secureTextEntry={secure && !isPasswordVisible}
            editable={!disabled}
            autoCapitalize={autoCapitalize}
            autoCorrect={autoCorrect}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            accessibilityLabel={accessibilityLabel}
            accessibilityHint={accessibilityHint}
            accessibilityRole="text"
            testID={`${testID}-input`}
            {...textInputProps}
          />

          {/* Right Icons */}
          <View className="flex-row items-center">
            {/* Custom Right Icon */}
            {rightIcon && !secure && (
              <View className="ml-3">
                {rightIcon}
              </View>
            )}

            {/* Password Toggle */}
            {secure && (
              <TouchableOpacity
                onPress={togglePasswordVisibility}
                className="ml-3 p-1"
                accessibilityRole="button"
                accessibilityLabel={isPasswordVisible ? 'Hide password' : 'Show password'}
                testID={`${testID}-password-toggle`}
              >
                {isPasswordVisible ? (
                  <EyeOff size={config.icon} color="#6B7280" />
                ) : (
                  <Eye size={config.icon} color="#6B7280" />
                )}
              </TouchableOpacity>
            )}

            {/* Error Icon */}
            {hasError && (
              <View className="ml-3">
                <AlertCircle size={config.icon} color="#EF4444" />
              </View>
            )}
          </View>
        </View>

        {/* Helper Text / Error Message */}
        {(helperText || error) && (
          <Text 
            className={getHelperTextStyles()}
            testID={`${testID}-helper-text`}
            accessibilityRole="text"
          >
            {error || helperText}
          </Text>
        )}
      </View>
    );
  }
);

SLTextField.displayName = 'SLTextField';