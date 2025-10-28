/**
 * Hooks Index
 * 
 * Central export point for all custom hooks
 */

// Authentication Hooks
export { default as useAuthNavigation } from './useAuthNavigation';
export type { UseAuthNavigationReturn } from './useAuthNavigation';

export { default as useAuthMonitoring, useAuthFlowTracking, useAuthHealthMonitoring } from './useAuthMonitoring';
export type { UseAuthMonitoringOptions, AuthMonitoringState, AuthMonitoringActions } from './useAuthMonitoring';

// Onboarding Hooks
export { useGuardianConsent } from './onboarding/useGuardianConsent';
export type { GuardianConsentState } from './onboarding/useGuardianConsent';