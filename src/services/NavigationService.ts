/**
 * Navigation Service
 * 
 * Handles authentication-aware navigation, route management,
 * and navigation state for the authentication system.
 */

import { router } from 'expo-router';
import { logInfo, logError } from '@/lib/logging';
import { authService } from './AuthService';
import { auditLogService } from './AuditLogService';

export interface NavigationState {
  currentRoute: string;
  previousRoute?: string;
  authFlow?: 'sign-in' | 'sign-up' | 'forgot-password' | 'verify-email' | 'reset-password';
  redirectAfterAuth?: string;
  navigationHistory: string[];
}

export interface AuthNavigationOptions {
  replace?: boolean;
  clearHistory?: boolean;
  preserveParams?: boolean;
  redirectAfterAuth?: string;
}

export class NavigationService {
  private static instance: NavigationService;
  private navigationState: NavigationState = {
    currentRoute: '/',
    navigationHistory: [],
  };

  private constructor() {}

  public static getInstance(): NavigationService {
    if (!NavigationService.instance) {
      NavigationService.instance = new NavigationService();
    }
    return NavigationService.instance;
  }

  /**
   * Navigate to sign-in screen
   */
  public navigateToSignIn(options: AuthNavigationOptions = {}): void {
    try {
      const { replace = true, redirectAfterAuth, clearHistory = false } = options;
      
      this.updateNavigationState('/sign-in', 'sign-in', redirectAfterAuth);
      
      if (clearHistory) {
        this.clearNavigationHistory();
      }
      
      if (replace) {
        router.replace('/sign-in');
      } else {
        router.push('/sign-in');
      }
      
      logInfo('Navigation: Navigated to sign-in', { replace, redirectAfterAuth });
    } catch (error) {
      logError('Navigation: Failed to navigate to sign-in', error as Error);
    }
  }

  /**
   * Navigate to sign-up screen
   */
  public navigateToSignUp(options: AuthNavigationOptions = {}): void {
    try {
      const { replace = false, redirectAfterAuth } = options;
      
      this.updateNavigationState('/sign-up', 'sign-up', redirectAfterAuth);
      
      if (replace) {
        router.replace('/sign-up');
      } else {
        router.push('/sign-up');
      }
      
      logInfo('Navigation: Navigated to sign-up', { replace, redirectAfterAuth });
    } catch (error) {
      logError('Navigation: Failed to navigate to sign-up', error as Error);
    }
  }

  /**
   * Navigate to forgot password screen
   */
  public navigateToForgotPassword(options: AuthNavigationOptions = {}): void {
    try {
      const { replace = false } = options;
      
      this.updateNavigationState('/forgot-password', 'forgot-password');
      
      if (replace) {
        router.replace('/forgot-password');
      } else {
        router.push('/forgot-password');
      }
      
      logInfo('Navigation: Navigated to forgot-password', { replace });
    } catch (error) {
      logError('Navigation: Failed to navigate to forgot-password', error as Error);
    }
  }

  /**
   * Navigate to email verification screen
   */
  public navigateToEmailVerification(options: AuthNavigationOptions = {}): void {
    try {
      const { replace = true } = options;
      
      this.updateNavigationState('/verify-email', 'verify-email');
      
      if (replace) {
        router.replace('/verify-email');
      } else {
        router.push('/verify-email');
      }
      
      logInfo('Navigation: Navigated to verify-email', { replace });
    } catch (error) {
      logError('Navigation: Failed to navigate to verify-email', error as Error);
    }
  }

  /**
   * Navigate to password reset screen
   */
  public navigateToPasswordReset(token?: string, email?: string, options: AuthNavigationOptions = {}): void {
    try {
      const { replace = true } = options;
      
      let route = '/reset-password';
      if (token && email) {
        route += `?token=${token}&email=${encodeURIComponent(email)}`;
      }
      
      this.updateNavigationState(route, 'reset-password');
      
      if (replace) {
        router.replace(route);
      } else {
        router.push(route);
      }
      
      logInfo('Navigation: Navigated to reset-password', { replace, hasToken: !!token });
    } catch (error) {
      logError('Navigation: Failed to navigate to reset-password', error as Error);
    }
  }

  /**
   * Handle successful authentication
   */
  public async handleAuthSuccess(user: any): Promise<void> {
    try {
      const redirectTo = this.navigationState.redirectAfterAuth || '/';
      
      // Clear auth flow state
      this.navigationState.authFlow = undefined;
      this.navigationState.redirectAfterAuth = undefined;
      
      // Log successful authentication navigation
      await auditLogService.logSecurityEvent({
        type: 'AUTH_SUCCESS_NAVIGATION',
        userId: user.uid,
        metadata: {
          redirectTo,
          fromRoute: this.navigationState.currentRoute,
        },
      });
      
      // Navigate to intended destination
      router.replace(redirectTo);
      
      logInfo('Navigation: Handled auth success', { 
        userId: user.uid, 
        redirectTo,
        fromRoute: this.navigationState.currentRoute 
      });
    } catch (error) {
      logError('Navigation: Failed to handle auth success', error as Error);
      // Fallback to home
      router.replace('/');
    }
  }

