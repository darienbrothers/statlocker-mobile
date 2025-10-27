// Core app types for StatLocker
import React from 'react';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'athlete' | 'coach';
  createdAt: string;
  updatedAt: string;
}

export interface AppState {
  auth: {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
  };
  navigation: {
    activeTab: TabName;
    previousRoute: string;
  };
  ui: {
    isKeyboardVisible: boolean;
    isOffline: boolean;
  };
}

export type TabName = 'dashboard' | 'stats' | 'goals' | 'recruiting';

export interface ScreenProps {
  children: React.ReactNode;
  title?: string;
  scroll?: boolean;
  stickyCta?: React.ReactNode;
  gradientUnderCta?: boolean;
  testID?: string;
  className?: string;
}

export interface StickyCTAProps {
  variant: 'primary' | 'secondary' | 'fab';
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
  testID?: string;
}
