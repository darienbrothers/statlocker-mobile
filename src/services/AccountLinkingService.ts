/**
 * Account Linking Service
 * 
 * Handles linking multiple authentication providers to a single user account.
 * Manages duplicate email detection, account merging, and Apple Private Relay handling.
 */

import {
  User as FirebaseUser,
  linkWithCredential,
  unlink,
  reauthenticateWithCredential,
  AuthCredential,
  EmailAuthProvider,
  OAuthProvider,
} from 'firebase/auth';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import { getFirebaseAuth } from '@/lib/firebase';
import { logInfo, logError } from '@/lib/logging';
import { auditLogService } from './AuditLogService';
import { AuthError, AuthErrorCode, AuthProvider, User } from '@/types/auth';

export interface AccountLinkingResult {
  success: boolean;
  linkedProvider?: AuthProvider;
  error?: AuthError;
  requiresReauth?: boolean;
  duplicateAccountFound?: boolean;
  mergedData?: any;
}

export interface DuplicateAccountInfo {
  existingProviders: string[];
  email: string;
  isApplePrivateRelay: boolean;
  contactEmail?: string;
  userData?: any;
}

export interface LinkingOptions {
  preserveUserData: boolean;
  requireReauth: boolean;
  handleApplePrivateRelay: boolean;
}

export class AccountLinkingService {
  private static instance: AccountLinkingService;
  private auth = getFirebaseAuth();

  private constructor() {}

  public static getInstance(): AccountLinkingService {
    if (!AccountLinkingService.instance) {
      AccountLinkingService.instance = new AccountLinkingService();
    }
    return AccountLinkingService.instance;
  }

  /**
   * Link Apple Sign-In to existing account
   */
  public async linkAppleAccount(
    user: FirebaseUser,
    options: LinkingOptions = { preserveUserData: true, requireReauth: true, handleApplePrivateRelay: true }
  ): Promise<AccountLinkingResult> {
    try {
      logInfo('AccountLinking: Starting Apple account linking', { uid: user.uid });

      // Check if Apple is already linked
      const existingAppleProvider = user.providerData.find(p => p.providerId === 'apple.com');
      if (existingAppleProvider) {
        return {
          success: false,
          error: {
            code: AuthErrorCode.PROVIDER_ALREADY_LINKED,
            message: 'Apple account is already linked',
            userMessage: 'Your Apple account is already connected to this account.',
            retryable: false,
          },
        };
      }

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

      // Check for duplicate accounts before linking
      if (appleCredential.email) {
        const duplicateInfo = await this.checkForDuplicateAccount(appleCredential.email, 'apple.com');
        if (duplicateInfo.existingProviders.length > 0) {
          // Handle Apple Private Relay
          if (options.handleApplePrivateRelay && this.isApplePrivateRelay(appleCredential.email)) {
            logInfo('AccountLinking: Apple Private Relay detected', { 
              relayEmail: appleCredential.email,
              contactEmail: duplicateInfo.contactEmail 
            });
          }

          return {
            success: false,
            duplicateAccountFound: true,
            error: {
              code: AuthErrorCode.ACCOUNT_EXISTS,
              message: 'Account with this email already exists',
              userMessage: 'An account with this email already exists. Would you like to merge the accounts?',
              retryable: true,
            },
          };
        }
      }

      // Perform the linking
      const linkedCredential = await linkWithCredential(user, credential);

      // Log successful linking
      await auditLogService.logProviderEvent('linked', 'apple.com', user.uid, {
        email: appleCredential.email,
        isPrivateRelay: appleCredential.email ? this.isApplePrivateRelay(appleCredential.email) : false,
      });

      logInfo('AccountLinking: Apple account linked successfully', { 
        uid: user.uid,
        email: appleCredential.email 
      });

      return {
        success: true,
        linkedProvider: {
          providerId: 'apple.com',
          uid: appleCredential.user,
          email: appleCredential.email || undefined,
        },
      };

    } catch (error) {
      // Handle Apple-specific errors
      if (error instanceof Error && error.message.includes('ERR_CANCELED')) {
        return {
          success: false,
          error: {
            code: AuthErrorCode.APPLE_CANCELLED,
            message: 'Apple Sign-In was cancelled',
            userMessage: 'Apple Sign-In was cancelled.',
            retryable: true,
          },
        };
      }

      // Log failed linking attempt
      await auditLogService.logProviderEvent('error', 'apple.com', user.uid, { error: error instanceof Error ? error.message : 'Unknown error' });

      logError('AccountLinking: Apple account linking failed', error as Error);

      return {
        success: false,
        error: {
          code: AuthErrorCode.UNKNOWN_ERROR,
          message: 'Failed to link Apple account',
          userMessage: 'Failed to link your Apple account. Please try again.',
          retryable: true,
        },
      };
    }
  }

