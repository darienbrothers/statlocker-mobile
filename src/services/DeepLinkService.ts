/**
 * Deep Link Service
 * 
 * Handles deep links for authentication flows including magic links,
 * email verification, password reset, and SSO redirects.
 */

import { Linking } from 'react-native';
import { router } from 'expo-router';
import { logInfo, logError } from '@/lib/logging';
import { authService } from './AuthService';
import { auditLogService } from './AuditLogService';

export interface DeepLinkHandler {
  pattern: RegExp;
  handler: (url: string, params: URLSearchParams) => Promise<void>;
}

export interface DeepLinkContext {
  url: string;
  pathname: string;
  searchParams: URLSearchParams;
  timestamp: Date;
}

export class DeepLinkService {
  private static instance: DeepLinkService;
  private handlers: DeepLinkHandler[] = [];
  private isInitialized = false;

  private constructor() {
    this.setupDefaultHandlers();
  }

  public static getInstance(): DeepLinkService {
    if (!DeepLinkService.instance) {
      DeepLinkService.instance = new DeepLinkService();
    }
    return DeepLinkService.instance;
  }

  /**
   * Initialize deep link handling
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Handle app launch from deep link
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl) {
        await this.handleDeepLink(initialUrl);
      }

      // Listen for deep links while app is running
      const subscription = Linking.addEventListener('url', (event) => {
        this.handleDeepLink(event.url);
      });

      this.isInitialized = true;
      logInfo('DeepLink: Service initialized');

      return () => {
        subscription?.remove();
      };
    } catch (error) {
      logError('DeepLink: Failed to initialize', error as Error);
      throw error;
    }
  }

  /**
   * Handle incoming deep link
   */
  public async handleDeepLink(url: string): Promise<void> {
    try {
      logInfo('DeepLink: Processing deep link', { url });

      const context = this.parseDeepLink(url);
      
      // Find matching handler
      const handler = this.handlers.find(h => h.pattern.test(context.pathname));
      
      if (handler) {
        await handler.handler(url, context.searchParams);
        
        // Log successful deep link handling
        await auditLogService.logSecurityEvent({
          type: 'DEEP_LINK_HANDLED',
          userId: authService.getCurrentUser()?.uid,
          metadata: {
            url: context.pathname, // Don't log full URL for privacy
            timestamp: context.timestamp.toISOString(),
          },
        });
      } else {
        logInfo('DeepLink: No handler found for URL', { pathname: context.pathname });
        
        // Default fallback - navigate to home or sign-in
        const isAuthenticated = authService.getCurrentUser() !== null;
        router.replace(isAuthenticated ? '/' : '/sign-in');
      }
    } catch (error) {
      logError('DeepLink: Failed to handle deep link', error as Error);
      
      // Fallback navigation on error
      router.replace('/sign-in');
    }
  }

  /**
   * Register a custom deep link handler
   */
  public registerHandler(pattern: RegExp, handler: (url: string, params: URLSearchParams) => Promise<void>): void {
    this.handlers.push({ pattern, handler });
    logInfo('DeepLink: Handler registered', { pattern: pattern.source });
  }

  /**
   * Generate deep link URL
   */
  public generateDeepLink(path: string, params?: Record<string, string>): string {
    const baseUrl = 'statlocker://'; // Your app's custom scheme
    let url = `${baseUrl}${path}`;
    
    if (params && Object.keys(params).length > 0) {
      const searchParams = new URLSearchParams(params);
      url += `?${searchParams.toString()}`;
    }
    
    return url;
  }

  /**
   * Generate magic link for passwordless authentication
   */
  public generateMagicLink(email: string, redirectTo?: string): string {
    const params: Record<string, string> = { email };
    if (redirectTo) {
      params.redirect = redirectTo;
    }
    
    return this.generateDeepLink('/auth/magic-link', params);
  }

  /**
   * Generate email verification link
   */
  public generateEmailVerificationLink(token: string, email: string): string {
    return this.generateDeepLink('/auth/verify-email', { token, email });
  }

  /**
   * Generate password reset link
   */
  public generatePasswordResetLink(token: string, email: string): string {
    return this.generateDeepLink('/auth/reset-password', { token, email });
  }

  // Private methods

  private parseDeepLink(url: string): DeepLinkContext {
    try {
      const urlObj = new URL(url);
      return {
        url,
        pathname: urlObj.pathname,
        searchParams: urlObj.searchParams,
        timestamp: new Date(),
      };
    } catch (error) {
      // Fallback for malformed URLs
      return {
        url,
        pathname: '/',
        searchParams: new URLSearchParams(),
        timestamp: new Date(),
      };
    }
  }

