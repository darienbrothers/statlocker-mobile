/**
 * Keyboard Test Screen - For QA testing keyboard behavior
 * 
 * This screen tests various keyboard scenarios:
 * - iOS (notch vs. non-notch)
 * - Android (soft keys vs. gesture navigation)
 * - Scroll + sticky CTA
 * - Static + sticky CTA
 * - Long forms with multiple inputs
 */

import React, { useState } from 'react';
import { Text, TextInput, View, Switch } from 'react-native';
import { Screen, StickyCTA } from './';
import { useTranslation } from '@/hooks/useTranslation';

export function KeyboardTestScreen() {
  const { t } = useTranslation();
  const [scrollMode, setScrollMode] = useState(true);
  const [showGradient, setShowGradient] = useState(true);
  const [formData, setFormData] = useState({
    field1: '',
    field2: '',
    field3: '',
    field4: '',
    field5: '',
    field6: '',
  });

  const handleSubmit = () => {
    console.log('Form submitted:', formData);
  };

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Screen
      title={t('keyboard.test.title')}
      scroll={scrollMode}
      stickyCta={
        <StickyCTA variant="primary" onPress={handleSubmit}>
          {t('keyboard.test.submit')}
        </StickyCTA>
      }
      gradientUnderCta={showGradient}
    >
      {/* Test Controls */}
      <View className="bg-gray-100 p-4 rounded-2xl mb-6">
        <Text className="text-lg font-semibold text-gray-900 mb-4">
          Test Configuration
        </Text>
        
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-base text-gray-700">Scroll Mode</Text>
          <Switch
            value={scrollMode}
            onValueChange={setScrollMode}
            trackColor={{ false: '#E5E7EB', true: '#0047AB' }}
            thumbColor={scrollMode ? '#FFFFFF' : '#9CA3AF'}
          />
        </View>
        
        <View className="flex-row items-center justify-between">
          <Text className="text-base text-gray-700">Gradient Under CTA</Text>
          <Switch
            value={showGradient}
            onValueChange={setShowGradient}
            trackColor={{ false: '#E5E7EB', true: '#0047AB' }}
            thumbColor={showGradient ? '#FFFFFF' : '#9CA3AF'}
          />
        </View>
      </View>

      {/* Test Instructions */}
      <View className="bg-primary-100 p-4 rounded-2xl mb-6">
        <Text className="text-lg font-semibold text-primary-900 mb-2">
          Test Scenarios
        </Text>
        <Text className="text-sm text-primary-700 mb-2">
          1. Test on iOS devices (notch vs. non-notch)
        </Text>
        <Text className="text-sm text-primary-700 mb-2">
          2. Test on Android (soft keys vs. gesture navigation)
        </Text>
        <Text className="text-sm text-primary-700 mb-2">
          3. Toggle scroll mode and test keyboard behavior
        </Text>
        <Text className="text-sm text-primary-700 mb-2">
          4. Use Tab/Return to navigate between fields
        </Text>
        <Text className="text-sm text-primary-700">
          5. Verify CTA remains visible and accessible
        </Text>
      </View>

      {/* Long Form for Testing */}
      <View className="space-y-4">
        <Text className="text-xl font-semibold text-gray-900 mb-4">
          Test Form
        </Text>

        <View>
          <Text className="text-sm font-medium text-gray-700 mb-2">
            Field 1 (Email)
          </Text>
          <TextInput
            className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-base"
            placeholder="Enter your email"
            value={formData.field1}
            onChangeText={(value) => updateField('field1', value)}
            keyboardType="email-address"
            returnKeyType="next"
            autoCapitalize="none"
          />
        </View>

        <View>
          <Text className="text-sm font-medium text-gray-700 mb-2">
            Field 2 (Name)
          </Text>
          <TextInput
            className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-base"
            placeholder="Enter your full name"
            value={formData.field2}
            onChangeText={(value) => updateField('field2', value)}
            returnKeyType="next"
            autoCapitalize="words"
          />
        </View>

        <View>
          <Text className="text-sm font-medium text-gray-700 mb-2">
            Field 3 (Phone)
          </Text>
          <TextInput
            className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-base"
            placeholder="Enter your phone number"
            value={formData.field3}
            onChangeText={(value) => updateField('field3', value)}
            keyboardType="phone-pad"
            returnKeyType="next"
          />
        </View>

        <View>
          <Text className="text-sm font-medium text-gray-700 mb-2">
            Field 4 (Address)
          </Text>
          <TextInput
            className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-base"
            placeholder="Enter your address"
            value={formData.field4}
            onChangeText={(value) => updateField('field4', value)}
            returnKeyType="next"
            autoCapitalize="words"
          />
        </View>

        <View>
          <Text className="text-sm font-medium text-gray-700 mb-2">
            Field 5 (Notes)
          </Text>
          <TextInput
            className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-base min-h-24"
            placeholder="Enter additional notes"
            value={formData.field5}
            onChangeText={(value) => updateField('field5', value)}
            multiline
            numberOfLines={4}
            returnKeyType="next"
            textAlignVertical="top"
          />
        </View>

        <View>
          <Text className="text-sm font-medium text-gray-700 mb-2">
            Field 6 (Comments)
          </Text>
          <TextInput
            className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-base min-h-24"
            placeholder="Final comments"
            value={formData.field6}
            onChangeText={(value) => updateField('field6', value)}
            multiline
            numberOfLines={4}
            returnKeyType="done"
            textAlignVertical="top"
          />
        </View>

        {/* Spacer content to test scrolling */}
        <View className="mt-8">
          <Text className="text-lg font-semibold text-gray-900 mb-4">
            Additional Content
          </Text>
          <Text className="text-base text-gray-600 mb-4">
            This additional content helps test scrolling behavior when the keyboard is open.
            The sticky CTA should remain visible and accessible at all times.
          </Text>
          <Text className="text-base text-gray-600 mb-4">
            Test different scenarios:
          </Text>
          <Text className="text-sm text-gray-500 mb-2">
            • Focus on the first field and verify CTA visibility
          </Text>
          <Text className="text-sm text-gray-500 mb-2">
            • Focus on the last field and verify CTA accessibility
          </Text>
          <Text className="text-sm text-gray-500 mb-2">
            • Switch between fields using Tab/Return
          </Text>
          <Text className="text-sm text-gray-500 mb-2">
            • Test with different keyboard types
          </Text>
          <Text className="text-sm text-gray-500 mb-8">
            • Verify no overlap or jumping issues
          </Text>
        </View>
      </View>
    </Screen>
  );
}

export default KeyboardTestScreen;