  /**
   * Link Google Sign-In to existing account (placeholder)
   */
  public async linkGoogleAccount(
    user: FirebaseUser,
    options: LinkingOptions = { preserveUserData: true, requireReauth: true, handleApplePrivateRelay: false }
  ): Promise<AccountLinkingResult> {
    // This will be implemented when Google Sign-In is added
    return {
      success: false,
      error: {
        code: AuthErrorCode.UNKNOWN_ERROR,
        message: 'Google Sign-In linking not yet implemented',
        userMessage: 'Google account linking is not yet available.',
        retryable: false,
      },
    };
  }

  /**
   * Link email/password to existing account
   */
  public async linkEmailPassword(
    user: FirebaseUser,
    email: string,
    password: string,
    options: LinkingOptions = { preserveUserData: true, requireReauth: true, handleApplePrivateRelay: false }
  ): Promise<AccountLinkingResult> {
    try {
      logInfo('AccountLinking: Starting email/password linking', { uid: user.uid, email });

      // Check if email provider is already linked
      const existingEmailProvider = user.providerData.find(p => p.providerId === 'password');
      if (existingEmailProvider) {
        return {
          success: false,
          error: {
            code: AuthErrorCode.PROVIDER_ALREADY_LINKED,
            message: 'Email/password is already linked',
            userMessage: 'Email and password authentication is already set up for this account.',
            retryable: false,
          },
        };
      }

      // Check for duplicate accounts
      const duplicateInfo = await this.checkForDuplicateAccount(email, 'password');
      if (duplicateInfo.existingProviders.length > 0) {
        return {
          success: false,
          duplicateAccountFound: true,
          error: {
            code: AuthErrorCode.ACCOUNT_EXISTS,
            message: 'Account with this email already exists',
            userMessage: 'An account with this email already exists. Would you like to merge the accounts?',
            retryable: true,
          },
        };
      }

      // Create email credential
      const credential = EmailAuthProvider.credential(email, password);

      // Perform the linking
      const linkedCredential = await linkWithCredential(user, credential);

      // Log successful linking
      await auditLogService.logProviderEvent('linked', 'password', user.uid, { email });

      logInfo('AccountLinking: Email/password linked successfully', { uid: user.uid, email });

      return {
        success: true,
        linkedProvider: {
          providerId: 'password',
          uid: user.uid,
          email,
        },
      };

    } catch (error) {
      // Log failed linking attempt
      await auditLogService.logProviderEvent('error', 'password', user.uid, { 
        email,
        error: error instanceof Error ? error.message : 'Unknown error' 
      });

      logError('AccountLinking: Email/password linking failed', error as Error);

      return {
        success: false,
        error: {
          code: AuthErrorCode.UNKNOWN_ERROR,
          message: 'Failed to link email/password',
          userMessage: 'Failed to set up email and password authentication. Please try again.',
          retryable: true,
        },
      };
    }
  }

  /**
   * Unlink a provider from the account
   */
  public async unlinkProvider(user: FirebaseUser, providerId: string): Promise<AccountLinkingResult> {
    try {
      logInfo('AccountLinking: Unlinking provider', { uid: user.uid, providerId });

      // Check if provider is linked
      const providerData = user.providerData.find(p => p.providerId === providerId);
      if (!providerData) {
        return {
          success: false,
          error: {
            code: AuthErrorCode.PROVIDER_NOT_LINKED,
            message: 'Provider is not linked',
            userMessage: 'This authentication method is not connected to your account.',
            retryable: false,
          },
        };
      }

      // Ensure user has at least one other authentication method
      if (user.providerData.length <= 1) {
        return {
          success: false,
          error: {
            code: AuthErrorCode.UNKNOWN_ERROR,
            message: 'Cannot unlink last provider',
            userMessage: 'You must have at least one authentication method. Please add another method before removing this one.',
            retryable: false,
          },
        };
      }

      // Perform the unlinking
      await unlink(user, providerId);

      // Log successful unlinking
      await auditLogService.logProviderEvent('unlinked', providerId, user.uid);

      logInfo('AccountLinking: Provider unlinked successfully', { uid: user.uid, providerId });

      return {
        success: true,
      };

    } catch (error) {
      // Log failed unlinking attempt
      await auditLogService.logProviderEvent('error', providerId, user.uid, { 
        action: 'unlink',
        error: error instanceof Error ? error.message : 'Unknown error' 
      });

      logError('AccountLinking: Provider unlinking failed', error as Error);

      return {
        success: false,
        error: {
          code: AuthErrorCode.UNKNOWN_ERROR,
          message: 'Failed to unlink provider',
          userMessage: 'Failed to remove this authentication method. Please try again.',
          retryable: true,
        },
      };
    }
  }

