/**
 * Divider Component - Content separation
 * 
 * Features:
 * - Horizontal and vertical orientations
 * - Different thickness options
 * - Consistent styling with design tokens
 */
import React from 'react';
import { View, type ViewProps } from 'react-native';

export type DividerOrientation = 'horizontal' | 'vertical';
export type DividerThickness = 'thin' | 'default' | 'thick';

export interface DividerProps extends ViewProps {
  orientation?: DividerOrientation;
  thickness?: DividerThickness;
  color?: 'default' | 'light' | 'dark';
  testID?: string;
}

export function Divider({
  orientation = 'horizontal',
  thickness = 'default',
  color = 'default',
  testID,
  className = '',
  ...viewProps
}: DividerProps) {
  // Thickness classes
  const thicknessClasses = {
    horizontal: {
      thin: 'h-px',
      default: 'h-0.5',
      thick: 'h-1',
    },
    vertical: {
      thin: 'w-px',
      default: 'w-0.5',
      thick: 'w-1',
    },
  };

  // Color classes
  const colorClasses = {
    default: 'bg-gray-200',
    light: 'bg-gray-100',
    dark: 'bg-gray-300',
  };

  // Orientation classes
  const orientationClasses = {
    horizontal: 'w-full',
    vertical: 'h-full',
  };

  const dividerClasses = [
    orientationClasses[orientation],
    thicknessClasses[orientation][thickness],
    colorClasses[color],
    className,
  ].filter(Boolean).join(' ');

  return (
    <View
      className={dividerClasses}
      testID={testID}
      accessibilityRole="none"
      {...viewProps}
    />
  );
}

export default Divider;