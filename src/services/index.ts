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
} from '@/types/auth';//
 Consent and Compliance Services
export { consentManagementService } from './ConsentManagementService';
export { parentalConsentService } from './ParentalConsentService';
export type { 
  ConsentRecord, 
  LegalDocument, 
  ConsentRequest, 
  AgeVerificationData 
} from './ConsentManagementService';
export type { 
  ParentalConsentRequest, 
  ParentalConsentResponse, 
  PendingAccount 
} from './ParentalConsentService';export { 
accountDeletionService } from './AccountDeletionService';
export type { 
  DeletionRequest, 
  DeletionProgress, 
  DataExport 
} from './AccountDeletionService';/
/ Navigation and Error Handling Services
export { deepLinkService } from './DeepLinkService';
export { navigationService } from './NavigationService';
export { errorHandlingService } from './ErrorHandlingService';
export type { 
  DeepLinkHandler, 
  DeepLinkContext 
} from './DeepLinkService';
export type { 
  NavigationState, 
  AuthNavigationOptions 
} from './NavigationService';
export type { 
  ErrorMapping, 
  ErrorRecoveryAction, 
  ProcessedError, 
  ErrorContext 
} from './ErrorHandlingService';