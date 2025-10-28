/**
 * Authentication Provider Component
 * 
 * Provides authentication context and handles global auth state management,
 * deep link initialization, and navigation setup.
 */

import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/AuthService';
import { deepLinkService } from '@/services/DeepLinkService';
import { navigationService } from '@/services/NavigationService';
import AuthGuard from './AuthGuard';

export interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const router = useRouter();
  const segments = useSegments();
  const { user, isLoading, isAuthenticated, initialize } = useAuthStore();
  const [isInitializing, setIsInitializing] = useState(true);

  // Initialize authentication and deep links
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Initialize auth store
        await initialize();
        
        // Initialize deep link service
        await deepLinkService.initialize();
        
        // Set up auth state listener
        const unsubscribe = authService.onAuthStateChanged((user) => {
          if (user) {
            navigationService.handleAuthSuccess(user);
          } else {
            navigationService.handleLogout();
          }
        });

        setIsInitializing(false);
        
        return unsubscribe;
      } catch (error) {
        console.error('AuthProvider: Initialization failed', error);
        setIsInitializing(false);
      }
    };

    const cleanup = initializeAuth();
    
    return () => {
      cleanup?.then(unsubscribe => unsubscribe?.());
    };
  }, [initialize]);

  // Handle route-based authentication
  useEffect(() => {
    if (isInitializing || isLoading) {
      return;
    }

    const inAuthGroup = segments[0] === '(auth)';
    
    // Update navigation service with current route
    const currentRoute = `/${segments.join('/')}`;
    
    // Handle authentication-based routing
    if (!isAuthenticated && !inAuthGroup) {
      // User not authenticated and not in auth group - redirect to sign-in
      navigationService.setRedirectAfterAuth(currentRoute);
      navigationService.navigateToSignIn({ replace: true });
    } else if (isAuthenticated && inAuthGroup) {
      // User authenticated but in auth group - redirect to main app
      navigationService.handleAuthSuccess(user);
    }
  }, [segments, isAuthenticated, isInitializing, isLoading, user]);

  if (isInitializing) {
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: 'white' 
      }}>
        <Text style={{ 
          fontSize: 18, 
          fontWeight: '600', 
          color: '#111827',
          marginBottom: 8 
        }}>
          StatLocker
        </Text>
        <Text style={{ 
          fontSize: 14, 
          color: '#6B7280' 
        }}>
          Loading...
        </Text>
      </View>
    );
  }

  return <>{children}</>;
}

/**
 * Protected Route Component
 * 
 * Wraps routes that require authentication
 */
export function ProtectedRoute({ 
  children, 
  requireEmailVerification = false,
  allowedRoles,
}: {
  children: React.ReactNode;
  requireEmailVerification?: boolean;
  allowedRoles?: string[];
}) {
  return (
    <AuthGuard
      requireAuth={true}
      requireEmailVerification={requireEmailVerification}
      allowedRoles={allowedRoles}
    >
      {children}
    </AuthGuard>
  );
}

/**
 * Public Route Component
 * 
 * Wraps routes that should redirect authenticated users
 */
export function PublicRoute({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard requireAuth={false}>
      {children}
    </AuthGuard>
  );
}

export default AuthProvider;