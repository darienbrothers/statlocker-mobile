/**
 * Authentication Service
 * 
 * Provides Firebase Auth integration with support for:
 * - Email/Password authentication
 * - Apple Sign-In
 * - Google Sign-In
 * - Session management and persistence
 * - Error handling and user feedback
 */

import {
  User as FirebaseUser,
  UserCredential as FirebaseUserCredential,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  onAuthStateChanged,
  AuthError as FirebaseAuthError,
  AuthErrorCodes,
  OAuthProvider,
  signInWithCredential,
} from 'firebase/auth';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import { getFirebaseAuth } from '@/lib/firebase';
import { logInfo, logError } from '@/lib/logging';
import { sessionManager } from '@/lib/sessionManager';
import { rateLimitService } from './RateLimitService';
import { auditLogService } from './AuditLogService';
import { botProtectionService } from './BotProtectionService';
import { accountLinkingService } from './AccountLinkingService';
import { reauthenticationService } from './ReauthenticationService';
import { sessionManagementService } from './SessionManagementService';
import { consentManagementService } from './ConsentManagementService';
import {
  AuthErrorCode,
  AuthError,
  AuthProvider,
  User,
  UserCredential,
  IAuthService,
} from '@/types/auth';
import { RateLimitResult } from '@/types/security';
  


/**
 * Authentication Service Class
 * Handles all Firebase Auth operations with proper error handling
 */
export class AuthService implements IAuthService {
  private auth = getFirebaseAuth();
  private unsubscribeAuthState?: () => void;
  private isInitialized = false;

  /**
   * Initialize the authentication service
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      // Initialize rate limiting service
      await rateLimitService.initialize();
      
      // Initialize audit logging service
      await auditLogService.initialize();
      
      // Initialize bot protection service
      await botProtectionService.initialize();
      
      // Initialize session management service
      await sessionManagementService.initialize();
      
      this.isInitialized = true;
      logInfo('AuthService: Initialized successfully');
    } catch (error) {
      logError('AuthService: Initialization failed', error as Error);
      // Continue without services if initialization fails
      this.isInitialized = true;
    }
  }

  /**
   * Convert Firebase User to our User interface
   */
  private convertFirebaseUser(firebaseUser: FirebaseUser): User {
    return {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      emailVerified: firebaseUser.emailVerified,
      displayName: firebaseUser.displayName,
      photoURL: firebaseUser.photoURL,
      providers: firebaseUser.providerData.map(provider => ({
        providerId: provider.providerId as AuthProvider['providerId'],
        uid: provider.uid,
        email: provider.email || undefined,
      })),
      createdAt: firebaseUser.metadata.creationTime 
        ? new Date(firebaseUser.metadata.creationTime) 
        : new Date(),
      lastSignIn: firebaseUser.metadata.lastSignInTime 
        ? new Date(firebaseUser.metadata.lastSignInTime) 
        : new Date(),
    };
  }