  private setupDefaultHandlers(): void {
    // Email verification handler
    this.registerHandler(
      /^\/auth\/verify-email$/,
      async (url, params) => {
        const token = params.get('token');
        const email = params.get('email');
        
        if (token && email) {
          try {
            // Handle email verification
            await this.handleEmailVerification(token, email);
          } catch (error) {
            logError('DeepLink: Email verification failed', error as Error);
            router.replace('/verify-email?error=verification_failed');
          }
        } else {
          router.replace('/verify-email?error=invalid_link');
        }
      }
    );

    // Password reset handler
    this.registerHandler(
      /^\/auth\/reset-password$/,
      async (url, params) => {
        const token = params.get('token');
        const email = params.get('email');
        
        if (token && email) {
          router.replace(`/reset-password?token=${token}&email=${encodeURIComponent(email)}`);
        } else {
          router.replace('/forgot-password?error=invalid_link');
        }
      }
    );

    // Magic link handler
    this.registerHandler(
      /^\/auth\/magic-link$/,
      async (url, params) => {
        const email = params.get('email');
        const redirect = params.get('redirect');
        
        if (email) {
          try {
            // Handle magic link authentication
            await this.handleMagicLinkAuth(email);
            
            // Redirect to intended destination
            router.replace(redirect || '/');
          } catch (error) {
            logError('DeepLink: Magic link authentication failed', error as Error);
            router.replace('/sign-in?error=magic_link_failed');
          }
        } else {
          router.replace('/sign-in?error=invalid_magic_link');
        }
      }
    );

    // SSO callback handler
    this.registerHandler(
      /^\/auth\/callback$/,
      async (url, params) => {
        const provider = params.get('provider');
        const code = params.get('code');
        const state = params.get('state');
        const error = params.get('error');
        
        if (error) {
          logError('DeepLink: SSO callback error', new Error(error));
          router.replace(`/sign-in?error=sso_${error}`);
          return;
        }
        
        if (provider && code) {
          try {
            // Handle SSO callback
            await this.handleSSOCallback(provider, code, state);
            router.replace('/');
          } catch (error) {
            logError('DeepLink: SSO callback failed', error as Error);
            router.replace('/sign-in?error=sso_failed');
          }
        } else {
          router.replace('/sign-in?error=invalid_sso_callback');
        }
      }
    );

    // Parental consent handler
    this.registerHandler(
      /^\/auth\/parental-consent$/,
      async (url, params) => {
        const requestId = params.get('requestId');
        const token = params.get('token');
        
        if (requestId && token) {
          router.replace(`/parental-consent?requestId=${requestId}&token=${token}`);
        } else {
          router.replace('/sign-in?error=invalid_consent_link');
        }
      }
    );

    // Account activation handler
    this.registerHandler(
      /^\/auth\/activate$/,
      async (url, params) => {
        const token = params.get('token');
        const userId = params.get('userId');
        
        if (token && userId) {
          try {
            // Handle account activation
            await this.handleAccountActivation(token, userId);
            router.replace('/sign-in?message=account_activated');
          } catch (error) {
            logError('DeepLink: Account activation failed', error as Error);
            router.replace('/sign-in?error=activation_failed');
          }
        } else {
          router.replace('/sign-in?error=invalid_activation_link');
        }
      }
    );

    // Generic auth redirect handler
    this.registerHandler(
      /^\/auth\/redirect$/,
      async (url, params) => {
        const to = params.get('to');
        const message = params.get('message');
        const error = params.get('error');
        
        let destination = to || '/';
        
        if (message) {
          destination += `${destination.includes('?') ? '&' : '?'}message=${message}`;
        }
        
        if (error) {
          destination += `${destination.includes('?') ? '&' : '?'}error=${error}`;
        }
        
        router.replace(destination);
      }
    );
  }

  private async handleEmailVerification(token: string, email: string): Promise<void> {
    try {
      // This would typically verify the token with your backend
      // For now, we'll simulate the verification
      logInfo('DeepLink: Processing email verification', { email });
      
      // Update user's email verification status
      const currentUser = authService.getCurrentUser();
      if (currentUser && currentUser.email === email) {
        // Mark email as verified
        await auditLogService.logSecurityEvent({
          type: 'EMAIL_VERIFIED',
          userId: currentUser.uid,
          metadata: { email, verificationMethod: 'deep_link' },
        });
        
        router.replace('/sign-in?message=email_verified');
      } else {
        throw new Error('Email verification token mismatch');
      }
    } catch (error) {
      logError('DeepLink: Email verification failed', error as Error);
      throw error;
    }
  }

  private async handleMagicLinkAuth(email: string): Promise<void> {
    try {
      // This would typically authenticate the user with the magic link
      // For now, we'll simulate the authentication
      logInfo('DeepLink: Processing magic link authentication', { email });
      
      // Log magic link usage
      await auditLogService.logSecurityEvent({
        type: 'MAGIC_LINK_USED',
        userId: undefined, // User not authenticated yet
        metadata: { email, timestamp: new Date().toISOString() },
      });
      
      // Redirect to sign-in with pre-filled email
      router.replace(`/sign-in?email=${encodeURIComponent(email)}&magic=true`);
    } catch (error) {
      logError('DeepLink: Magic link authentication failed', error as Error);
      throw error;
    }
  }

  private async handleSSOCallback(provider: string, code: string, state?: string | null): Promise<void> {
    try {
      logInfo('DeepLink: Processing SSO callback', { provider });
      
      // This would typically exchange the code for tokens and authenticate the user
      // For now, we'll simulate the SSO callback handling
      
      await auditLogService.logSecurityEvent({
        type: 'SSO_CALLBACK_PROCESSED',
        userId: undefined, // User not authenticated yet
        metadata: { provider, hasState: !!state },
      });
      
      // The actual SSO authentication would happen here
      // For now, redirect to sign-in
      router.replace(`/sign-in?sso=${provider}`);
    } catch (error) {
      logError('DeepLink: SSO callback failed', error as Error);
      throw error;
    }
  }

  private async handleAccountActivation(token: string, userId: string): Promise<void> {
    try {
      logInfo('DeepLink: Processing account activation', { userId });
      
      // This would typically activate the account with the token
      // For now, we'll simulate the activation
      
      await auditLogService.logSecurityEvent({
        type: 'ACCOUNT_ACTIVATED',
        userId,
        metadata: { activationMethod: 'deep_link' },
      });
      
      logInfo('DeepLink: Account activated successfully', { userId });
    } catch (error) {
      logError('DeepLink: Account activation failed', error as Error);
      throw error;
    }
  }
}

// Export singleton instance
export const deepLinkService = DeepLinkService.getInstance();