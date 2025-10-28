/**
 * Authentication Types and Interfaces
 * 
 * Comprehensive type definitions for the authentication system
 * including user management, error handling, security events, and audit logging
 */

import type { UserCredential as FirebaseUserCredential } from 'firebase/auth';
import type { User as FirebaseUser } from 'firebase/auth';

// Re-export Firebase types for consistency
export type { UserCredential } from 'firebase/auth';
export type { User as FirebaseUser } from 'firebase/auth';

/**
 * Authentication Error Codes
 * Maps to Firebase Auth error codes and custom application errors
 */
export enum AuthErrorCode {
  // Network errors
  NETWORK_ERROR = 'auth/network-request-failed',
  TIMEOUT = 'auth/timeout',
  
  // Credential errors
  INVALID_EMAIL = 'auth/invalid-email',
  INVALID_PASSWORD = 'auth/wrong-password',
  USER_NOT_FOUND = 'auth/user-not-found',
  
  // Account state errors
  USER_DISABLED = 'auth/user-disabled',
  EMAIL_NOT_VERIFIED = 'auth/email-not-verified',
  ACCOUNT_EXISTS = 'auth/email-already-in-use',
  
  // Security errors
  RATE_LIMITED = 'auth/too-many-requests',
  TOO_MANY_REQUESTS = 'auth/too-many-requests',
  WEAK_PASSWORD = 'auth/weak-password',
  REQUIRES_RECENT_LOGIN = 'auth/requires-recent-login',
  
  // Provider errors
  APPLE_CANCELLED = 'auth/apple-cancelled',
  GOOGLE_CANCELLED = 'auth/google-cancelled',
  PROVIDER_ALREADY_LINKED = 'auth/provider-already-linked',
  PROVIDER_NOT_LINKED = 'auth/provider-not-linked',
  
  // Age/consent errors
  UNDERAGE_USER = 'auth/underage-user',
  PARENTAL_CONSENT_REQUIRED = 'auth/parental-consent-required',
  
  // Account management errors
  ACCOUNT_DELETION_FAILED = 'auth/account-deletion-failed',
  DATA_EXPORT_FAILED = 'auth/data-export-failed',
  
  // Generic errors
  UNKNOWN_ERROR = 'auth/unknown-error',
  INITIALIZATION_FAILED = 'auth/initialization-failed',
}

/**
 * Authentication Error Interface
 * Provides structured error information with user-friendly messages
 */
export interface AuthError {
  code: AuthErrorCode;
  message: string;
  userMessage: string; // Localized, user-friendly message
  retryable: boolean;
  requiresAction?: 'verify_email' | 'reset_password' | 'contact_support' | 'reauthenticate';
  metadata?: Record<string, any>;
  details?: Record<string, any>; // Additional error details (e.g., rate limiting info)
}

/**
 * Authentication Provider Types
 */
export type AuthProviderId = 'apple.com' | 'google.com' | 'password';

export interface AuthProvider {
  providerId: AuthProviderId;
  uid: string;
  email?: string;
  displayName?: string;
  photoURL?: string;
}

/**
 * User Interface
 * Represents an authenticated user with all relevant information
 */
export interface User {
  // Core identity
  uid: string;
  email: string | null;
  emailVerified: boolean;
  displayName: string | null;
  photoURL: string | null;
  
  // Authentication metadata
  providers: AuthProvider[];
  createdAt: Date;
  lastSignIn: Date;
  
  // Compliance and consent
  consentVersion?: string;
  consentTimestamp?: Date;
  parentalConsent?: boolean;
  ageVerified?: boolean;
  
  // Account status
  accountStatus?: 'active' | 'suspended' | 'pending_verification' | 'pending_deletion';
  
  // Privacy settings
  privacySettings?: UserPrivacySettings;
}

/**
 * User Privacy Settings
 */
export interface UserPrivacySettings {
  dataProcessing: boolean;
  marketing: boolean;
  analytics: boolean;
  personalization: boolean;
}

/**
 * Authentication State Interface
 * Represents the current authentication state in the application
 */
export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  hasInitialized: boolean;
  error: AuthError | null;
  sessionValid: boolean;
  lastActivity?: Date;
}

/**
 * Device Information for Session Management
 */