  /**
   * Handle authentication failure
   */
  public async handleAuthFailure(error: any): Promise<void> {
    try {
      // Log authentication failure
      await auditLogService.logSecurityEvent({
        type: 'AUTH_FAILURE_NAVIGATION',
        userId: undefined,
        metadata: {
          error: error.code || error.message,
          fromRoute: this.navigationState.currentRoute,
        },
      });
      
      // Stay on current auth screen or redirect to sign-in
      if (!this.isAuthRoute(this.navigationState.currentRoute)) {
        this.navigateToSignIn({ replace: true });
      }
      
      logInfo('Navigation: Handled auth failure', { 
        error: error.code || error.message,
        currentRoute: this.navigationState.currentRoute 
      });
    } catch (navigationError) {
      logError('Navigation: Failed to handle auth failure', navigationError as Error);
    }
  }

  /**
   * Handle logout
   */
  public async handleLogout(): Promise<void> {
    try {
      // Clear navigation state
      this.clearNavigationState();
      
      // Log logout navigation
      await auditLogService.logSecurityEvent({
        type: 'LOGOUT_NAVIGATION',
        userId: authService.getCurrentUser()?.uid,
        metadata: {
          fromRoute: this.navigationState.currentRoute,
        },
      });
      
      // Navigate to sign-in
      this.navigateToSignIn({ replace: true, clearHistory: true });
      
      logInfo('Navigation: Handled logout');
    } catch (error) {
      logError('Navigation: Failed to handle logout', error as Error);
      // Fallback navigation
      router.replace('/sign-in');
    }
  }

  /**
   * Navigate back in auth flow
   */
  public navigateBack(): boolean {
    try {
      const history = this.navigationState.navigationHistory;
      
      if (history.length > 1) {
        // Remove current route and get previous
        history.pop();
        const previousRoute = history[history.length - 1];
        
        this.navigationState.currentRoute = previousRoute;
        router.replace(previousRoute);
        
        logInfo('Navigation: Navigated back', { to: previousRoute });
        return true;
      }
      
      // No history, navigate to default auth screen
      this.navigateToSignIn({ replace: true });
      return false;
    } catch (error) {
      logError('Navigation: Failed to navigate back', error as Error);
      return false;
    }
  }

  /**
   * Check if current route is an auth route
   */
  public isAuthRoute(route?: string): boolean {
    const currentRoute = route || this.navigationState.currentRoute;
    const authRoutes = [
      '/sign-in',
      '/sign-up',
      '/forgot-password',
      '/verify-email',
      '/reset-password',
    ];
    
    return authRoutes.some(authRoute => currentRoute.startsWith(authRoute));
  }

  /**
   * Get current navigation state
   */
  public getNavigationState(): NavigationState {
    return { ...this.navigationState };
  }

  /**
   * Set redirect after authentication
   */
  public setRedirectAfterAuth(route: string): void {
    this.navigationState.redirectAfterAuth = route;
    logInfo('Navigation: Set redirect after auth', { route });
  }

  /**
   * Clear redirect after authentication
   */
  public clearRedirectAfterAuth(): void {
    this.navigationState.redirectAfterAuth = undefined;
    logInfo('Navigation: Cleared redirect after auth');
  }

  /**
   * Handle deep link navigation
   */
  public handleDeepLink(url: string, authenticated: boolean): void {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      
      if (authenticated) {
        // User is authenticated, navigate directly
        router.replace(pathname);
      } else {
        // User not authenticated, set redirect and go to sign-in
        this.setRedirectAfterAuth(pathname);
        this.navigateToSignIn({ replace: true });
      }
      
      logInfo('Navigation: Handled deep link', { pathname, authenticated });
    } catch (error) {
      logError('Navigation: Failed to handle deep link', error as Error);
      // Fallback navigation
      if (authenticated) {
        router.replace('/');
      } else {
        this.navigateToSignIn({ replace: true });
      }
    }
  }

  /**
   * Handle navigation errors
   */
  public handleNavigationError(error: any, fallbackRoute: string = '/sign-in'): void {
    try {
      logError('Navigation: Navigation error occurred', error);
      
      // Navigate to fallback route
      router.replace(fallbackRoute);
      
      // Clear problematic state
      this.clearNavigationState();
    } catch (fallbackError) {
      logError('Navigation: Fallback navigation failed', fallbackError as Error);
    }
  }

  // Private methods

  private updateNavigationState(
    route: string, 
    authFlow?: 'sign-in' | 'sign-up' | 'forgot-password' | 'verify-email' | 'reset-password',
    redirectAfterAuth?: string
  ): void {
    this.navigationState.previousRoute = this.navigationState.currentRoute;
    this.navigationState.currentRoute = route;
    
    if (authFlow) {
      this.navigationState.authFlow = authFlow;
    }
    
    if (redirectAfterAuth) {
      this.navigationState.redirectAfterAuth = redirectAfterAuth;
    }
    
    // Add to history (limit to last 10 routes)
    this.navigationState.navigationHistory.push(route);
    if (this.navigationState.navigationHistory.length > 10) {
      this.navigationState.navigationHistory.shift();
    }
  }

  private clearNavigationState(): void {
    this.navigationState = {
      currentRoute: '/',
      navigationHistory: ['/'],
    };
  }

  private clearNavigationHistory(): void {
    this.navigationState.navigationHistory = [this.navigationState.currentRoute];
  }
}

// Export singleton instance
export const navigationService = NavigationService.getInstance();