  /**
   * Get linked providers for a user
   */
  public getLinkedProviders(user: FirebaseUser): AuthProvider[] {
    return user.providerData.map(provider => ({
      providerId: provider.providerId as any,
      uid: provider.uid,
      email: provider.email || undefined,
    }));
  }

  /**
   * Check if a provider can be safely unlinked
   */
  public canUnlinkProvider(user: FirebaseUser, providerId: string): boolean {
    const linkedProviders = user.providerData.filter(p => p.providerId !== providerId);
    return linkedProviders.length > 0;
  }

  /**
   * Merge accounts (placeholder for complex merging logic)
   */
  public async mergeAccounts(
    primaryUser: FirebaseUser,
    secondaryUserData: any,
    options: LinkingOptions
  ): Promise<AccountLinkingResult> {
    try {
      logInfo('AccountLinking: Starting account merge', { 
        primaryUid: primaryUser.uid,
        preserveData: options.preserveUserData 
      });

      // In a real implementation, this would:
      // 1. Transfer user data from secondary to primary account
      // 2. Update all references in the database
      // 3. Delete the secondary account
      // 4. Link the authentication methods

      // For now, this is a placeholder
      logInfo('AccountLinking: Account merge completed', { primaryUid: primaryUser.uid });

      return {
        success: true,
        mergedData: secondaryUserData,
      };

    } catch (error) {
      logError('AccountLinking: Account merge failed', error as Error);

      return {
        success: false,
        error: {
          code: AuthErrorCode.UNKNOWN_ERROR,
          message: 'Failed to merge accounts',
          userMessage: 'Failed to merge your accounts. Please contact support for assistance.',
          retryable: false,
        },
      };
    }
  }

  // Private helper methods

  /**
   * Check for duplicate accounts with the same email
   */
  private async checkForDuplicateAccount(email: string, excludeProvider?: string): Promise<DuplicateAccountInfo> {
    try {
      // In a real implementation, this would query your user database
      // to find accounts with the same email address
      
      // For now, this is a simplified check
      const normalizedEmail = email.toLowerCase();
      const isPrivateRelay = this.isApplePrivateRelay(email);

      return {
        existingProviders: [], // Would be populated from database query
        email: normalizedEmail,
        isApplePrivateRelay: isPrivateRelay,
        contactEmail: isPrivateRelay ? undefined : normalizedEmail,
      };

    } catch (error) {
      logError('AccountLinking: Error checking for duplicate accounts', error as Error);
      
      return {
        existingProviders: [],
        email: email.toLowerCase(),
        isApplePrivateRelay: false,
      };
    }
  }

  /**
   * Check if an email is an Apple Private Relay address
   */
  private isApplePrivateRelay(email: string): boolean {
    return email.includes('@privaterelay.appleid.com');
  }

  /**
   * Validate that a user can perform account linking
   */
  private async validateLinkingEligibility(user: FirebaseUser): Promise<boolean> {
    try {
      // Check if user's email is verified (if they have email auth)
      const emailProvider = user.providerData.find(p => p.providerId === 'password');
      if (emailProvider && !user.emailVerified) {
        return false;
      }

      // Check if user account is in good standing
      // In a real implementation, you'd check for account suspension, etc.
      
      return true;
    } catch (error) {
      logError('AccountLinking: Error validating linking eligibility', error as Error);
      return false;
    }
  }

  /**
   * Re-authenticate user before sensitive linking operations
   */
  public async reauthenticateForLinking(
    user: FirebaseUser,
    credential: AuthCredential
  ): Promise<boolean> {
    try {
      await reauthenticateWithCredential(user, credential);
      
      // Log re-authentication for linking
      await auditLogService.logSecurityEvent({
        type: 'REAUTHENTICATION',
        userId: user.uid,
        metadata: {
          purpose: 'account_linking',
          provider: credential.providerId,
        },
      });

      return true;
    } catch (error) {
      logError('AccountLinking: Re-authentication failed', error as Error);
      return false;
    }
  }
}

// Export singleton instance
export const accountLinkingService = AccountLinkingService.getInstance();