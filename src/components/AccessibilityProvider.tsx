/**
 * AccessibilityProvider Component - App-wide accessibility setup
 * 
 * Features:
 * - Initializes accessibility monitoring
 * - Provides accessibility context
 * - Manages focus and announcements
 * - Handles accessibility state changes
 */
import React, { createContext, useContext, type ReactNode } from 'react';
import { useAccessibility } from '@/hooks/useAccessibility';

interface AccessibilityContextType {
  isScreenReaderEnabled: boolean;
  isReduceMotionEnabled: boolean;
  isReduceTransparencyEnabled: boolean;
  isBoldTextEnabled: boolean;
  textScale: number;
  isLoading: boolean;
  announce: (message: string) => Promise<void>;
  setFocus: (ref: React.RefObject<any>) => Promise<void>;
  clearFocus: () => void;
  setTextScale: (scale: number) => void;
  getScaledSize: (baseSize: number) => number;
  getSizeForCategory: (category: any, baseSize: number) => number;
  shouldReduceMotion: boolean;
  shouldUseBoldText: boolean;
  isUsingScreenReader: boolean;
}

const AccessibilityContext = createContext<AccessibilityContextType | null>(null);

interface AccessibilityProviderProps {
  children: ReactNode;
}

export function AccessibilityProvider({ children }: AccessibilityProviderProps) {
  const accessibility = useAccessibility();

  return (
    <AccessibilityContext.Provider value={accessibility}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibilityContext(): AccessibilityContextType {
  const context = useContext(AccessibilityContext);
  
  if (!context) {
    throw new Error('useAccessibilityContext must be used within an AccessibilityProvider');
  }
  
  return context;
}

export default AccessibilityProvider;