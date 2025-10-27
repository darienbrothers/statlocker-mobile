/**
 * Card Component - Base card with consistent styling
 * 
 * Features:
 * - bg-white, rounded-2xl, shadow-card styling
 * - Consistent padding and border
 * - Support for custom content
 * - Accessibility compliance
 */
import React from 'react';
import { View, type ViewProps } from 'react-native';

export interface CardProps extends ViewProps {
  children: React.ReactNode;
  padding?: 'none' | 'small' | 'default' | 'large';
  testID?: string;
}

export function Card({ 
  children, 
  padding = 'default',
  testID,
  className = '',
  ...viewProps 
}: CardProps) {
  const paddingClasses = {
    none: '',
    small: 'p-3',
    default: 'p-5',
    large: 'p-6',
  };

  const cardClasses = [
    'bg-white',
    'rounded-2xl',
    'shadow-card',
    'border',
    'border-gray-100',
    paddingClasses[padding],
    className,
  ].filter(Boolean).join(' ');

  return (
    <View
      className={cardClasses}
      testID={testID}
      {...viewProps}
    >
      {children}
    </View>
  );
}

export default Card;