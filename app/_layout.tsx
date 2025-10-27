import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AppState, type AppStateStatus } from 'react-native';
import { initializeI18n } from '@/lib';
import { analytics } from '@/lib/analytics';
import '../global.css';

export default function RootLayout() {
  useEffect(() => {
    // Initialize i18n system
    initializeI18n();
    
    // Start analytics session
    analytics.startSession();
    
    // Handle app state changes for session management
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        analytics.startSession();
      } else if (nextAppState === 'background' || nextAppState === 'inactive') {
        analytics.endSession();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    // Cleanup on unmount
    return () => {
      subscription?.remove();
      analytics.endSession();
    };
  }, []);

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </>
  );
}
