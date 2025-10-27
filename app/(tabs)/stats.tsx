import React from 'react';
import { Text } from 'react-native';
import { Screen, EmptyState } from '@/components';
import { useTranslation } from '@/hooks/useTranslation';
import { useAnalytics } from '@/hooks/useAnalytics';
import { getTranslatedEmptyState, DEFAULT_EMPTY_STATE } from '@/lib/copy/empty';
import { HapticFeedback } from '@/lib/haptics';

export default function StatsScreen() {
  const { t } = useTranslation();
  const { trackCTAPress } = useAnalytics();

  const emptyStateConfig = getTranslatedEmptyState('stats', t) || DEFAULT_EMPTY_STATE;

  const handleLogGame = () => {
    HapticFeedback.ctaPress('stats-log-game');
    trackCTAPress('log_game', { 
      screen: 'stats',
      empty_state: true 
    });
    console.log('Log a Game pressed');
    // TODO: Navigate to game logging flow
  };

  return (
    <Screen title={t('nav.stats')}>
      <EmptyState
        title={emptyStateConfig.title}
        description={emptyStateConfig.description}
        icon={emptyStateConfig.icon && <Text className="text-4xl mb-4">{emptyStateConfig.icon}</Text>}
        action={{
          label: emptyStateConfig.action.label,
          onPress: handleLogGame,
          variant: emptyStateConfig.action.variant || 'primary',
        }}
        testID="stats-empty-state"
      />
    </Screen>
  );
}
