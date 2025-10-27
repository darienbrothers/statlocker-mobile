import React, { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { View } from 'react-native';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useAppActions } from '@/store';
import { useTranslation } from '@/hooks/useTranslation';
import { HapticFeedback } from '@/lib/haptics';

export default function TabLayout() {
  const { t } = useTranslation();
  const { trackEvent } = useAnalytics();
  const { setActiveTab } = useAppActions();

  // Track tab layout initialization
  useEffect(() => {
    trackEvent('tab_layout_initialized');
  }, [trackEvent]);

  const handleTabPress = (tabName: string) => {
    // Haptic feedback for tab press
    HapticFeedback.tabPress(tabName);
    
    setActiveTab(tabName);
    trackEvent('tab_press', { tab_name: tabName });
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          height: 68,
          paddingBottom: 8,
          paddingTop: 8,
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB', // gray-200
          backgroundColor: '#FFFFFF',
        },
        tabBarActiveTintColor: '#0047AB', // primary-900
        tabBarInactiveTintColor: '#6B7280', // gray-500
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      }}
      screenListeners={{
        tabPress: (e) => {
          const tabName = e.target?.split('-')[0] || 'unknown';
          handleTabPress(tabName);
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: t('nav.dashboard'),
          tabBarIcon: ({ color, size }) => (
            <View
              style={{ 
                width: size, 
                height: size, 
                backgroundColor: color,
                borderRadius: 2,
              }}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: t('nav.stats'),
          tabBarIcon: ({ color, size }) => (
            <View
              style={{ 
                width: size, 
                height: size, 
                backgroundColor: color,
                borderRadius: 2,
              }}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="goals"
        options={{
          title: t('nav.goals'),
          tabBarIcon: ({ color, size }) => (
            <View
              style={{ 
                width: size, 
                height: size, 
                backgroundColor: color,
                borderRadius: 2,
              }}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="recruiting"
        options={{
          title: t('nav.recruiting'),
          tabBarIcon: ({ color, size }) => (
            <View
              style={{ 
                width: size, 
                height: size, 
                backgroundColor: color,
                borderRadius: 2,
              }}
            />
          ),
        }}
      />
    </Tabs>
  );
}