export interface DeviceInfo {
  deviceId: string;
  platform: 'ios' | 'android' | 'web';
  deviceName?: string;
  osVersion?: string;
  appVersion: string;
  lastAccess: Date;
  pushToken?: string;
  location?: {
    country?: string;
    region?: string;
    city?: string;
  };
}

/**
 * User Session Information
 */
export interface UserSession {
  sessionId: string;
  userId: string;
  deviceInfo: DeviceInfo;
  createdAt: Date;
  lastActivity: Date;
  expiresAt: Date;
  isActive: boolean;
  ipAddress?: string;
}

/**
 * Rate Limiting Configuration
 */
export interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
  blockDurationMs: number;
  identifier: 'ip' | 'device' | 'user';
}

/**
 * Rate Limit State
 */
export interface RateLimitState {
  attempts: number;
  firstAttempt: Date;
  lastAttempt: Date;
  blockedUntil?: Date;
  isBlocked: boolean;
}

/**
 * Security Event Types
 */
export enum SecurityEventType {
  // Authentication events
  AUTH_SUCCESS = 'auth_success',
  AUTH_FAILED = 'auth_failed',
  AUTH_TIMEOUT = 'auth_timeout',
  
  // Account events
  ACCOUNT_CREATED = 'account_created',
  ACCOUNT_DELETED = 'account_deleted',
  ACCOUNT_SUSPENDED = 'account_suspended',
  ACCOUNT_REACTIVATED = 'account_reactivated',
  
  // Session events
  SESSION_STARTED = 'session_started',
  SESSION_ENDED = 'session_ended',
  SESSION_EXPIRED = 'session_expired',
  
  // Security events
  RATE_LIMITED = 'rate_limited',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  MULTIPLE_FAILED_ATTEMPTS = 'multiple_failed_attempts',
  UNUSUAL_LOCATION = 'unusual_location',
  
  // Provider events
  PROVIDER_LINKED = 'provider_linked',
  PROVIDER_UNLINKED = 'provider_unlinked',
  PROVIDER_ERROR = 'provider_error',
  
  // Sensitive actions
  PASSWORD_CHANGED = 'password_changed',
  EMAIL_CHANGED = 'email_changed',
  REAUTHENTICATION_REQUIRED = 'reauthentication_required',
  REAUTHENTICATION_SUCCESS = 'reauthentication_success',
  
  // Compliance events
  CONSENT_GIVEN = 'consent_given',
  CONSENT_WITHDRAWN = 'consent_withdrawn',
  DATA_EXPORTED = 'data_exported',
  PARENTAL_CONSENT_REQUESTED = 'parental_consent_requested',
}

/**
 * Security Event Interface
 */
export interface SecurityEvent {
  id: string;
  type: SecurityEventType;
  userId?: string;
  sessionId?: string;
  timestamp: Date;
  
  // Request information
  ipAddress?: string;
  userAgent?: string;
  deviceInfo?: Partial<DeviceInfo>;
  
  // Event details
  success: boolean;
  errorCode?: AuthErrorCode;
  provider?: AuthProviderId;
  
  // Additional metadata
  metadata: Record<string, any>;
  
  // Risk assessment
  riskScore?: number;
  riskFactors?: string[];
}



/**
 * Authentication Service Interface
 * Defines the contract for authentication operations
 */
export interface IAuthService {
  // Core authentication
  signInWithEmail(email: string, password: string): Promise<FirebaseUserCredential>;
  signInWithApple(): Promise<FirebaseUserCredential>;
  signInWithGoogle(): Promise<FirebaseUserCredential>;
  createUserWithEmail(email: string, password: string): Promise<FirebaseUserCredential>;
  signOut(): Promise<void>;
  signOutAllDevices(): Promise<void>;
  
  // User management
  getCurrentUser(): User | null;
  updateProfile(updates: Partial<User>): Promise<void>;
  deleteAccount(): Promise<void>;
  
  // Email verification and password reset
  sendEmailVerification(): Promise<void>;
  sendPasswordReset(email: string): Promise<void>;
  confirmPasswordReset(code: string, newPassword: string): Promise<void>;
  
  // Account linking
  linkProvider(provider: AuthProvider): Promise<void>;
  unlinkProvider(providerId: AuthProviderId): Promise<void>;
  
