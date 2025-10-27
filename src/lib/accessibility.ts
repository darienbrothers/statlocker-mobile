/**
 * Accessibility Utilities - Comprehensive a11y support
 * 
 * Features:
 * - WCAG AA color contrast validation
 * - Screen reader navigation helpers
 * - Focus management utilities
 * - Dynamic text sizing support
 * - Touch target validation
 */

import { AccessibilityInfo, Dimensions } from 'react-native';

// WCAG AA contrast ratio requirements
export const CONTRAST_RATIOS = {
  AA_NORMAL: 4.5,
  AA_LARGE: 3,
  AAA_NORMAL: 7,
  AAA_LARGE: 4.5,
} as const;

// Minimum touch target sizes (44pt as per Apple HIG and Material Design)
export const TOUCH_TARGET = {
  MIN_SIZE: 44,
  RECOMMENDED_SIZE: 48,
} as const;

// Text size categories for dynamic type
export const TEXT_SIZES = {
  xSmall: 0.8,
  small: 0.9,
  medium: 1.0,
  large: 1.1,
  xLarge: 1.2,
  xxLarge: 1.3,
  xxxLarge: 1.4,
} as const;

export type TextSizeCategory = keyof typeof TEXT_SIZES;

/**
 * Calculate relative luminance of a color
 * Used for contrast ratio calculations
 */
function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Parse hex color to RGB values
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  } : null;
}

/**
 * Calculate contrast ratio between two colors
 */
export function getContrastRatio(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  
  if (!rgb1 || !rgb2) {
    throw new Error('Invalid color format. Use hex colors like #ffffff');
  }
  
  const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);
  
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  
  return (brightest + 0.05) / (darkest + 0.05);
}

/**
 * Check if color combination meets WCAG contrast requirements
 */
export function meetsContrastRequirement(
  foreground: string,
  background: string,
  level: 'AA' | 'AAA' = 'AA',
  isLargeText = false
): boolean {
  const ratio = getContrastRatio(foreground, background);
  
  if (level === 'AA') {
    return isLargeText ? ratio >= CONTRAST_RATIOS.AA_LARGE : ratio >= CONTRAST_RATIOS.AA_NORMAL;
  } else {
    return isLargeText ? ratio >= CONTRAST_RATIOS.AAA_LARGE : ratio >= CONTRAST_RATIOS.AAA_NORMAL;
  }
}

/**
 * Validate touch target size
 */
export function validateTouchTarget(width: number, height: number): {
  isValid: boolean;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  const minSize = TOUCH_TARGET.MIN_SIZE;
  const recommendedSize = TOUCH_TARGET.RECOMMENDED_SIZE;
  
  if (width < minSize || height < minSize) {
    recommendations.push(`Touch target too small. Minimum size is ${minSize}pt x ${minSize}pt`);
  }
  
  if (width < recommendedSize || height < recommendedSize) {
    recommendations.push(`Consider using recommended size of ${recommendedSize}pt x ${recommendedSize}pt`);
  }
  
  return {
    isValid: width >= minSize && height >= minSize,
    recommendations,
  };
}

/**
 * Screen reader utilities
 */
export class ScreenReaderUtils {
  static async isScreenReaderEnabled(): Promise<boolean> {
    try {
      return await AccessibilityInfo.isScreenReaderEnabled();
    } catch (error) {
      console.warn('Failed to check screen reader status:', error);
      return false;
    }
  }
  
  static async announceForAccessibility(message: string): Promise<void> {
    try {
      AccessibilityInfo.announceForAccessibility(message);
    } catch (error) {
      console.warn('Failed to announce for accessibility:', error);
    }
  }
  
  static async setAccessibilityFocus(reactTag: number): Promise<void> {
    try {
      AccessibilityInfo.setAccessibilityFocus(reactTag);
    } catch (error) {
      console.warn('Failed to set accessibility focus:', error);
    }
  }
}

/**
 * Focus management utilities
 */
export class FocusManager {
  private static focusHistory: number[] = [];
  
  static pushFocus(reactTag: number): void {
    this.focusHistory.push(reactTag);
    ScreenReaderUtils.setAccessibilityFocus(reactTag);
  }
  
  static popFocus(): void {
    this.focusHistory.pop();
    const previousFocus = this.focusHistory[this.focusHistory.length - 1];
    if (previousFocus) {
      ScreenReaderUtils.setAccessibilityFocus(previousFocus);
    }
  }
  
