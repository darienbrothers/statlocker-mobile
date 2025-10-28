/**
 * Auth Gate - Initial route that handles authentication state resolution
 * 
 * This screen:
 * 1. Shows a splash screen while checking auth state
 * 2. Routes to (auth) if user is signed out
 * 3. Routes to (tabs) if user is signed in
 * 4. Handles persisted session restoration
 * 5. Integrates with analytics tracking
 */

import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/AuthService';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useTranslation } from '@/hooks/useTranslation';

export default function AuthGateScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { isAuthenticated, isLoading, hasInitialized, initialize } = useAuthStore();
  const { trackEvent } = useAnalytics();

  useEffect(() => {
    // Track app launch
    trackEvent('app_launched');
    
    // Initialize auth services and state on app launch
    const initializeApp = async () => {
      await authService.initialize();
      initialize();
    };
    
    initializeApp();
  }, [initialize, trackEvent]);

  useEffect(() => {
    // Route based on auth state once initialized
    if (hasInitialized && !isLoading) {
      if (isAuthenticated) {
        trackEvent('auth_gate_resolved', { 
          outcome: 'authenticated',
          destination: 'tabs' 
        });
        router.replace('/(tabs)/dashboard');
      } else {
        trackEvent('auth_gate_resolved', { 
          outcome: 'unauthenticated',
          destination: 'auth' 
        });
        router.replace('/(auth)/sign-in');
      }
    }
  }, [hasInitialized, isLoading, isAuthenticated, router, trackEvent]);

  // Show splash screen while resolving auth state
  return (
    <View className="flex-1 items-center justify-center bg-primary-900">
      <Text className="text-3xl font-bold text-white mb-2">
        {t('app.name')}
      </Text>
      <Text className="text-base text-primary-100 mb-8 text-center px-8">
        {t('app.tagline')}
      </Text>
      
      {/* Loading indicator */}
      <View className="flex-row items-center">
        <ActivityIndicator size="small" color="#E6F0FF" />
        <Text className="text-sm text-primary-100 ml-3">
          {isLoading ? t('loading.signIn') : t('loading.default')}
        </Text>
      </View>
    </View>
  );
}
