/**
 * Tag/Chip Component - Small labeled elements
 * 
 * Features:
 * - Default, success, and primary variants
 * - Consistent styling with design tokens
 * - Support for custom content
 */
import React from 'react';
import { View, Text, type ViewProps } from 'react-native';

export type TagVariant = 'default' | 'success' | 'primary' | 'warning' | 'danger';
export type TagSize = 'small' | 'default';

export interface TagProps extends Omit<ViewProps, 'children'> {
  children: React.ReactNode;
  variant?: TagVariant;
  size?: TagSize;
  testID?: string;
}

export function Tag({
  children,
  variant = 'default',
  size = 'default',
  testID,
  className = '',
  ...viewProps
}: TagProps) {
  // Size classes
  const sizeClasses = {
    small: 'px-2 py-1 rounded-md',
    default: 'px-3 py-1.5 rounded-lg',
  };

  // Variant classes
  const variantClasses = {
    default: 'bg-gray-100 text-gray-700',
    success: 'bg-green-100 text-green-800',
    primary: 'bg-primary-100 text-primary-900',
    warning: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-800',
  };

  // Text size classes
  const textSizeClasses = {
    small: 'text-xs',
    default: 'text-sm',
  };

  const containerClasses = [
    sizeClasses[size],
    variantClasses[variant].split(' ')[0], // Background color
    'flex-row',
    'items-center',
    'self-start',
    className,
  ].filter(Boolean).join(' ');

  const textColorClass = variantClasses[variant].split(' ')[1]; // Text color

  return (
    <View
      className={containerClasses}
      testID={testID}
      {...viewProps}
    >
      {typeof children === 'string' ? (
        <Text className={`${textColorClass} ${textSizeClasses[size]} font-medium`}>
          {children}
        </Text>
      ) : (
        children
      )}
    </View>
  );
}

export default Tag;