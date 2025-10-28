/**
 * Authentication Components Index
 * 
 * Central export point for all authentication UI components
 */

// Base Form Components
export { SLTextField } from './SLTextField';
export type { SLTextFieldProps } from './SLTextField';

export { SLButton } from './SLButton';
export type { SLButtonProps } from './SLButton';

export { 
  SLFormHint, 
  SLFormHintList, 
  SLPasswordStrength 
} from './SLFormHint';
export type { 
  SLFormHintProps, 
  SLFormHintListProps, 
  SLPasswordStrengthProps 
} from './SLFormHint';

// Provider Components
export { 
  SLProviderButton,
  SLAppleSignInButton,
  SLGoogleSignInButton 
} from './SLProviderButton';
export type { 
  SLProviderButtonProps,
  SLAppleSignInButtonProps,
  SLGoogleSignInButtonProps 
} from './SLProviderButton';

// Feedback Components
export { SLToast, useToast } from './SLToast';
export type { SLToastProps, ToastState } from './SLToast';

export { 
  SLDividerLabelled,
  SLDivider,
  SLDividerWithIcon 
} from './SLDividerLabelled';
export type { 
  SLDividerLabelledProps,
  SLDividerProps,
  SLDividerWithIconProps 
} from './SLDividerLabelled';

// Security Components
// export { 
//   SLRateLimitBanner, 
//   useRateLimitCountdown 
// } from './SLRateLimitBanner';
// export type { SLRateLimitBannerProps } from './SLRateLimitBanner';// Advan
ced Authentication Components
export { default as SLConsentForm } from './SLConsentForm';
export { default as SLAgeVerificationForm } from './SLAgeVerificationForm';
export { default as SLParentalConsentFlow } from './SLParentalConsentFlow';
export { default as SLEnhancedSignUpFlow } from './SLEnhancedSignUpFlow';
export { default as SLReauthModal } from './SLReauthModal';
export { default as SLAccountLinkingModal } from './SLAccountLinkingModal';expo
rt { default as SLAccountDeletionFlow } from './SLAccountDeletionFlow';// N
avigation and Error Handling Components
export { default as AuthGuard, withAuthGuard, useAuthGuard } from './AuthGuard';
export { default as AuthProvider, ProtectedRoute, PublicRoute } from './AuthProvider';
export { default as ErrorBoundary, withErrorBoundary, useErrorHandler } from './ErrorBoundary';//
 Monitoring Components\nexport { default as SLAuthMonitoringDashboard } from './SLAuthMonitoringDashboard';