  // Re-authentication
  reauthenticate(credential: any): Promise<void>;
  requireRecentAuth(maxAge: number): Promise<boolean>;
  
  // Session management
  refreshSession(): Promise<void>;
  validateSession(): Promise<boolean>;
  getActiveSessions(): Promise<UserSession[]>;
  revokeSession(sessionId: string): Promise<void>;
  
  // State management
  onAuthStateChanged(callback: (user: User | null) => void): () => void;
  isAuthenticated(): boolean;
  isEmailVerified(): boolean;
  
  // Utility methods
  cleanup(): void;
}

/**
 * Authentication Store Interface
 * Defines the contract for authentication state management
 */
export interface IAuthStore {
  // State
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  hasInitialized: boolean;
  error: AuthError | null;
  
  // Actions
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: AuthError | null) => void;
  clearError: () => void;
  
  // Authentication methods
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  
  // Utility methods
  sendPasswordReset: (email: string) => Promise<void>;
  sendEmailVerification: () => Promise<void>;
  initialize: () => Promise<void>;
}

/**
 * Password Validation Rules
 */
export interface PasswordValidationRules {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  forbiddenPatterns: string[];
}

/**
 * Password Strength Assessment
 */
export interface PasswordStrength {
  score: number; // 0-4 (very weak to very strong)
  feedback: string[];
  isValid: boolean;
  requirements: {
    length: boolean;
    uppercase: boolean;
    lowercase: boolean;
    numbers: boolean;
    specialChars: boolean;
  };
}

/**
 * Email Validation Result
 */
export interface EmailValidation {
  isValid: boolean;
  errors: string[];
  suggestions?: string[];
}

/**
 * Consent Management
 */
export interface ConsentRecord {
  version: string;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
  consents: {
    terms: boolean;
    privacy: boolean;
    marketing: boolean;
    analytics: boolean;
  };
}

/**
 * Age Verification
 */
export interface AgeVerification {
  dateOfBirth?: Date;
  isMinor: boolean;
  requiresParentalConsent: boolean;
  parentalConsentStatus?: 'pending' | 'approved' | 'denied';
  region: string; // For COPPA/GDPR-K compliance
}

/**
 * Account Deletion Request
 */
export interface AccountDeletionRequest {
  requestId: string;
  userId: string;
  requestedAt: Date;
  scheduledFor: Date;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  dataExportUrl?: string;
  confirmationRequired: boolean;
}

/**
 * Data Export Request
 */
export interface DataExportRequest {
  requestId: string;
  userId: string;
  requestedAt: Date;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  downloadUrl?: string;
  expiresAt?: Date;
  format: 'json' | 'csv';
}

/**
 * Authentication Analytics Event
 */
export interface AuthAnalyticsEvent {
  event: string;
  userId?: string;
  sessionId?: string;
  timestamp: Date;
  properties: Record<string, any>;
  context: {
    platform: string;
    appVersion: string;
    osVersion?: string;
    deviceModel?: string;
  };
}

/**
 * Feature Flags for Authentication
 */
export interface AuthFeatureFlags {
  magicLink: boolean;
  reauthModal: boolean;
  deviceList: boolean;
  biometricAuth: boolean;
  socialProviders: {
    apple: boolean;
    google: boolean;
    facebook: boolean;
  };
  advancedSecurity: {
    rateLimit: boolean;
    botProtection: boolean;
    deviceFingerprinting: boolean;
  };
}

/**
 * Authentication Configuration
 */
export interface AuthConfig {
  // Provider settings
  providers: {
    email: boolean;
    apple: boolean;
    google: boolean;
  };
  
  // Security settings
  passwordRules: PasswordValidationRules;
  rateLimits: {
    signIn: RateLimitConfig;
    signUp: RateLimitConfig;
    passwordReset: RateLimitConfig;
    emailVerification: RateLimitConfig;
  };
  
  // Session settings
  sessionTimeout: number; // in milliseconds
  maxConcurrentSessions: number;
  requireRecentAuthFor: string[]; // list of sensitive actions
  
  // Compliance settings
  ageVerificationRequired: boolean;
  consentVersion: string;
  dataRetentionDays: number;
  
  // Feature flags
  features: AuthFeatureFlags;
}