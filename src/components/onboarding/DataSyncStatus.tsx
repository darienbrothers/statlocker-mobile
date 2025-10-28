/**
 * Data Sync Status Component
 * 
 * Shows the current sync status of onboarding data
 * with visual indicators and retry functionality.
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { useOnboardingTheme } from './OnboardingThemeProvider';

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error' | 'offline';

interface DataSyncStatusProps {
  /** Current sync status */
  status: SyncStatus;
  /** Last sync timestamp */
  lastSyncTime?: Date;
  /** Number of pending changes */
  pendingChanges?: number;
  /** Error message if sync failed */
  errorMessage?: string;
  /** Callback to retry sync */
  onRetrySync?: () => void;
  /** Whether to show detailed status */
  showDetails?: boolean;
  /** Position of the status indicator */
  position?: 'top' | 'bottom' | 'inline';
}

export function DataSyncStatus({
  status,
  lastSyncTime,
  pendingChanges = 0,
  errorMessage,
  onRetrySync,
  showDetails = false,
  position = 'inline',
}: DataSyncStatusProps) {
  const { tokens } = useOnboardingTheme();
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  // Animate sync indicator
  useEffect(() => {
    if (status === 'syncing') {
      // Rotation animation for syncing
      const rotateAnimation = Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      );
      rotateAnimation.start();

      return () => rotateAnimation.stop();
    } else if (status === 'error') {
      // Pulse animation for errors
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimation.start();

      return () => pulseAnimation.stop();
    } else {
      // Reset animations
      rotateAnim.setValue(0);
      pulseAnim.setValue(1);
    }
  }, [status, pulseAnim, rotateAnim]);

  const getStatusConfig = () => {
    switch (status) {
      case 'syncing':
        return {
          icon: '↻',
          color: tokens.colors.primary[600],
          backgroundColor: `${tokens.colors.primary[600]}20`,
          message: 'Syncing your progress...',
        };
      case 'synced':
        return {
          icon: '✓',
          color: tokens.colors.success,
          backgroundColor: `${tokens.colors.success}20`,
          message: 'All changes saved',
        };
      case 'error':
        return {
          icon: '!',
          color: tokens.colors.danger,
          backgroundColor: `${tokens.colors.danger}20`,
          message: errorMessage || 'Sync failed',
        };
      case 'offline':
        return {
          icon: '⚠',
          color: tokens.colors.warning,
          backgroundColor: `${tokens.colors.warning}20`,
          message: `${pendingChanges} changes pending`,
        };
      default:
        return {
          icon: '○',
          color: tokens.colors.gray[500],
          backgroundColor: `${tokens.colors.gray[500]}20`,
          message: 'Ready to sync',
        };
    }
  };

  const statusConfig = getStatusConfig();

  const formatLastSync = () => {
    if (!lastSyncTime) return 'Never synced';
    
    const now = new Date();
    const diffMs = now.getTime() - lastSyncTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    return lastSyncTime.toLocaleDateString();
  };

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const animatedStyle = {
    transform: [
      { scale: status === 'error' ? pulseAnim : 1 },
      { rotate: status === 'syncing' ? rotateInterpolate : '0deg' },
    ],
  };

  const containerStyle = {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    padding: showDetails ? tokens.spacing.cardPadding : 8,
    backgroundColor: statusConfig.backgroundColor,
    borderRadius: tokens.spacing.cardRadius / 2,
    borderWidth: 1,
    borderColor: statusConfig.color,
    ...(position !== 'inline' && {
      position: 'absolute' as const,
      left: tokens.spacing.stepPadding,
      right: tokens.spacing.stepPadding,
      [position]: tokens.spacing.stepMargin,
      zIndex: tokens.zIndex.toast,
    }),
  };

  return (
    <View style={containerStyle}>
      {/* Status Icon */}
      <Animated.View
        style={[
          {
            width: 20,
            height: 20,
            borderRadius: 10,
            backgroundColor: statusConfig.color,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 8,
          },
          animatedStyle,
        ]}
      >
        <Text
          style={{
            color: tokens.colors.white,
            fontSize: 12,
            fontWeight: 'bold',
          }}
        >
          {statusConfig.icon}
        </Text>
      </Animated.View>

      {/* Status Message */}
      <View style={{ flex: 1 }}>
        <Text
          style={{
            color: statusConfig.color,
            fontSize: tokens.typography.formLabel.fontSize,
            fontWeight: tokens.typography.formLabel.fontWeight,
          }}
        >
          {statusConfig.message}
        </Text>

        {/* Detailed Information */}
        {showDetails && (
          <Text
            style={{
              color: tokens.colors.gray[500],
              fontSize: tokens.typography.formHint.fontSize,
              marginTop: 2,
            }}
          >
            Last sync: {formatLastSync()}
            {pendingChanges > 0 && ` • ${pendingChanges} pending`}
          </Text>
        )}
      </View>

      {/* Retry Button */}
      {(status === 'error' || status === 'offline') && onRetrySync && (
        <TouchableOpacity
          onPress={onRetrySync}
          style={{
            backgroundColor: statusConfig.color,
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 12,
            marginLeft: 8,
          }}
          accessibilityRole="button"
          accessibilityLabel="Retry sync"
        >
          <Text
            style={{
              color: tokens.colors.white,
              fontSize: tokens.typography.formHint.fontSize,
              fontWeight: tokens.typography.formLabel.fontWeight,
            }}
          >
            Retry
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

/**
 * Hook for managing data sync status
 * 
 * @example
 * const { syncStatus, pendingChanges, retrySync } = useDataSync();
 */
export function useDataSync() {
  const [syncStatus, setSyncStatus] = React.useState<SyncStatus>('idle');
  const [lastSyncTime, setLastSyncTime] = React.useState<Date | null>(null);
  const [pendingChanges, setPendingChanges] = React.useState(0);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const updateSyncStatus = React.useCallback((
    status: SyncStatus,
    options?: {
      errorMessage?: string;
      pendingChanges?: number;
    }
  ) => {
    setSyncStatus(status);
    
    if (status === 'synced') {
      setLastSyncTime(new Date());
      setPendingChanges(0);
      setErrorMessage(null);
    } else if (status === 'error') {
      setErrorMessage(options?.errorMessage || 'Sync failed');
    } else if (status === 'offline') {
      setPendingChanges(options?.pendingChanges || 0);
    }
  }, []);

  const retrySync = React.useCallback(async () => {
    setSyncStatus('syncing');
    setErrorMessage(null);
    
    try {
      // Simulate sync operation
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // In a real implementation, this would sync with the backend
      updateSyncStatus('synced');
    } catch (error) {
      updateSyncStatus('error', {
        errorMessage: error instanceof Error ? error.message : 'Sync failed'
      });
    }
  }, [updateSyncStatus]);

  const addPendingChange = React.useCallback(() => {
    setPendingChanges(prev => prev + 1);
    if (syncStatus === 'synced') {
      setSyncStatus('offline');
    }
  }, [syncStatus]);

  return {
    syncStatus,
    lastSyncTime,
    pendingChanges,
    errorMessage,
    updateSyncStatus,
    retrySync,
    addPendingChange,
  };
}