  /**
   * Convert Firebase Auth Error to our AuthError interface
   */
  private convertAuthError(error: FirebaseAuthError | Error): AuthError {
    const code = 'code' in error ? error.code : 'unknown';
    
    // Map Firebase error codes to our error codes and user messages
    switch (code) {
      case AuthErrorCodes.INVALID_EMAIL:
        return {
          code: AuthErrorCode.INVALID_EMAIL,
          message: error.message,
          userMessage: 'Please enter a valid email address.',
          retryable: true,
        };
      
      case AuthErrorCodes.INVALID_PASSWORD:
        return {
          code: AuthErrorCode.INVALID_PASSWORD,
          message: error.message,
          userMessage: 'That password didn\'t match. Try again or reset it.',
          retryable: true,
          requiresAction: 'reset_password',
        };
      
      case 'auth/user-not-found':
        return {
          code: AuthErrorCode.USER_NOT_FOUND,
          message: error.message,
          userMessage: 'No account with that email yet. Create one?',
          retryable: true,
        };
      
      case AuthErrorCodes.EMAIL_EXISTS:
        return {
          code: AuthErrorCode.ACCOUNT_EXISTS,
          message: error.message,
          userMessage: 'An account with this email already exists.',
          retryable: false,
        };
      
      case AuthErrorCodes.TOO_MANY_ATTEMPTS_TRY_LATER:
        return {
          code: AuthErrorCode.RATE_LIMITED,
          message: error.message,
          userMessage: 'Too many attempts. Try again in a bit.',
          retryable: true,
        };
      
      case AuthErrorCodes.WEAK_PASSWORD:
        return {
          code: AuthErrorCode.WEAK_PASSWORD,
          message: error.message,
          userMessage: 'Password should be at least 8 characters with numbers and letters.',
          retryable: true,
        };
      
      case AuthErrorCodes.NETWORK_REQUEST_FAILED:
        return {
          code: AuthErrorCode.NETWORK_ERROR,
          message: error.message,
          userMessage: 'We couldn\'t connect. Check your internet and try again.',
          retryable: true,
        };
      
      default:
        return {
          code: AuthErrorCode.UNKNOWN_ERROR,
          message: error.message,
          userMessage: 'Something went wrong. Please try again.',
          retryable: true,
          requiresAction: 'contact_support',
        };
    }
  }

  /**
   * Sign in with email and password
   */
  async signInWithEmail(email: string, password: string): Promise<FirebaseUserCredential> {
    try {
      // Check rate limiting before attempting sign-in
      const identifier = await rateLimitService.getCombinedIdentifier(email);
      const rateLimitCheck = await rateLimitService.checkAttemptAllowed(identifier);
      
      if (!rateLimitCheck.allowed) {
        logError('AuthService: Sign-in blocked by rate limiting', new Error(`Rate limited for ${rateLimitCheck.remainingLockoutMinutes} minutes`));
        
        const rateLimitError: AuthError = {
          code: AuthErrorCode.TOO_MANY_REQUESTS,
          message: 'Too many failed attempts',
          userMessage: rateLimitCheck.message || 'Too many failed attempts. Please try again later.',
          retryable: false,
          details: {
            remainingLockoutMs: rateLimitCheck.remainingLockoutMs,
            remainingLockoutMinutes: rateLimitCheck.remainingLockoutMinutes,
          },
        };
        throw rateLimitError;
      }
      
      // Bot protection check for email sign-in
      const botCheck = await botProtectionService.verifyHuman('email_signin', undefined);
      if (botCheck.isBot) {
        const botError: AuthError = {
          code: AuthErrorCode.UNKNOWN_ERROR,
          message: 'Bot protection triggered',
          userMessage: 'Please verify that you are human.',
          retryable: true,
          details: { botProtection: botCheck },
        };
        throw botError;
      }
      
      // Present challenge if required
      if (botCheck.challengeRequired) {
        const challengePassed = await botProtectionService.presentChallenge('captcha');
        if (!challengePassed) {
          const challengeError: AuthError = {
            code: AuthErrorCode.UNKNOWN_ERROR,
            message: 'Challenge failed',
            userMessage: 'Please complete the verification challenge.',
            retryable: true,
          };
          throw challengeError;
        }
      }
      
      logInfo('AuthService: Attempting email sign-in', { email });
      
      const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
      
      // Record successful attempt (resets rate limiting)
      await rateLimitService.recordSuccessfulAttempt(identifier);
      
      // Log successful authentication
      await auditLogService.logAuthAttempt('email', true, userCredential.user.uid, email);
      
      // Create session for this device
      const user = this.convertFirebaseUser(userCredential.user);
      await sessionManagementService.createSession(user);
      
      logInfo('AuthService: Email sign-in successful', { 
        uid: userCredential.user.uid,
        email: userCredential.user.email 
      });
      
      return userCredential;
    } catch (error) {
      // If this is not a rate limit error, record the failed attempt
      const authError = error as AuthError;
      if (!authError.code || authError.code !== AuthErrorCode.TOO_MANY_REQUESTS) {
        const identifier = await rateLimitService.getCombinedIdentifier(email);
        await rateLimitService.recordFailedAttempt(identifier);
      }
      
      // Log failed authentication attempt
      const errorCode = (error as FirebaseAuthError).code || (error as AuthError).code;
      await auditLogService.logAuthAttempt('email', false, undefined, email, errorCode);
      
      // Convert Firebase errors to our AuthError format
      if (!(error as AuthError).code) {
        const authError = this.convertAuthError(error as FirebaseAuthError);
        logError('AuthService: Email sign-in failed', error as Error);
        throw authError;
      }
      
      // Re-throw if it's already an AuthError (like rate limiting)
      throw error;
    }
  }

