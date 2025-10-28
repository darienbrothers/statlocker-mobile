/**
 * Re-authentication Service
 * 
 * Handles re-authentication requirements for sensitive actions.
 * Manages recent login validation and provider-specific re-auth flows.
 */

import {
  User as FirebaseUser,
  reauthenticateWithCredential,
  EmailAuthProvider,
  OAuthProvider,
  AuthCredential,
} from 'firebase/auth';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { getFirebaseAuth } from '@/lib/firebase';
import { logInfo, logError } from '@/lib/logging';
import { auditLogService } from './AuditLogService';
import { AuthError, AuthErrorCode, AuthProvider } from '@/types/auth';

export interface ReauthConfig {
  recentLoginWindowMinutes: number;
  sensitiveActions: string[];
  enableAuditLogging: boolean;
}

export interface ReauthResult {
  success: boolean;
  error?: AuthError;
  wasRecentLogin?: boolean;
  reauthMethod?: string;
  timestamp?: number;
}

export interface SensitiveActionContext {
  action: string;
  userId: string;
  metadata?: Record<string, any>;
  requiresReauth?: boolean;
}

export class ReauthenticationService {
  private static instance: ReauthenticationService;
  private auth = getFirebaseAuth();
  private config: ReauthConfig;

  private constructor() {
    this.config = {
      recentLoginWindowMinutes: 5,
      sensitiveActions: [
        'change_email',
        'change_password',
        'delete_account',
        'link_provider',
        'unlink_provider',
        'subscription_management',
        'export_data',
        'update_payment_method',
      ],
      enableAuditLogging: true,
    };
  }

  public static getInstance(): ReauthenticationService {
    if (!ReauthenticationService.instance) {
      ReauthenticationService.instance = new ReauthenticationService();
    }
    return ReauthenticationService.instance;
  }

  /**
   * Check if a user needs re-authentication for a sensitive action
   */
  public async requiresReauth(action: string, userId: string): Promise<boolean> {
    try {
      // Check if this is a sensitive action
      if (!this.config.sensitiveActions.includes(action)) {
        return false;
      }

      // Check if user has recent login
      const hasRecentLogin = await this.hasRecentLogin(userId);
      
      logInfo('ReauthService: Checking reauth requirement', {
        action,
        userId,
        hasRecentLogin,
        windowMinutes: this.config.recentLoginWindowMinutes,
      });

      return !hasRecentLogin;
    } catch (error) {
      logError('ReauthService: Error checking reauth requirement', error as Error);
      // Fail secure - require reauth if we can't determine
      return true;
    }
  }

  /**
   * Perform re-authentication with email/password
   */
  public async reauthenticateWithPassword(
    user: FirebaseUser,
    email: string,
    password: string,
    context: SensitiveActionContext
  ): Promise<ReauthResult> {
    try {
      logInfo('ReauthService: Attempting password re-authentication', {
        userId: user.uid,
        action: context.action,
      });

      // Create email credential
      const credential = EmailAuthProvider.credential(email, password);

      // Perform re-authentication
      await reauthenticateWithCredential(user, credential);

      // Update last login timestamp
      await this.updateLastLoginTimestamp(user.uid);

      // Log successful re-authentication
      if (this.config.enableAuditLogging) {
        await auditLogService.logSecurityEvent({
          type: 'REAUTHENTICATION',
          userId: user.uid,
          metadata: {
            method: 'password',
            action: context.action,
            success: true,
          },
        });
      }

      logInfo('ReauthService: Password re-authentication successful', {
        userId: user.uid,
        action: context.action,
      });

      return {
        success: true,
        reauthMethod: 'password',
        timestamp: Date.now(),
      };

    } catch (error) {
      // Log failed re-authentication
      if (this.config.enableAuditLogging) {
        await auditLogService.logSecurityEvent({
          type: 'REAUTHENTICATION',
          userId: user.uid,
          metadata: {
            method: 'password',
            action: context.action,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          },
        });
      }

      logError('ReauthService: Password re-authentication failed', error as Error);

      return {
        success: false,
        error: {
          code: AuthErrorCode.INVALID_PASSWORD,
          message: 'Re-authentication failed',
          userMessage: 'Please check your password and try again.',
          retryable: true,
        },
      };
    }
  }

