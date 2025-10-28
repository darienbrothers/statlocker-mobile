/**
 * Types Index
 * 
 * Central export point for all type definitions
 */

// Authentication types
export * from './auth';

// Security types  
export * from './security';

// Re-export commonly used types for convenience
export type {
  User,
  AuthError,
  AuthErrorCode,
  AuthState,
  AuthProvider,
  AuthProviderId,
  UserCredential,
  FirebaseUser,
  SecurityEvent,
  SecurityEventType,
  DeviceInfo,
  UserSession,
  RateLimitConfig,
  RateLimitState,
  IAuthService,
  IAuthStore,
} from './auth';

export type {
  SecurityAlert,
  SecurityAlertType,
  RiskLevel,
  SecurityMetrics,
  AnomalyDetection,
  DeviceFingerprint,
  GeolocationInfo,
  SecurityConfig,
} from './security';