  static clearFocusHistory(): void {
    this.focusHistory = [];
  }
  
  static getFocusHistory(): number[] {
    return [...this.focusHistory];
  }
}

/**
 * Dynamic text sizing utilities
 */
export class DynamicTextSizing {
  private static currentScale = 1.0;
  
  static setTextScale(scale: number): void {
    this.currentScale = Math.max(0.5, Math.min(2.0, scale)); // Clamp between 0.5x and 2.0x
  }
  
  static getTextScale(): number {
    return this.currentScale;
  }
  
  static getScaledSize(baseSize: number): number {
    return Math.round(baseSize * this.currentScale);
  }
  
  static getSizeForCategory(category: TextSizeCategory, baseSize: number): number {
    const multiplier = TEXT_SIZES[category];
    return Math.round(baseSize * multiplier * this.currentScale);
  }
}

/**
 * Accessibility testing utilities
 */
export class AccessibilityTester {
  static validateComponent(props: {
    hasAccessibilityLabel?: boolean;
    hasAccessibilityRole?: boolean;
    hasAccessibilityHint?: boolean;
    touchTargetSize?: { width: number; height: number };
    colorContrast?: { foreground: string; background: string; isLargeText?: boolean };
  }): {
    isValid: boolean;
    violations: string[];
    warnings: string[];
  } {
    const violations: string[] = [];
    const warnings: string[] = [];
    
    // Check accessibility labels
    if (props.hasAccessibilityLabel === false) {
      violations.push('Interactive element missing accessibility label');
    }
    
    // Check accessibility roles
    if (props.hasAccessibilityRole === false) {
      warnings.push('Consider adding accessibility role for better screen reader support');
    }
    
    // Check touch target size
    if (props.touchTargetSize) {
      const validation = validateTouchTarget(
        props.touchTargetSize.width,
        props.touchTargetSize.height
      );
      if (!validation.isValid) {
        violations.push(...validation.recommendations);
      }
    }
    
    // Check color contrast
    if (props.colorContrast) {
      const meetsAA = meetsContrastRequirement(
        props.colorContrast.foreground,
        props.colorContrast.background,
        'AA',
        props.colorContrast.isLargeText
      );
      
      if (!meetsAA) {
        violations.push('Color contrast does not meet WCAG AA requirements');
      }
    }
    
    return {
      isValid: violations.length === 0,
      violations,
      warnings,
    };
  }
}

/**
 * Accessibility hooks and utilities for React components
 */
export function createAccessibilityProps(options: {
  label?: string;
  hint?: string;
  role?: string;
  state?: Record<string, boolean | string>;
  actions?: Array<{ name: string; label: string }>;
}) {
  const props: Record<string, any> = {};
  
  if (options.label) {
    props.accessibilityLabel = options.label;
  }
  
  if (options.hint) {
    props.accessibilityHint = options.hint;
  }
  
  if (options.role) {
    props.accessibilityRole = options.role;
  }
  
  if (options.state) {
    props.accessibilityState = options.state;
  }
  
  if (options.actions) {
    props.accessibilityActions = options.actions.map(action => ({
      name: action.name,
      label: action.label,
    }));
  }
  
  return props;
}

/**
 * Get device accessibility settings
 */
export async function getAccessibilitySettings(): Promise<{
  isScreenReaderEnabled: boolean;
  isReduceMotionEnabled: boolean;
  isReduceTransparencyEnabled: boolean;
  isBoldTextEnabled: boolean;
}> {
  try {
    const [
      isScreenReaderEnabled,
      isReduceMotionEnabled,
      isReduceTransparencyEnabled,
      isBoldTextEnabled,
    ] = await Promise.all([
      AccessibilityInfo.isScreenReaderEnabled(),
      AccessibilityInfo.isReduceMotionEnabled(),
      AccessibilityInfo.isReduceTransparencyEnabled(),
      AccessibilityInfo.isBoldTextEnabled(),
    ]);
    
    return {
      isScreenReaderEnabled,
      isReduceMotionEnabled,
      isReduceTransparencyEnabled,
      isBoldTextEnabled,
    };
  } catch (error) {
    console.warn('Failed to get accessibility settings:', error);
    return {
      isScreenReaderEnabled: false,
      isReduceMotionEnabled: false,
      isReduceTransparencyEnabled: false,
      isBoldTextEnabled: false,
    };
  }
}