  /**
   * Create user with email and password
   */
  async createUserWithEmail(email: string, password: string): Promise<FirebaseUserCredential> {
    try {
      // Bot protection check for email registration
      const botCheck = await botProtectionService.verifyHuman('email_signup', undefined);
      if (botCheck.isBot) {
        const botError: AuthError = {
          code: AuthErrorCode.UNKNOWN_ERROR,
          message: 'Bot protection triggered',
          userMessage: 'Please verify that you are human.',
          retryable: true,
          details: { botProtection: botCheck },
        };
        throw botError;
      }
      
      // Present challenge if required
      if (botCheck.challengeRequired) {
        const challengePassed = await botProtectionService.presentChallenge('captcha');
        if (!challengePassed) {
          const challengeError: AuthError = {
            code: AuthErrorCode.UNKNOWN_ERROR,
            message: 'Challenge failed',
            userMessage: 'Please complete the verification challenge.',
            retryable: true,
          };
          throw challengeError;
        }
      }
      
      logInfo('AuthService: Attempting email registration', { email });
      
      const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
      
      // Send email verification
      await this.sendEmailVerification();
      
      // Log account creation
      await auditLogService.logAccountEvent('created', userCredential.user.uid, {
        email: userCredential.user.email,
        provider: 'email',
        emailVerified: userCredential.user.emailVerified,
      });
      
      logInfo('AuthService: Email registration successful', { 
        uid: userCredential.user.uid,
        email: userCredential.user.email 
      });
      
      return userCredential;
    } catch (error) {
      // Log failed registration attempt
      const errorCode = (error as FirebaseAuthError).code;
      await auditLogService.logAuthAttempt('email', false, undefined, email, errorCode);
      
      const authError = this.convertAuthError(error as FirebaseAuthError);
      logError('AuthService: Email registration failed', error as Error);
      throw authError;
    }
  }

  /**
   * Sign out current user
   */
  async signOut(): Promise<void> {
    try {
      const currentUser = this.getCurrentUser();
      
      logInfo('AuthService: Attempting sign out');
      
      await firebaseSignOut(this.auth);
      
      // End current session
      await sessionManagementService.endSession();
      
      // Log session end
      if (currentUser) {
        await auditLogService.logSessionEvent('ended', currentUser.uid, 'manual_signout');
      }
      
      logInfo('AuthService: Sign out successful');
    } catch (error) {
      const authError = this.convertAuthError(error as FirebaseAuthError);
      logError('AuthService: Sign out failed', error as Error);
      throw authError;
    }
  }

