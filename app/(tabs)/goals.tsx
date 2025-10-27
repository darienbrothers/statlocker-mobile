import React, { useState } from 'react';
import { View, Pressable, Text } from 'react-native';
import { Screen, EmptyState } from '@/components';
import { useTranslation } from '@/hooks/useTranslation';
import { useAnalytics } from '@/hooks/useAnalytics';
import { getTranslatedEmptyState, DEFAULT_EMPTY_STATE } from '@/lib/copy/empty';
import { HapticFeedback } from '@/lib/haptics';
import KeyboardTestScreen from '@/components/KeyboardTestScreen';

export default function GoalsScreen() {
  const { t } = useTranslation();
  const { trackCTAPress, trackEvent } = useAnalytics();
  const [showKeyboardTest, setShowKeyboardTest] = useState(false);

  const emptyStateConfig = getTranslatedEmptyState('goals', t) || DEFAULT_EMPTY_STATE;

  const handleChooseGoals = () => {
    HapticFeedback.ctaPress('goals-choose-goals');
    trackCTAPress('choose_goals', { 
      screen: 'goals',
      empty_state: true 
    });
    console.log('Choose Goals pressed');
    // TODO: Navigate to goal selection flow
  };

  const handleShowKeyboardTest = () => {
    HapticFeedback.buttonPress('keyboard-test');
    trackEvent('keyboard_test_opened', { screen: 'goals' });
    setShowKeyboardTest(true);
  };

  if (showKeyboardTest) {
    return <KeyboardTestScreen />;
  }

  return (
    <Screen title={t('nav.goals')}>
      <EmptyState
        title={emptyStateConfig.title}
        description={emptyStateConfig.description}
        icon={emptyStateConfig.icon && <Text className="text-4xl mb-4">{emptyStateConfig.icon}</Text>}
        action={{
          label: emptyStateConfig.action.label,
          onPress: handleChooseGoals,
          variant: emptyStateConfig.action.variant || 'primary',
        }}
        testID="goals-empty-state"
      />
      
      {/* Development: Keyboard Test Button */}
      {__DEV__ && (
        <View className="absolute bottom-20 right-4">
          <Pressable
            className="bg-warning px-4 py-2 rounded-xl shadow-lg"
            onPress={handleShowKeyboardTest}
          >
            <Text className="text-gray-900 font-medium text-sm">
              🧪 Keyboard Test
            </Text>
          </Pressable>
        </View>
      )}
    </Screen>
  );
}
