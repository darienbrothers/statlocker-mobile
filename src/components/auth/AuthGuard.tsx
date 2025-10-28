/**
 * Authentication Guard Component
 * 
 * Protects routes by checking authentication state and redirecting
 * unauthenticated users to the sign-in flow.
 */

import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/AuthService';

export interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  redirectTo?: string;
  requireAuth?: boolean;
  requireEmailVerification?: boolean;
  allowedRoles?: string[];
  testID?: string;
}

export function AuthGuard({
  children,
  fallback,
  redirectTo = '/sign-in',
  requireAuth = true,
  requireEmailVerification = false,
  allowedRoles,
  testID,
}: AuthGuardProps) {
  const router = useRouter();
  const segments = useSegments();
  const { user, isLoading, isAuthenticated } = useAuthStore();
  const [isInitializing, setIsInitializing] = useState(true);
  const [hasRedirected, setHasRedirected] = useState(false);

  // Initialize auth state on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check if user is already authenticated
        const currentUser = authService.getCurrentUser();
        if (currentUser && !isAuthenticated) {
          // Update auth store if user exists but store is not updated
          await authService.initializeAuthState();
        }
      } catch (error) {
        console.error('AuthGuard: Failed to initialize auth state', error);
      } finally {
        setIsInitializing(false);
      }
    };

    initializeAuth();
  }, [isAuthenticated]);

  // Handle authentication-based routing
  useEffect(() => {
    if (isInitializing || isLoading || hasRedirected) {
      return;
    }

    const inAuthGroup = segments[0] === '(auth)';
    const isProtectedRoute = requireAuth;

    // If user is not authenticated and trying to access protected route
    if (!isAuthenticated && isProtectedRoute && !inAuthGroup) {
      setHasRedirected(true);
      router.replace(redirectTo);
      return;
    }

    // If user is authenticated but in auth group, redirect to main app
    if (isAuthenticated && inAuthGroup) {
      // Check email verification requirement
      if (requireEmailVerification && user && !user.emailVerified) {
        router.replace('/verify-email');
        return;
      }

      // Check role-based access
      if (allowedRoles && user && !allowedRoles.includes(user.role || 'user')) {
        router.replace('/unauthorized');
        return;
      }

      setHasRedirected(true);
      router.replace('/');
      return;
    }

    // Reset redirect flag if we're in the correct state
    if (hasRedirected) {
      setHasRedirected(false);
    }
  }, [
    isAuthenticated,
    isInitializing,
    isLoading,
    segments,
    requireAuth,
    requireEmailVerification,
    allowedRoles,
    user,
    router,
    redirectTo,
    hasRedirected,
  ]);

  // Show loading state while initializing or during auth state changes
  if (isInitializing || isLoading) {
    return fallback || (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: 'white' 
      }} testID={testID}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={{ 
          marginTop: 16, 
          fontSize: 16, 
          color: '#6B7280',
          textAlign: 'center' 
        }}>
          Loading...
        </Text>
      </View>
    );
  }

  // Check authentication requirements
  if (requireAuth && !isAuthenticated) {
    return fallback || (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: 'white',
        padding: 24 
      }} testID={testID}>
        <Text style={{ 
          fontSize: 18, 
          fontWeight: '600', 
          color: '#111827',
          marginBottom: 8,
          textAlign: 'center' 
        }}>
          Authentication Required
        </Text>
        <Text style={{ 
          fontSize: 16, 
          color: '#6B7280',
          textAlign: 'center',
          lineHeight: 24 
        }}>
          Please sign in to access this content.
        </Text>
      </View>
    );
  }

  // Check email verification requirement
  if (requireEmailVerification && user && !user.emailVerified) {
    return fallback || (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: 'white',
        padding: 24 
      }} testID={testID}>
        <Text style={{ 
          fontSize: 18, 
          fontWeight: '600', 
          color: '#111827',
          marginBottom: 8,
          textAlign: 'center' 
        }}>
          Email Verification Required
        </Text>
        <Text style={{ 
          fontSize: 16, 
          color: '#6B7280',
          textAlign: 'center',
          lineHeight: 24 
        }}>
          Please verify your email address to continue.
        </Text>
      </View>
    );
  }

  // Check role-based access
  if (allowedRoles && user && !allowedRoles.includes(user.role || 'user')) {
    return fallback || (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: 'white',
        padding: 24 
      }} testID={testID}>
        <Text style={{ 
          fontSize: 18, 
          fontWeight: '600', 
          color: '#111827',
          marginBottom: 8,
          textAlign: 'center' 
        }}>
          Access Denied
        </Text>
        <Text style={{ 
          fontSize: 16, 
          color: '#6B7280',
          textAlign: 'center',
          lineHeight: 24 
        }}>
          You don't have permission to access this content.
        </Text>
      </View>
    );
  }

  // Render children if all checks pass
  return <>{children}</>;
}

/**
 * Higher-order component for protecting routes
 */
export function withAuthGuard<P extends object>(
  Component: React.ComponentType<P>,
  guardProps?: Omit<AuthGuardProps, 'children'>
) {
  return function AuthGuardedComponent(props: P) {
    return (
      <AuthGuard {...guardProps}>
        <Component {...props} />
      </AuthGuard>
    );
  };
}

/**
 * Hook for checking authentication state in components
 */
export function useAuthGuard() {
  const { user, isLoading, isAuthenticated } = useAuthStore();
  const router = useRouter();

  const requireAuth = (redirectTo: string = '/sign-in') => {
    if (!isLoading && !isAuthenticated) {
      router.replace(redirectTo);
      return false;
    }
    return isAuthenticated;
  };

  const requireEmailVerification = (redirectTo: string = '/verify-email') => {
    if (!isLoading && user && !user.emailVerified) {
      router.replace(redirectTo);
      return false;
    }
    return user?.emailVerified || false;
  };

  const requireRole = (roles: string[], redirectTo: string = '/unauthorized') => {
    if (!isLoading && user && !roles.includes(user.role || 'user')) {
      router.replace(redirectTo);
      return false;
    }
    return user ? roles.includes(user.role || 'user') : false;
  };

  return {
    user,
    isLoading,
    isAuthenticated,
    requireAuth,
    requireEmailVerification,
    requireRole,
  };
}

export default AuthGuard;