  /**
   * Send email verification to current user
   */
  async sendEmailVerification(): Promise<void> {
    try {
      const user = this.auth.currentUser;
      if (!user) {
        throw new Error('No authenticated user found');
      }

      logInfo('AuthService: Sending email verification', { uid: user.uid });
      
      await sendEmailVerification(user);
      
      logInfo('AuthService: Email verification sent');
    } catch (error) {
      const authError = this.convertAuthError(error as FirebaseAuthError);
      logError('AuthService: Email verification failed', error as Error);
      throw authError;
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordReset(email: string): Promise<void> {
    try {
      logInfo('AuthService: Sending password reset', { email });
      
      await sendPasswordResetEmail(this.auth, email);
      
      logInfo('AuthService: Password reset sent');
    } catch (error) {
      const authError = this.convertAuthError(error as FirebaseAuthError);
      logError('AuthService: Password reset failed', error as Error);
      throw authError;
    }
  }

  /**
   * Get current user
   */
  getCurrentUser(): User | null {
    const firebaseUser = this.auth.currentUser;
    return firebaseUser ? this.convertFirebaseUser(firebaseUser) : null;
  }

  /**
   * Subscribe to authentication state changes
   */
  onAuthStateChanged(callback: (user: User | null) => void): () => void {
    this.unsubscribeAuthState = onAuthStateChanged(this.auth, (firebaseUser) => {
      const user = firebaseUser ? this.convertFirebaseUser(firebaseUser) : null;
      callback(user);
    });

    return () => {
      if (this.unsubscribeAuthState) {
        this.unsubscribeAuthState();
        this.unsubscribeAuthState = undefined;
      }
    };
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.auth.currentUser;
  }

  /**
   * Check if current user's email is verified
   */
  isEmailVerified(): boolean {
    return this.auth.currentUser?.emailVerified ?? false;
  }

  /**
   * Apple Sign-In with Firebase integration
   */
  async signInWithApple(): Promise<FirebaseUserCredential> {
    try {
      logInfo('AuthService: Attempting Apple Sign-In');

      // Check if Apple Authentication is available
      const isAvailable = await AppleAuthentication.isAvailableAsync();
      if (!isAvailable) {
        throw new Error('Apple Sign-In is not available on this device');
      }

      // Generate nonce for security
      const nonce = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const hashedNonce = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, nonce, { encoding: Crypto.CryptoEncoding.HEX });

      // Request Apple ID credential
      const appleCredential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        nonce: hashedNonce,
      });

      logInfo('AuthService: Apple credential received', { 
        user: appleCredential.user,
        email: appleCredential.email 
      });

      // Create Firebase credential from Apple credential
      const provider = new OAuthProvider('apple.com');
      const credential = provider.credential({
        idToken: appleCredential.identityToken!,
        rawNonce: nonce,
      });

      // Sign in to Firebase with Apple credential
      const userCredential = await signInWithCredential(this.auth, credential);

      // Update display name if provided by Apple (first time sign-in)
      if (appleCredential.fullName && userCredential.user) {
        const displayName = `${appleCredential.fullName.givenName || ''} ${appleCredential.fullName.familyName || ''}`.trim();
        if (displayName && !userCredential.user.displayName) {
          // Note: We'll implement updateProfile in a later task
          logInfo('AuthService: Apple Sign-In display name available', { displayName });
        }
      }

      // Log successful Apple Sign-In
      await auditLogService.logAuthAttempt('apple', true, userCredential.user.uid, userCredential.user.email || undefined);
      
      // Create session for this device
      const user = this.convertFirebaseUser(userCredential.user);
      await sessionManagementService.createSession(user);
      
      logInfo('AuthService: Apple Sign-In successful', { 
        uid: userCredential.user.uid,
        email: userCredential.user.email 
      });

      return userCredential;
    } catch (error) {
      // Log failed Apple Sign-In attempt
      const errorCode = (error as FirebaseAuthError).code || (error as AuthError).code;
      await auditLogService.logAuthAttempt('apple', false, undefined, undefined, errorCode);
      
      // Handle Apple-specific errors
      if (error instanceof Error) {
        if (error.message.includes('ERR_CANCELED')) {
          const authError: AuthError = {
            code: AuthErrorCode.APPLE_CANCELLED,
            message: 'Apple Sign-In was cancelled',
            userMessage: 'Sign-in was cancelled.',
            retryable: true,
          };
          logError('AuthService: Apple Sign-In cancelled', error);
          throw authError;
        }
      }

      const authError = this.convertAuthError(error as FirebaseAuthError);
      logError('AuthService: Apple Sign-In failed', error as Error);
      throw authError;
    }
  }

  /**
   * Google Sign-In (placeholder - will be implemented in task 3.3)
   */
  async signInWithGoogle(): Promise<FirebaseUserCredential> {
    throw new Error('Google Sign-In not yet implemented');
  }

  /**
   * Sign out from all devices
   */
  async signOutAllDevices(): Promise<void> {
    const currentUser = this.getCurrentUser();
    if (!currentUser) {
      throw new Error('No authenticated user');
    }

    await sessionManagementService.signOutAllDevices(currentUser.uid);
    
    // Also sign out from current device
    await this.signOut();
  }

  /**
   * Update user profile (placeholder - will be implemented in later tasks)
   */
  async updateProfile(updates: Partial<User>): Promise<void> {
    throw new Error('Update profile not yet implemented');
  }

  /**
   * Confirm password reset (placeholder - will be implemented in later tasks)
   */
  async confirmPasswordReset(code: string, newPassword: string): Promise<void> {
    throw new Error('Confirm password reset not yet implemented');
  }

  /**
   * Check if recent authentication is required
   */
  async requireRecentAuth(maxAge: number = 5): Promise<boolean> {
    try {
      logInfo('AuthService: Checking recent auth requirement', { maxAgeMinutes: maxAge });
      
      const requiresAuth = await sessionManager.requiresRecentAuth(maxAge);
      
      logInfo('AuthService: Recent auth requirement result', { requiresAuth });
      return requiresAuth;
    } catch (error) {
      logError('AuthService: Failed to check recent auth requirement', error as Error);
      return true; // Err on the side of caution
    }
  }

  /**
   * Refresh session token and update activity
   */
  async refreshSession(): Promise<void> {
    try {
      logInfo('AuthService: Refreshing session');
      
      const success = await sessionManager.refreshSession();
      if (!success) {
        throw new Error('Session refresh failed');
      }
      
      logInfo('AuthService: Session refreshed successfully');
    } catch (error) {
      const authError = this.convertAuthError(error as Error);
      logError('AuthService: Session refresh failed', error as Error);
      throw authError;
    }
  }

  /**
   * Validate current session
   */
  async validateSession(): Promise<boolean> {
    try {
      logInfo('AuthService: Validating session');
      
      const isValid = await sessionManager.validateSession();
      
      logInfo('AuthService: Session validation result', { isValid });
      return isValid;
    } catch (error) {
      logError('AuthService: Session validation failed', error as Error);
      return false;
    }
  }

  /**
   * Get active sessions for current user
   */
  async getActiveSessions(): Promise<any[]> {
    const currentUser = this.getCurrentUser();
    if (!currentUser) {
      return [];
    }

    return await sessionManagementService.getUserSessions(currentUser.uid);
  }

  /**
   * Revoke a specific session
   */
  async revokeSession(sessionId: string): Promise<void> {
    const currentUser = this.getCurrentUser();
    if (!currentUser) {
      throw new Error('No authenticated user');
    }

    await sessionManagementService.revokeSession(currentUser.uid, sessionId);
  }

  /**
   * Get current session info
   */
  getCurrentSession(): any {
    return sessionManagementService.getCurrentSession();
  }

  /**
   * Update session activity
   */
  async updateSessionActivity(): Promise<void> {
    await sessionManagementService.updateSessionActivity();
  }

  /**
   * Link Apple account to current user
   */
  async linkAppleAccount(): Promise<void> {
    const currentUser = this.getCurrentUser();
    if (!currentUser) {
      throw new Error('No authenticated user');
    }

    const result = await accountLinkingService.linkAppleAccount(this.auth.currentUser!, {
      preserveUserData: true,
      requireReauth: true,
      handleApplePrivateRelay: true,
    });

    if (!result.success && result.error) {
      throw result.error;
    }
  }

  /**
   * Link email/password to current user
   */
  async linkEmailPassword(email: string, password: string): Promise<void> {
    const currentUser = this.getCurrentUser();
    if (!currentUser) {
      throw new Error('No authenticated user');
    }

    const result = await accountLinkingService.linkEmailPassword(
      this.auth.currentUser!,
      email,
      password,
      {
        preserveUserData: true,
        requireReauth: true,
        handleApplePrivateRelay: false,
      }
    );

    if (!result.success && result.error) {
      throw result.error;
    }
  }

  /**
   * Unlink a provider from current user
   */
  async unlinkProvider(providerId: string): Promise<void> {
    const currentUser = this.getCurrentUser();
    if (!currentUser) {
      throw new Error('No authenticated user');
    }

    const result = await accountLinkingService.unlinkProvider(this.auth.currentUser!, providerId);

    if (!result.success && result.error) {
      throw result.error;
    }
  }

  /**
   * Get linked providers for current user
   */
  getLinkedProviders(): AuthProvider[] {
    if (!this.auth.currentUser) {
      return [];
    }

    return accountLinkingService.getLinkedProviders(this.auth.currentUser);
  }

  /**
   * Check if a provider can be safely unlinked
   */
  canUnlinkProvider(providerId: string): boolean {
    if (!this.auth.currentUser) {
      return false;
    }

    return accountLinkingService.canUnlinkProvider(this.auth.currentUser, providerId);
  }

  /**
   * Link a provider to current user (generic method for interface compliance)
   */
  async linkProvider(provider: AuthProvider): Promise<void> {
    switch (provider.providerId) {
      case 'apple.com':
        await this.linkAppleAccount();
        break;
      case 'password':
        if (!provider.email) {
          throw new Error('Email is required for password provider');
        }
        // Note: This would need password from somewhere - in practice, 
        // you'd use the specific linkEmailPassword method
        throw new Error('Use linkEmailPassword method for email/password linking');
      default:
        throw new Error(`Linking for provider ${provider.providerId} not implemented`);
    }
  }

  /**
   * Check if re-authentication is required for an action
   */
  async requiresReauth(action: string): Promise<boolean> {
    const currentUser = this.getCurrentUser();
    if (!currentUser) {
      return true; // Always require auth if no user
    }

    return await reauthenticationService.requiresReauth(action, currentUser.uid);
  }

  /**
   * Re-authenticate with password
   */
  async reauthenticateWithPassword(password: string, action: string): Promise<void> {
    const currentUser = this.getCurrentUser();
    if (!currentUser || !currentUser.email) {
      throw new Error('No authenticated user or email');
    }

    const result = await reauthenticationService.reauthenticateWithPassword(
      this.auth.currentUser!,
      currentUser.email,
      password,
      {
        action,
        userId: currentUser.uid,
        requiresReauth: true,
      }
    );

    if (!result.success && result.error) {
      throw result.error;
    }
  }

  /**
   * Re-authenticate with Apple
   */
  async reauthenticateWithApple(action: string): Promise<void> {
    const currentUser = this.getCurrentUser();
    if (!currentUser) {
      throw new Error('No authenticated user');
    }

    const result = await reauthenticationService.reauthenticateWithApple(
      this.auth.currentUser!,
      {
        action,
        userId: currentUser.uid,
        requiresReauth: true,
      }
    );

    if (!result.success && result.error) {
      throw result.error;
    }
  }

  /**
   * Get available re-authentication methods
   */
  getAvailableReauthMethods(): string[] {
    if (!this.auth.currentUser) {
      return [];
    }

    return reauthenticationService.getAvailableReauthMethods(this.auth.currentUser);
  }

  /**
   * Validate that a sensitive action can proceed
   */
  async validateSensitiveAction(action: string, metadata?: Record<string, any>): Promise<boolean> {
    const currentUser = this.getCurrentUser();
    if (!currentUser) {
      return false;
    }

    return await reauthenticationService.validateSensitiveAction({
      action,
      userId: currentUser.uid,
      metadata,
      requiresReauth: true,
    });
  }

  /**
   * Account deletion (placeholder - will be implemented in task 9.3)
   */
  async deleteAccount(): Promise<void> {
    throw new Error('Account deletion not yet implemented');
  }

  /**
   * Cleanup method
   */
  cleanup(): void {
    if (this.unsubscribeAuthState) {
      this.unsubscribeAuthState();
      this.unsubscribeAuthState = undefined;
    }
  }
}

// Export singleton instance
export const authService = new AuthService();