/**
 * Haptic Feedback Utilities
 * 
 * Features:
 * - Centralized haptic feedback management
 * - Debouncing to prevent haptic stacking
 * - Respect system accessibility preferences
 * - Different feedback types for different interactions
 * - Performance optimized
 */

import * as Haptics from 'expo-haptics';
import { AccessibilityInfo } from 'react-native';

// Haptic feedback types
export enum HapticType {
  Light = 'light',
  Medium = 'medium',
  Heavy = 'heavy',
  Selection = 'selection',
  Success = 'success',
  Warning = 'warning',
  Error = 'error',
}

// Debounce configuration
const DEBOUNCE_DELAY = 50; // 50ms debounce
const hapticTimestamps = new Map<string, number>();

// System preferences cache
let isReduceMotionEnabled = false;
let preferencesChecked = false;

/**
 * Check system accessibility preferences
 */
async function checkAccessibilityPreferences(): Promise<void> {
  if (preferencesChecked) return;
  
  try {
    isReduceMotionEnabled = await AccessibilityInfo.isReduceMotionEnabled();
    preferencesChecked = true;
  } catch (error) {
    console.warn('Failed to check accessibility preferences:', error);
    isReduceMotionEnabled = false;
    preferencesChecked = true;
  }
}

/**
 * Check if haptic should be debounced
 */
function shouldDebounce(key: string): boolean {
  const now = Date.now();
  const lastTime = hapticTimestamps.get(key) || 0;
  
  if (now - lastTime < DEBOUNCE_DELAY) {
    return true;
  }
  
  hapticTimestamps.set(key, now);
  return false;
}

/**
 * Trigger haptic feedback with debouncing and accessibility checks
 */
async function triggerHaptic(
  type: HapticType, 
  options?: {
    debounceKey?: string;
    force?: boolean;
  }
): Promise<void> {
  // Check accessibility preferences
  await checkAccessibilityPreferences();
  
  // Respect reduce motion preference unless forced
  if (isReduceMotionEnabled && !options?.force) {
    return;
  }
  
  // Apply debouncing
  const debounceKey = options?.debounceKey || type;
  if (shouldDebounce(debounceKey)) {
    return;
  }
  
  try {
    switch (type) {
      case HapticType.Light:
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
      case HapticType.Medium:
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
      case HapticType.Heavy:
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        break;
      case HapticType.Selection:
        await Haptics.selectionAsync();
        break;
      case HapticType.Success:
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;
      case HapticType.Warning:
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        break;
      case HapticType.Error:
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        break;
      default:
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  } catch (error) {
    // Haptics might not be available on all devices
    console.warn('Haptic feedback failed:', error);
  }
}

/**
 * Haptic feedback for different UI interactions
 */
export class HapticFeedback {
  /**
   * Light haptic for button presses, tab switches
   */
  static async light(debounceKey?: string): Promise<void> {
    return triggerHaptic(HapticType.Light, { debounceKey });
  }

  /**
   * Medium haptic for important actions
   */
  static async medium(debounceKey?: string): Promise<void> {
    return triggerHaptic(HapticType.Medium, { debounceKey });
  }

  /**
   * Heavy haptic for critical actions
   */
  static async heavy(debounceKey?: string): Promise<void> {
    return triggerHaptic(HapticType.Heavy, { debounceKey });
  }

  /**
   * Selection haptic for picker/selector changes
   */
  static async selection(debounceKey?: string): Promise<void> {
    return triggerHaptic(HapticType.Selection, { debounceKey });
  }

  /**
   * Success haptic for completed actions
   */
  static async success(debounceKey?: string): Promise<void> {
    return triggerHaptic(HapticType.Success, { debounceKey });
  }

  /**
   * Warning haptic for cautionary actions
   */
  static async warning(debounceKey?: string): Promise<void> {
    return triggerHaptic(HapticType.Warning, { debounceKey });
  }

  /**
   * Error haptic for failed actions
   */
  static async error(debounceKey?: string): Promise<void> {
    return triggerHaptic(HapticType.Error, { debounceKey });
  }

  /**
   * Button press haptic (light with button-specific debouncing)
   */
  static async buttonPress(buttonId?: string): Promise<void> {
    return triggerHaptic(HapticType.Light, { 
      debounceKey: buttonId ? `button-${buttonId}` : 'button' 
    });
  }

  /**
   * Tab press haptic (selection with tab-specific debouncing)
   */
  static async tabPress(tabName?: string): Promise<void> {
    return triggerHaptic(HapticType.Selection, { 
      debounceKey: tabName ? `tab-${tabName}` : 'tab' 
    });
  }

  /**
   * CTA press haptic (medium for important actions)
   */
  static async ctaPress(ctaId?: string): Promise<void> {
    return triggerHaptic(HapticType.Medium, { 
      debounceKey: ctaId ? `cta-${ctaId}` : 'cta' 
    });
  }

  /**
   * Navigation haptic (light for navigation actions)
   */
  static async navigation(action?: string): Promise<void> {
    return triggerHaptic(HapticType.Light, { 
      debounceKey: action ? `nav-${action}` : 'navigation' 
    });
  }

  /**
   * Form interaction haptic (selection for form elements)
   */
  static async formInteraction(fieldId?: string): Promise<void> {
    return triggerHaptic(HapticType.Selection, { 
      debounceKey: fieldId ? `form-${fieldId}` : 'form' 
    });
  }

  /**
   * Disable haptics temporarily (useful for rapid interactions)
   */
  static disableTemporarily(duration: number = 1000): void {
    const originalCheck = checkAccessibilityPreferences;
    isReduceMotionEnabled = true;
    
    setTimeout(() => {
      isReduceMotionEnabled = false;
      preferencesChecked = false;
      checkAccessibilityPreferences();
    }, duration);
  }

  /**
   * Clear debounce cache (useful for testing)
   */
  static clearDebounceCache(): void {
    hapticTimestamps.clear();
  }

  /**
   * Check if haptics are available
   */
  static async isAvailable(): Promise<boolean> {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get system preferences
   */
  static async getPreferences(): Promise<{
    isReduceMotionEnabled: boolean;
    isHapticsAvailable: boolean;
  }> {
    await checkAccessibilityPreferences();
    const isHapticsAvailable = await HapticFeedback.isAvailable();
    
    return {
      isReduceMotionEnabled,
      isHapticsAvailable,
    };
  }
}

// Convenience exports
export const haptic = HapticFeedback;
export default HapticFeedback;