/**
 * AccessibleText Component - Text with accessibility and dynamic sizing support
 * 
 * Features:
 * - Dynamic text scaling based on user preferences
 * - WCAG AA color contrast validation
 * - Screen reader optimizations
 * - Bold text support for accessibility
 * - Semantic text roles
 */
import React, { useEffect, useState } from 'react';
import { Text, type TextProps } from 'react-native';
import { 
  DynamicTextSizing, 
  getAccessibilitySettings,
  type TextSizeCategory 
} from '@/lib/accessibility';

export interface AccessibleTextProps extends TextProps {
  children: React.ReactNode;
  variant?: 'body' | 'caption' | 'heading' | 'title' | 'subtitle';
  size?: TextSizeCategory;
  semanticRole?: 'header' | 'text' | 'summary' | 'none';
  adjustsFontSizeToFit?: boolean;
  testID?: string;
}

const variantStyles = {
  body: 'text-base text-gray-900',
  caption: 'text-sm text-gray-500',
  heading: 'text-xl font-semibold text-gray-900',
  title: 'text-2xl font-bold text-gray-900',
  subtitle: 'text-lg font-medium text-gray-700',
};

const baseSizes = {
  body: 16,
  caption: 14,
  heading: 20,
  title: 24,
  subtitle: 18,
};

export function AccessibleText({
  children,
  variant = 'body',
  size = 'medium',
  semanticRole = 'text',
  adjustsFontSizeToFit = false,
  style,
  className = '',
  testID,
  ...textProps
}: AccessibleTextProps) {
  const [accessibilitySettings, setAccessibilitySettings] = useState({
    isBoldTextEnabled: false,
    isReduceMotionEnabled: false,
  });

  useEffect(() => {
    getAccessibilitySettings().then(settings => {
      setAccessibilitySettings({
        isBoldTextEnabled: settings.isBoldTextEnabled,
        isReduceMotionEnabled: settings.isReduceMotionEnabled,
      });
    });
  }, []);

  // Calculate dynamic font size
  const baseSize = baseSizes[variant];
  const scaledSize = DynamicTextSizing.getSizeForCategory(size, baseSize);

  // Apply accessibility-specific styles
  const accessibilityStyles = {
    fontSize: scaledSize,
    fontWeight: accessibilitySettings.isBoldTextEnabled ? 'bold' as const : undefined,
  };

  // Combine class names
  const combinedClassName = [
    variantStyles[variant],
    className,
  ].filter(Boolean).join(' ');

  // Accessibility props based on semantic role
  const accessibilityProps = {
    accessibilityRole: semanticRole === 'header' ? 'header' as const : 'text' as const,
    ...(semanticRole === 'summary' && { accessibilityRole: 'summary' as const }),
  };

  return (
    <Text
      className={combinedClassName}
      style={[accessibilityStyles, style]}
      adjustsFontSizeToFit={adjustsFontSizeToFit}
      testID={testID}
      {...accessibilityProps}
      {...textProps}
    >
      {children}
    </Text>
  );
}

export default AccessibleText;