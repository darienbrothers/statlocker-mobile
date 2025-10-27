/**
 * EmptyState Component - 1-line promise + CTA pattern
 * 
 * Features:
 * - Consistent empty state messaging
 * - Optional icon/illustration
 * - Call-to-action button
 * - Centered layout
 */
import React from 'react';
import { View, Text } from 'react-native';
import { Button, type ButtonProps } from './Button';

export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onPress: () => void;
  } & Partial<ButtonProps>;
  testID?: string;
  className?: string;
}

export function EmptyState({
  title,
  description,
  icon,
  action,
  testID,
  className = '',
}: EmptyStateProps) {
  return (
    <View 
      className={`flex-1 items-center justify-center px-8 py-12 ${className}`}
      testID={testID}
    >
      {/* Icon/Illustration */}
      {icon && (
        <View className="mb-6">
          {icon}
        </View>
      )}

      {/* Title */}
      <Text className="text-gray-900 text-xl font-semibold text-center mb-2">
        {title}
      </Text>

      {/* Description */}
      {description && (
        <Text className="text-gray-500 text-base text-center mb-8 leading-6">
          {description}
        </Text>
      )}

      {/* Action Button */}
      {action && (
        <Button
          variant={action.variant || 'primary'}
          fullWidth={action.fullWidth !== false}
          {...action}
        >
          {action.label}
        </Button>
      )}
    </View>
  );
}

export default EmptyState;