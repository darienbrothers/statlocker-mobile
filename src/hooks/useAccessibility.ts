/**
 * useAccessibility Hook - React integration for accessibility features
 * 
 * Features:
 * - Screen reader state monitoring
 * - Dynamic text scaling
 * - Focus management
 * - Accessibility announcements
 * - Reduce motion preferences
 */
import { useEffect, useState, useCallback, useRef } from 'react';
import { AccessibilityInfo, findNodeHandle } from 'react-native';
import { 
  getAccessibilitySettings,
  ScreenReaderUtils,
  FocusManager,
  DynamicTextSizing,
  type TextSizeCategory,
} from '@/lib/accessibility';

export interface AccessibilityState {
  isScreenReaderEnabled: boolean;
  isReduceMotionEnabled: boolean;
  isReduceTransparencyEnabled: boolean;
  isBoldTextEnabled: boolean;
  textScale: number;
}

export function useAccessibility() {
  const [accessibilityState, setAccessibilityState] = useState<AccessibilityState>({
    isScreenReaderEnabled: false,
    isReduceMotionEnabled: false,
    isReduceTransparencyEnabled: false,
    isBoldTextEnabled: false,
    textScale: 1.0,
  });

  const [isLoading, setIsLoading] = useState(true);

  // Initialize accessibility state
  useEffect(() => {
    let isMounted = true;

    const initializeAccessibility = async () => {
      try {
        const settings = await getAccessibilitySettings();
        
        if (!isMounted) return;

        setAccessibilityState({
          ...settings,
          textScale: DynamicTextSizing.getTextScale(),
        });
      } catch (error) {
        console.warn('Failed to initialize accessibility settings:', error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initializeAccessibility();

    return () => {
      isMounted = false;
    };
  }, []);

  // Listen for accessibility changes
  useEffect(() => {
    const subscriptions = [
      AccessibilityInfo.addEventListener('screenReaderChanged', (isEnabled) => {
        setAccessibilityState(prev => ({ ...prev, isScreenReaderEnabled: isEnabled }));
      }),
      AccessibilityInfo.addEventListener('reduceMotionChanged', (isEnabled) => {
        setAccessibilityState(prev => ({ ...prev, isReduceMotionEnabled: isEnabled }));
      }),
      AccessibilityInfo.addEventListener('boldTextChanged', (isEnabled) => {
        setAccessibilityState(prev => ({ ...prev, isBoldTextEnabled: isEnabled }));
      }),
    ];

    return () => {
      subscriptions.forEach(subscription => subscription?.remove());
    };
  }, []);

  // Announcement utilities
  const announce = useCallback(async (message: string) => {
    if (accessibilityState.isScreenReaderEnabled) {
      await ScreenReaderUtils.announceForAccessibility(message);
    }
  }, [accessibilityState.isScreenReaderEnabled]);

  // Focus management utilities
  const setFocus = useCallback(async (ref: React.RefObject<any>) => {
    if (ref.current && accessibilityState.isScreenReaderEnabled) {
      const nodeHandle = findNodeHandle(ref.current);
      if (nodeHandle) {
        await ScreenReaderUtils.setAccessibilityFocus(nodeHandle);
        FocusManager.pushFocus(nodeHandle);
      }
    }
  }, [accessibilityState.isScreenReaderEnabled]);

  const clearFocus = useCallback(() => {
    FocusManager.clearFocusHistory();
  }, []);

  // Text scaling utilities
  const setTextScale = useCallback((scale: number) => {
    DynamicTextSizing.setTextScale(scale);
    setAccessibilityState(prev => ({ ...prev, textScale: scale }));
  }, []);

  const getScaledSize = useCallback((baseSize: number) => {
    return DynamicTextSizing.getScaledSize(baseSize);
  }, []);

  const getSizeForCategory = useCallback((category: TextSizeCategory, baseSize: number) => {
    return DynamicTextSizing.getSizeForCategory(category, baseSize);
  }, []);

  return {
    // State
    ...accessibilityState,
    isLoading,
    
    // Utilities
    announce,
    setFocus,
    clearFocus,
    setTextScale,
    getScaledSize,
    getSizeForCategory,
    
    // Helpers
    shouldReduceMotion: accessibilityState.isReduceMotionEnabled,
    shouldUseBoldText: accessibilityState.isBoldTextEnabled,
    isUsingScreenReader: accessibilityState.isScreenReaderEnabled,
  };
}

export default useAccessibility;