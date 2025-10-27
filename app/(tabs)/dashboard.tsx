import React from 'react';
import { Text } from 'react-native';
import { Screen, EmptyState } from '@/components';
import { useTranslation } from '@/hooks/useTranslation';
import { useAnalytics } from '@/hooks/useAnalytics';
import { getTranslatedEmptyState, DEFAULT_EMPTY_STATE } from '@/lib/copy/empty';
import { HapticFeedback } from '@/lib/haptics';

export default function DashboardScreen() {
  const { t } = useTranslation();
  const { trackCTAPress } = useAnalytics();

  const emptyStateConfig = getTranslatedEmptyState('dashboard', t) || DEFAULT_EMPTY_STATE;

  const handleGetStarted = () => {
    HapticFeedback.ctaPress('dashboard-get-started');
    trackCTAPress('get_started', { 
      screen: 'dashboard',
      empty_state: true 
    });
    console.log('Get Started pressed');
    // TODO: Navigate to onboarding or first action
  };

  return (
    <Screen title={t('nav.dashboard')}>
      <EmptyState
        title={emptyStateConfig.title}
        description={emptyStateConfig.description}
        icon={emptyStateConfig.icon && <Text className="text-4xl mb-4">{emptyStateConfig.icon}</Text>}
        action={{
          label: emptyStateConfig.action.label,
          onPress: handleGetStarted,
          variant: emptyStateConfig.action.variant || 'primary',
        }}
        testID="dashboard-empty-state"
      />
    </Screen>
  );
}
