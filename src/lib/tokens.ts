/**
 * StatLocker Design Tokens
 *
 * These tokens should match the Tailwind configuration exactly.
 * Use these for runtime styling when className is not available.
 */

export const colors = {
  // Single Royal Blue Brand System - No mixing other blue scales
  primary: {
    900: '#0047AB', // Royal Blue (brand)
    800: '#1558B8',
    700: '#1F56C4',
    600: '#2E6FD6',
    500: '#3A84E9',
    100: '#E6F0FF',
  },

  // Status Colors
  success: '#00D4FF', // Aqua Glow
  warning: '#F5C542', // Momentum Gold
  danger: '#DC2626', // Crimson Red

  // Neutral Colors
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    400: '#9CA3AF',
    500: '#6B7280',
    900: '#111827',
  },

  // Surfaces
  white: '#FFFFFF',
  muted: '#1F1F1F',

  // Focus Ring Colors
  focusOuter: '#0047AB',
  focusInner: '#9CA3AF',
} as const;

export const spacing = {
  1: 4, // 4pt
  2: 8, // 8pt
  3: 12, // 12pt
  4: 16, // 16pt
  5: 20, // 20pt
  6: 24, // 24pt
  8: 32, // 32pt
  10: 40, // 40pt
  // Component-specific spacing
  14: 56, // CTA height
  16: 64, // Tab bar base height
  17: 68, // Tab bar max height
  18: 72, // CTA container height
  20: 80, // CTA container with inset
} as const;

export const borderRadius = {
  xl: 16, // 16pt
  '2xl': 24, // 24pt
  '3xl': 28, // 28pt
  '4xl': 32, // 32pt
} as const;

export const shadows = {
  card: '0 1px 2px rgba(0,0,0,.06), 0 8px 24px rgba(0,0,0,.06)',
  cta: '0 8px 24px rgba(0,71,171,.18)',
} as const;

export const typography = {
  // Captions: 12–13pt medium
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500' as const,
  },
  captionLarge: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500' as const,
  },

  // Body: 15–16pt regular
  body: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400' as const,
  },
  bodySmall: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '400' as const,
  },

  // Titles: 22–24pt semibold
  title: {
    fontSize: 22,
    lineHeight: 30,
    fontWeight: '600' as const,
  },
  titleLarge: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '600' as const,
  },
} as const;

export const animation = {
  // Timing for micro-interactions
  micro: 120,
  // Content transitions
  content: 180,
  // Tab transitions
  tab: 200,
  // Entrance animations
  entrance: 240,
} as const;

export const accessibility = {
  // Minimum touch target size
  minTouchTarget: 44,
  // Focus ring width
  focusRingWidth: 2,
  // Focus ring offset
  focusRingOffset: 2,
} as const;

// Utility functions for consistent styling
export const utils = {
  /**
   * Get spacing value by key
   */
  getSpacing: (key: keyof typeof spacing) => spacing[key],

  /**
   * Get color value by path (e.g., 'primary.900', 'gray.500')
   */
  getColor: (path: string) => {
    const keys = path.split('.');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let value: any = colors;

    for (const key of keys) {
      value = value[key];
      if (value === undefined) {
        console.warn(`Color path "${path}" not found in design tokens`);
        return colors.gray[500]; // Fallback
      }
    }

    return value;
  },

  /**
   * Create consistent shadow styles for React Native
   */
  getShadowStyle: (shadowKey: keyof typeof shadows) => {
    // Parse shadow string for React Native
    if (shadowKey === 'card') {
      return {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 2, // Android
      };
    }

    if (shadowKey === 'cta') {
      return {
        shadowColor: '#0047AB',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.18,
        shadowRadius: 24,
        elevation: 8, // Android
      };
    }

    return {};
  },

  /**
   * Get typography style object
   */
  getTypographyStyle: (key: keyof typeof typography) => {
    const typo = typography[key];
    return {
      fontSize: typo.fontSize,
      lineHeight: typo.lineHeight,
      fontWeight: typo.fontWeight,
    };
  },

  /**
   * Create focus ring style for accessibility
   */
  getFocusRingStyle: (isVisible: boolean = false) => ({
    borderWidth: isVisible ? accessibility.focusRingWidth : 0,
    borderColor: isVisible ? colors.focusOuter : 'transparent',
  }),

  /**
   * Ensure minimum touch target size
   */
  getTouchTargetStyle: (width?: number, height?: number) => ({
    minWidth: Math.max(width || 0, accessibility.minTouchTarget),
    minHeight: Math.max(height || 0, accessibility.minTouchTarget),
  }),
} as const;

// Type exports for TypeScript
export type ColorPath =
  | 'primary.900'
  | 'primary.800'
  | 'primary.700'
  | 'primary.600'
  | 'primary.500'
  | 'primary.100'
  | 'success'
  | 'warning'
  | 'danger'
  | 'gray.50'
  | 'gray.100'
  | 'gray.200'
  | 'gray.400'
  | 'gray.500'
  | 'gray.900'
  | 'white'
  | 'muted'
  | 'focusOuter'
  | 'focusInner';

export type SpacingKey = keyof typeof spacing;
export type TypographyKey = keyof typeof typography;
export type ShadowKey = keyof typeof shadows;