  /**
   * Perform re-authentication with Apple Sign-In
   */
  public async reauthenticateWithApple(
    user: FirebaseUser,
    context: SensitiveActionContext
  ): Promise<ReauthResult> {
    try {
      logInfo('ReauthService: Attempting Apple re-authentication', {
        userId: user.uid,
        action: context.action,
      });

      // Check if Apple Authentication is available
      const isAvailable = await AppleAuthentication.isAvailableAsync();
      if (!isAvailable) {
        return {
          success: false,
          error: {
            code: AuthErrorCode.UNKNOWN_ERROR,
            message: 'Apple Sign-In not available',
            userMessage: 'Apple Sign-In is not available on this device.',
            retryable: false,
          },
        };
      }

      // Generate nonce for security
      const nonce = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const hashedNonce = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        nonce,
        { encoding: Crypto.CryptoEncoding.HEX }
      );

      // Request Apple ID credential
      const appleCredential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        nonce: hashedNonce,
      });

      // Create Firebase credential
      const provider = new OAuthProvider('apple.com');
      const credential = provider.credential({
        idToken: appleCredential.identityToken!,
        rawNonce: nonce,
      });

      // Perform re-authentication
      await reauthenticateWithCredential(user, credential);

      // Update last login timestamp
      await this.updateLastLoginTimestamp(user.uid);

      // Log successful re-authentication
      if (this.config.enableAuditLogging) {
        await auditLogService.logSecurityEvent({
          type: 'REAUTHENTICATION',
          userId: user.uid,
          metadata: {
            method: 'apple',
            action: context.action,
            success: true,
          },
        });
      }

      logInfo('ReauthService: Apple re-authentication successful', {
        userId: user.uid,
        action: context.action,
      });

      return {
        success: true,
        reauthMethod: 'apple',
        timestamp: Date.now(),
      };

    } catch (error) {
      // Handle Apple-specific errors
      if (error instanceof Error && error.message.includes('ERR_CANCELED')) {
        return {
          success: false,
          error: {
            code: AuthErrorCode.APPLE_CANCELLED,
            message: 'Apple re-authentication was cancelled',
            userMessage: 'Re-authentication was cancelled.',
            retryable: true,
          },
        };
      }

      // Log failed re-authentication
      if (this.config.enableAuditLogging) {
        await auditLogService.logSecurityEvent({
          type: 'REAUTHENTICATION',
          userId: user.uid,
          metadata: {
            method: 'apple',
            action: context.action,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          },
        });
      }

      logError('ReauthService: Apple re-authentication failed', error as Error);

      return {
        success: false,
        error: {
          code: AuthErrorCode.UNKNOWN_ERROR,
          message: 'Apple re-authentication failed',
          userMessage: 'Apple re-authentication failed. Please try again.',
          retryable: true,
        },
      };
    }
  }

  /**
   * Perform re-authentication with Google Sign-In (placeholder)
   */
  public async reauthenticateWithGoogle(
    user: FirebaseUser,
    context: SensitiveActionContext
  ): Promise<ReauthResult> {
    // This will be implemented when Google Sign-In is added
    return {
      success: false,
      error: {
        code: AuthErrorCode.UNKNOWN_ERROR,
        message: 'Google re-authentication not yet implemented',
        userMessage: 'Google re-authentication is not yet available.',
        retryable: false,
      },
    };
  }

  /**
   * Get available re-authentication methods for a user
   */
  public getAvailableReauthMethods(user: FirebaseUser): string[] {
    const methods: string[] = [];
    
    for (const provider of user.providerData) {
      switch (provider.providerId) {
        case 'password':
          methods.push('password');
          break;
        case 'apple.com':
          methods.push('apple');
          break;
        case 'google.com':
          methods.push('google');
          break;
      }
    }
    
    return methods;
  }

  /**
   * Validate that a sensitive action can proceed
   */
  public async validateSensitiveAction(context: SensitiveActionContext): Promise<boolean> {
    try {
      const needsReauth = await this.requiresReauth(context.action, context.userId);
      
      if (needsReauth && !context.requiresReauth) {
        // Action requires re-authentication but hasn't been performed
        return false;
      }

      // Log sensitive action attempt
      if (this.config.enableAuditLogging) {
        await auditLogService.logSecurityEvent({
          type: 'SENSITIVE_ACTION',
          userId: context.userId,
          metadata: {
            action: context.action,
            needsReauth,
            validated: true,
            ...context.metadata,
          },
        });
      }

      return true;
    } catch (error) {
      logError('ReauthService: Error validating sensitive action', error as Error);
      return false;
    }
  }

  /**
   * Check if user has logged in recently
   */
  private async hasRecentLogin(userId: string): Promise<boolean> {
    try {
      const key = `last_login_${userId}`;
      const stored = await SecureStore.getItemAsync(key);
      
      if (!stored) {
        return false;
      }

      const lastLogin = parseInt(stored);
      const now = Date.now();
      const windowMs = this.config.recentLoginWindowMinutes * 60 * 1000;
      
      return (now - lastLogin) < windowMs;
    } catch (error) {
      logError('ReauthService: Error checking recent login', error as Error);
      return false;
    }
  }

  /**
   * Update the last login timestamp for a user
   */
  private async updateLastLoginTimestamp(userId: string): Promise<void> {
    try {
      const key = `last_login_${userId}`;
      await SecureStore.setItemAsync(key, Date.now().toString());
    } catch (error) {
      logError('ReauthService: Error updating last login timestamp', error as Error);
    }
  }

  /**
   * Clear the last login timestamp (for testing or logout)
   */
  public async clearLastLoginTimestamp(userId: string): Promise<void> {
    try {
      const key = `last_login_${userId}`;
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      logError('ReauthService: Error clearing last login timestamp', error as Error);
    }
  }

  /**
   * Get the time remaining in the recent login window
   */
  public async getRecentLoginTimeRemaining(userId: string): Promise<number> {
    try {
      const key = `last_login_${userId}`;
      const stored = await SecureStore.getItemAsync(key);
      
      if (!stored) {
        return 0;
      }

      const lastLogin = parseInt(stored);
      const now = Date.now();
      const windowMs = this.config.recentLoginWindowMinutes * 60 * 1000;
      const elapsed = now - lastLogin;
      
      return Math.max(0, windowMs - elapsed);
    } catch (error) {
      logError('ReauthService: Error getting time remaining', error as Error);
      return 0;
    }
  }

  /**
   * Add a custom sensitive action
   */
  public addSensitiveAction(action: string): void {
    if (!this.config.sensitiveActions.includes(action)) {
      this.config.sensitiveActions.push(action);
    }
  }

  /**
   * Remove a sensitive action
   */
  public removeSensitiveAction(action: string): void {
    const index = this.config.sensitiveActions.indexOf(action);
    if (index > -1) {
      this.config.sensitiveActions.splice(index, 1);
    }
  }

  /**
   * Update configuration
   */
  public updateConfig(newConfig: Partial<ReauthConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  public getConfig(): ReauthConfig {
    return { ...this.config };
  }
}

// Export singleton instance
export const reauthenticationService = ReauthenticationService.getInstance();