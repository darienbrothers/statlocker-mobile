/**
 * Accessibility Utilities Tests
 */
import {
  getContrastRatio,
  meetsContrastRequirement,
  validateTouchTarget,
  ScreenReaderUtils,
  FocusManager,
  DynamicTextSizing,
  AccessibilityTester,
  createAccessibilityProps,
  CONTRAST_RATIOS,
  TOUCH_TARGET,
} from '../accessibility';

// Mock React Native AccessibilityInfo
jest.mock('react-native', () => ({
  AccessibilityInfo: {
    isScreenReaderEnabled: jest.fn(() => Promise.resolve(false)),
    isReduceMotionEnabled: jest.fn(() => Promise.resolve(false)),
    isReduceTransparencyEnabled: jest.fn(() => Promise.resolve(false)),
    isBoldTextEnabled: jest.fn(() => Promise.resolve(false)),
    announceForAccessibility: jest.fn(),
    setAccessibilityFocus: jest.fn(),
  },
  Dimensions: {
    get: jest.fn(() => ({ width: 375, height: 812 })),
  },
}));

describe('Accessibility Utilities', () => {
  describe('Color Contrast', () => {
    it('calculates contrast ratio correctly', () => {
      // White on black should have high contrast
      const highContrast = getContrastRatio('#ffffff', '#000000');
      expect(highContrast).toBeCloseTo(21, 0);

      // Same colors should have contrast ratio of 1
      const sameColor = getContrastRatio('#ffffff', '#ffffff');
      expect(sameColor).toBe(1);
    });

    it('validates WCAG AA compliance', () => {
      // High contrast should pass
      expect(meetsContrastRequirement('#ffffff', '#000000', 'AA')).toBe(true);
      expect(meetsContrastRequirement('#ffffff', '#000000', 'AA', true)).toBe(true);

      // Low contrast should fail
      expect(meetsContrastRequirement('#ffffff', '#f0f0f0', 'AA')).toBe(false);
    });

    it('validates WCAG AAA compliance', () => {
      // Very high contrast should pass AAA
      expect(meetsContrastRequirement('#ffffff', '#000000', 'AAA')).toBe(true);
      
      // Medium contrast might pass AA but fail AAA
      const mediumContrast = getContrastRatio('#ffffff', '#666666');
      expect(mediumContrast).toBeGreaterThan(CONTRAST_RATIOS.AA_NORMAL);
      expect(meetsContrastRequirement('#ffffff', '#666666', 'AAA')).toBe(true);
    });

    it('handles invalid color formats', () => {
      expect(() => getContrastRatio('invalid', '#ffffff')).toThrow();
      expect(() => getContrastRatio('#ffffff', 'invalid')).toThrow();
    });
  });

  describe('Touch Target Validation', () => {
    it('validates minimum touch target size', () => {
      const valid = validateTouchTarget(44, 44);
      expect(valid.isValid).toBe(true);
      expect(valid.recommendations).toHaveLength(1); // Should recommend 48pt

      const invalid = validateTouchTarget(30, 30);
      expect(invalid.isValid).toBe(false);
      expect(invalid.recommendations.length).toBeGreaterThan(0);
    });

    it('provides recommendations for optimal size', () => {
      const optimal = validateTouchTarget(48, 48);
      expect(optimal.isValid).toBe(true);
      expect(optimal.recommendations).toHaveLength(0);
    });
  });

  describe('ScreenReaderUtils', () => {
    it('checks screen reader status', async () => {
      const isEnabled = await ScreenReaderUtils.isScreenReaderEnabled();
      expect(typeof isEnabled).toBe('boolean');
    });

    it('announces for accessibility', async () => {
      await expect(ScreenReaderUtils.announceForAccessibility('Test message')).resolves.toBeUndefined();
    });

    it('sets accessibility focus', async () => {
      await expect(ScreenReaderUtils.setAccessibilityFocus(123)).resolves.toBeUndefined();
    });
  });

  describe('FocusManager', () => {
    beforeEach(() => {
      FocusManager.clearFocusHistory();
    });

    it('manages focus history', () => {
      expect(FocusManager.getFocusHistory()).toHaveLength(0);

      FocusManager.pushFocus(123);
      expect(FocusManager.getFocusHistory()).toEqual([123]);

      FocusManager.pushFocus(456);
      expect(FocusManager.getFocusHistory()).toEqual([123, 456]);

      FocusManager.popFocus();
      expect(FocusManager.getFocusHistory()).toEqual([123]);
    });

    it('clears focus history', () => {
      FocusManager.pushFocus(123);
      FocusManager.pushFocus(456);
      
      FocusManager.clearFocusHistory();
      expect(FocusManager.getFocusHistory()).toHaveLength(0);
    });
  });

  describe('DynamicTextSizing', () => {
    beforeEach(() => {
      DynamicTextSizing.setTextScale(1.0);
    });

    it('manages text scale', () => {
      expect(DynamicTextSizing.getTextScale()).toBe(1.0);

      DynamicTextSizing.setTextScale(1.5);
      expect(DynamicTextSizing.getTextScale()).toBe(1.5);
    });

    it('clamps text scale to reasonable bounds', () => {
      DynamicTextSizing.setTextScale(3.0);
      expect(DynamicTextSizing.getTextScale()).toBe(2.0);

      DynamicTextSizing.setTextScale(0.1);
      expect(DynamicTextSizing.getTextScale()).toBe(0.5);
    });

    it('calculates scaled sizes', () => {
      DynamicTextSizing.setTextScale(1.5);
      
      expect(DynamicTextSizing.getScaledSize(16)).toBe(24);
      expect(DynamicTextSizing.getSizeForCategory('large', 16)).toBe(26); // 16 * 1.1 * 1.5 = 26.4 -> 26
    });
  });

  describe('AccessibilityTester', () => {
    it('validates component accessibility', () => {
      const valid = AccessibilityTester.validateComponent({
        hasAccessibilityLabel: true,
        hasAccessibilityRole: true,
        touchTargetSize: { width: 48, height: 48 },
        colorContrast: { foreground: '#ffffff', background: '#000000' },
      });

      expect(valid.isValid).toBe(true);
      expect(valid.violations).toHaveLength(0);
    });

    it('detects accessibility violations', () => {
      const invalid = AccessibilityTester.validateComponent({
        hasAccessibilityLabel: false,
        touchTargetSize: { width: 30, height: 30 },
        colorContrast: { foreground: '#ffffff', background: '#f0f0f0' },
      });

      expect(invalid.isValid).toBe(false);
      expect(invalid.violations.length).toBeGreaterThan(0);
    });

    it('provides warnings for missing optional features', () => {
      const result = AccessibilityTester.validateComponent({
        hasAccessibilityLabel: true,
        hasAccessibilityRole: false,
      });

      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('createAccessibilityProps', () => {
    it('creates accessibility props object', () => {
      const props = createAccessibilityProps({
        label: 'Test Button',
        hint: 'Tap to perform action',
        role: 'button',
        state: { disabled: false, selected: true },
        actions: [{ name: 'activate', label: 'Activate' }],
      });

      expect(props).toEqual({
        accessibilityLabel: 'Test Button',
        accessibilityHint: 'Tap to perform action',
        accessibilityRole: 'button',
        accessibilityState: { disabled: false, selected: true },
        accessibilityActions: [{ name: 'activate', label: 'Activate' }],
      });
    });

    it('handles optional properties', () => {
      const props = createAccessibilityProps({
        label: 'Simple Button',
      });

      expect(props).toEqual({
        accessibilityLabel: 'Simple Button',
      });
    });
  });

  describe('Constants', () => {
    it('exports correct contrast ratio constants', () => {
      expect(CONTRAST_RATIOS.AA_NORMAL).toBe(4.5);
      expect(CONTRAST_RATIOS.AA_LARGE).toBe(3);
      expect(CONTRAST_RATIOS.AAA_NORMAL).toBe(7);
      expect(CONTRAST_RATIOS.AAA_LARGE).toBe(4.5);
    });

    it('exports correct touch target constants', () => {
      expect(TOUCH_TARGET.MIN_SIZE).toBe(44);
      expect(TOUCH_TARGET.RECOMMENDED_SIZE).toBe(48);
    });
  });
});