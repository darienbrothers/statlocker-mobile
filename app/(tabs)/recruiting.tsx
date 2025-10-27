import React from 'react';
import { Text } from 'react-native';
import { Screen, EmptyState } from '@/components';
import { useTranslation } from '@/hooks/useTranslation';
import { useAnalytics } from '@/hooks/useAnalytics';
import { getTranslatedEmptyState, DEFAULT_EMPTY_STATE } from '@/lib/copy/empty';
import { HapticFeedback } from '@/lib/haptics';

export default function RecruitingScreen() {
  const { t } = useTranslation();
  const { trackCTAPress } = useAnalytics();

  const emptyStateConfig = getTranslatedEmptyState('recruiting', t) || DEFAULT_EMPTY_STATE;

  const handleOpenRoadmap = () => {
    HapticFeedback.ctaPress('recruiting-open-roadmap');
    trackCTAPress('open_roadmap', { 
      screen: 'recruiting',
      empty_state: true 
    });
    console.log('Open Roadmap pressed');
    // TODO: Navigate to recruiting roadmap flow
  };

  return (
    <Screen title={t('nav.recruiting')}>
      <EmptyState
        title={emptyStateConfig.title}
        description={emptyStateConfig.description}
        icon={emptyStateConfig.icon && <Text className="text-4xl mb-4">{emptyStateConfig.icon}</Text>}
        action={{
          label: emptyStateConfig.action.label,
          onPress: handleOpenRoadmap,
          variant: emptyStateConfig.action.variant || 'primary',
        }}
        testID="recruiting-empty-state"
      />
    </Screen>
  );
}
