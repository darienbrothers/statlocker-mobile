/**
 * SLDividerLabelled - StatLocker Labelled Divider Component
 * 
 * A divider component with centered text label, commonly used
 * to separate different authentication methods
 */

import React from 'react';
import { View, Text } from 'react-native';

export interface SLDividerLabelledProps {
  /** Label text to display in the center */
  label: string;
  
  /** Divider color variant */
  variant?: 'default' | 'light' | 'dark';
  
  /** Size variant */
  size?: 'small' | 'medium' | 'large';
  
  /** Custom text color */
  textColor?: string;
  
  /** Custom line color */
  lineColor?: string;
  
  /** Vertical spacing */
  spacing?: 'tight' | 'normal' | 'loose';
  
  /** Test ID for testing */
  testID?: string;
}

export const SLDividerLabelled: React.FC<SLDividerLabelledProps> = ({
  label,
  variant = 'default',
  size = 'medium',
  textColor,
  lineColor,
  spacing = 'normal',
  testID,
}) => {
  // Size configurations
  const sizeConfig = {
    small: {
      text: 'text-xs',
      padding: 'px-2',
      lineHeight: 'h-px',
    },
    medium: {
      text: 'text-sm',
      padding: 'px-3',
      lineHeight: 'h-px',
    },
    large: {
      text: 'text-base',
      padding: 'px-4',
      lineHeight: 'h-0.5',
    },
  };

  // Variant configurations
  const variantConfig = {
    default: {
      textColor: 'text-gray-500',
      lineColor: 'bg-gray-200',
    },
    light: {
      textColor: 'text-gray-400',
      lineColor: 'bg-gray-100',
    },
    dark: {
      textColor: 'text-gray-600',
      lineColor: 'bg-gray-300',
    },
  };

  // Spacing configurations
  const spacingConfig = {
    tight: 'my-4',
    normal: 'my-6',
    loose: 'my-8',
  };

  const config = sizeConfig[size];
  const colors = variantConfig[variant];
  const spacingClass = spacingConfig[spacing];

  // Use custom colors if provided
  const finalTextColor = textColor || colors.textColor;
  const finalLineColor = lineColor || colors.lineColor;

  return (
    <View 
      className={`flex-row items-center ${spacingClass}`}
      testID={testID}
    >
      {/* Left Line */}
      <View 
        className={`flex-1 ${config.lineHeight} ${finalLineColor}`}
        testID={`${testID}-left-line`}
      />

      {/* Label */}
      <View className={`${config.padding} bg-white`}>
        <Text 
          className={`${config.text} font-medium ${finalTextColor} text-center`}
          testID={`${testID}-label`}
        >
          {label}
        </Text>
      </View>

      {/* Right Line */}
      <View 
        className={`flex-1 ${config.lineHeight} ${finalLineColor}`}
        testID={`${testID}-right-line`}
      />
    </View>
  );
};

/**
 * Simple Divider Component (without label)
 */
export interface SLDividerProps {
  /** Divider color variant */
  variant?: 'default' | 'light' | 'dark';
  
  /** Divider thickness */
  thickness?: 'thin' | 'medium' | 'thick';
  
  /** Vertical spacing */
  spacing?: 'tight' | 'normal' | 'loose';
  
  /** Custom line color */
  color?: string;
  
  /** Test ID for testing */
  testID?: string;
}

export const SLDivider: React.FC<SLDividerProps> = ({
  variant = 'default',
  thickness = 'thin',
  spacing = 'normal',
  color,
  testID,
}) => {
  // Thickness configurations
  const thicknessConfig = {
    thin: 'h-px',
    medium: 'h-0.5',
    thick: 'h-1',
  };

  // Variant configurations
  const variantConfig = {
    default: 'bg-gray-200',
    light: 'bg-gray-100',
    dark: 'bg-gray-300',
  };

  // Spacing configurations
  const spacingConfig = {
    tight: 'my-4',
    normal: 'my-6',
    loose: 'my-8',
  };

  const thicknessClass = thicknessConfig[thickness];
  const colorClass = color ? '' : variantConfig[variant];
  const spacingClass = spacingConfig[spacing];

  return (
    <View 
      className={`w-full ${thicknessClass} ${colorClass} ${spacingClass}`}
      style={color ? { backgroundColor: color } : undefined}
      testID={testID}
    />
  );
};

/**
 * Divider with Icon
 */
export interface SLDividerWithIconProps {
  /** Icon to display in the center */
  icon: React.ReactNode;
  
  /** Divider color variant */
  variant?: 'default' | 'light' | 'dark';
  
  /** Icon background color */
  iconBackgroundColor?: string;
  
  /** Vertical spacing */
  spacing?: 'tight' | 'normal' | 'loose';
  
  /** Test ID for testing */
  testID?: string;
}

export const SLDividerWithIcon: React.FC<SLDividerWithIconProps> = ({
  icon,
  variant = 'default',
  iconBackgroundColor = '#FFFFFF',
  spacing = 'normal',
  testID,
}) => {
  // Variant configurations
  const variantConfig = {
    default: 'bg-gray-200',
    light: 'bg-gray-100',
    dark: 'bg-gray-300',
  };

  // Spacing configurations
  const spacingConfig = {
    tight: 'my-4',
    normal: 'my-6',
    loose: 'my-8',
  };

  const lineColor = variantConfig[variant];
  const spacingClass = spacingConfig[spacing];

  return (
    <View 
      className={`flex-row items-center ${spacingClass}`}
      testID={testID}
    >
      {/* Left Line */}
      <View 
        className={`flex-1 h-px ${lineColor}`}
        testID={`${testID}-left-line`}
      />

      {/* Icon */}
      <View 
        className="px-4 py-2 rounded-full"
        style={{ backgroundColor: iconBackgroundColor }}
        testID={`${testID}-icon-container`}
      >
        {icon}
      </View>

      {/* Right Line */}
      <View 
        className={`flex-1 h-px ${lineColor}`}
        testID={`${testID}-right-line`}
      />
    </View>
  );
};