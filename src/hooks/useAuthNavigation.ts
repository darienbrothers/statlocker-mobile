/**
 * Authentication Navigation Hook
 * 
 * Provides convenient methods for authentication-related navigation
 * with proper state management and error handling.
 */

import { useCallback } from 'react';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { navigationService } from '@/services/NavigationService';
import { authService } from '@/services/AuthService';

export interface UseAuthNavigationReturn {
  // Navigation methods
  navigateToSignIn: (redirectAfterAuth?: string) => void;
  navigateToSignUp: (redirectAfterAuth?: string) => void;
  navigateToForgotPassword: () => void;
  navigateToEmailVerification: () => void;
  navigateToPasswordReset: (token?: string, email?: string) => void;
  navigateBack: () => boolean;
  
  // Auth action methods
  handleSignOut: () => Promise<void>;
  handleAuthSuccess: (user: any) => Promise<void>;
  handleAuthError: (error: any) => Promise<void>;
  
  // State methods
  setRedirectAfterAuth: (route: string) => void;
  clearRedirectAfterAuth: () => void;
  getRedirectAfterAuth: () => string | undefined;
  
  // Utility methods
  isAuthRoute: (route?: string) => boolean;
  canNavigateBack: () => boolean;
  getCurrentRoute: () => string;
  
  // State
  isAuthenticated: boolean;
  isLoading: boolean;
  user: any;
}

export function useAuthNavigation(): UseAuthNavigationReturn {
  const router = useRouter();
  const { user, isLoading, isAuthenticated, signOut } = useAuthStore();

  // Navigation methods
  const navigateToSignIn = useCallback((redirectAfterAuth?: string) => {
    navigationService.navigateToSignIn({ 
      replace: true, 
      redirectAfterAuth 
    });
  }, []);

  const navigateToSignUp = useCallback((redirectAfterAuth?: string) => {
    navigationService.navigateToSignUp({ 
      redirectAfterAuth 
    });
  }, []);

  const navigateToForgotPassword = useCallback(() => {
    navigationService.navigateToForgotPassword();
  }, []);

  const navigateToEmailVerification = useCallback(() => {
    navigationService.navigateToEmailVerification();
  }, []);

  const navigateToPasswordReset = useCallback((token?: string, email?: string) => {
    navigationService.navigateToPasswordReset(token, email);
  }, []);

  const navigateBack = useCallback(() => {
    return navigationService.navigateBack();
  }, []);

  // Auth action methods
  const handleSignOut = useCallback(async () => {
    try {
      await authService.signOut();
      await signOut();
      await navigationService.handleLogout();
    } catch (error) {
      console.error('useAuthNavigation: Sign out failed', error);
      // Force navigation to sign-in even if sign out fails
      navigationService.navigateToSignIn({ replace: true, clearHistory: true });
    }
  }, [signOut]);

  const handleAuthSuccess = useCallback(async (authenticatedUser: any) => {
    try {
      await navigationService.handleAuthSuccess(authenticatedUser);
    } catch (error) {
      console.error('useAuthNavigation: Auth success handling failed', error);
      // Fallback to home
      router.replace('/');
    }
  }, [router]);

  const handleAuthError = useCallback(async (error: any) => {
    try {
      await navigationService.handleAuthFailure(error);
    } catch (navigationError) {
      console.error('useAuthNavigation: Auth error handling failed', navigationError);
      // Fallback to sign-in
      navigateToSignIn();
    }
  }, [navigateToSignIn]);

  // State methods
  const setRedirectAfterAuth = useCallback((route: string) => {
    navigationService.setRedirectAfterAuth(route);
  }, []);

  const clearRedirectAfterAuth = useCallback(() => {
    navigationService.clearRedirectAfterAuth();
  }, []);

  const getRedirectAfterAuth = useCallback(() => {
    return navigationService.getNavigationState().redirectAfterAuth;
  }, []);

  // Utility methods
  const isAuthRoute = useCallback((route?: string) => {
    return navigationService.isAuthRoute(route);
  }, []);

  const canNavigateBack = useCallback(() => {
    const history = navigationService.getNavigationState().navigationHistory;
    return history.length > 1;
  }, []);

  const getCurrentRoute = useCallback(() => {
    return navigationService.getNavigationState().currentRoute;
  }, []);

  return {
    // Navigation methods
    navigateToSignIn,
    navigateToSignUp,
    navigateToForgotPassword,
    navigateToEmailVerification,
    navigateToPasswordReset,
    navigateBack,
    
    // Auth action methods
    handleSignOut,
    handleAuthSuccess,
    handleAuthError,
    
    // State methods
    setRedirectAfterAuth,
    clearRedirectAfterAuth,
    getRedirectAfterAuth,
    
    // Utility methods
    isAuthRoute,
    canNavigateBack,
    getCurrentRoute,
    
    // State
    isAuthenticated,
    isLoading,
    user,
  };
}

export default useAuthNavigation;