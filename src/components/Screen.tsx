/**
 * Screen Component - Foundational layout component for StatLocker
 *
 * Provides consistent structure across all screens with:
 * - Safe area handling
 * - Optional header with title
 * - Scrollable or static content
 * - Sticky CTA integration
 * - Keyboard-aware behavior
 */

import React, { ReactNode } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

export interface ScreenProps {
  children: ReactNode;
  title?: string;
  scroll?: boolean;
  stickyCta?: ReactNode;
  gradientUnderCta?: boolean;
  testID?: string;
  className?: string;
}

export function Screen({
  children,
  title,
  scroll = true,
  stickyCta,
  gradientUnderCta = false,
  testID,
  className = '',
}: ScreenProps) {
  const ContentComponent = scroll ? ScrollView : View;
  const contentClassName = scroll ? 'flex-1' : 'flex-1';

  const containerClassName = `flex-1 bg-white ${className}`.trim();

  // Calculate bottom padding based on CTA presence
  const bottomPadding = stickyCta ? 'pb-20' : 'pb-4'; // 80pt or 16pt

  return (
    <SafeAreaView className={containerClassName} testID={testID}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* Header */}
        {title && (
          <View className="px-4 py-3 border-b border-gray-200">
            <Text className="text-2xl font-semibold text-gray-900">
              {title}
            </Text>
          </View>
        )}

        {/* Content Area */}
        <ContentComponent
          className={`${contentClassName} ${bottomPadding} px-4 py-2`}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ContentComponent>

        {/* Sticky CTA Container */}
        {stickyCta && (
          <View className="absolute bottom-0 left-0 right-0">
            {/* Gradient overlay when content scrolls */}
            {gradientUnderCta && (
              <LinearGradient
                colors={[
                  'rgba(255,255,255,0)',
                  'rgba(255,255,255,0.9)',
                  'rgba(255,255,255,1)',
                ]}
                className="absolute top-0 left-0 right-0 h-8"
                pointerEvents="none"
              />
            )}

            {/* CTA Container with safe area */}
            <SafeAreaView edges={['bottom']} className="bg-white px-4 pt-4">
              {stickyCta}
            </SafeAreaView>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// Export default for easier imports
export default Screen;
