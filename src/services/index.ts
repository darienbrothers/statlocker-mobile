/**
 * Services Index
 * 
 * Central export point for all service modules
 */

export { deepLinkService, default as DeepLinkService } from './DeepLinkService';
export type { DeepLinkData } from './DeepLinkService';

export { 
  authService, 
  AuthService,
} from './AuthService';

// Re-export types from the types module for convenience
export type {
  AuthErrorCode,
  AuthError,
  AuthProvider,
  User,
  UserCredential,
  FirebaseUser,
} from '@/types/auth';