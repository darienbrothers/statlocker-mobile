import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AppState, type AppStateStatus } from 'react-native';
import { initializeI18n, initializeFirebase } from '@/lib';
import { analytics } from '@/lib/analytics';
import { logInfo, logError } from '@/lib/logging';
import '../global.css';

export default function RootLayout() {
  useEffect(() => {
    // Initialize core systems
    const initializeApp = async () => {
      try {
        // Initialize Firebase first
        initializeFirebase();
        logInfo('App: Firebase initialized');
        
        // Initialize i18n system
        initializeI18n();
        logInfo('App: i18n initialized');
        
        // Start analytics session
        analytics.startSession();
        logInfo('App: Analytics session started');
      } catch (error) {
        logError('App: Initialization failed', error as Error);
      }
    };

    initializeApp();
    
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
