# Authentication Implementation Plan

- [x] 1. Set up Firebase Auth configuration and core infrastructure
  - Configure Firebase Auth in the Expo app with Apple, Google, and Email providers
  - Set up Firebase project configuration files and environment variables
  - Install and configure required dependencies (Firebase SDK, expo-auth-session, etc.)
  - _Requirements: 1.1, 2.1, 3.1, 4.1_

- [x] 2. Create core authentication types and interfaces
  - Define TypeScript interfaces for User, AuthState, AuthProvider, and AuthService
  - Create error handling types and AuthErrorCode enum
  - Set up security event and audit logging type definitions
  - _Requirements: 8.1, 8.2, 8.3, 13.4_

- [x] 3. Implement authentication service layer
  - [x] 3.1 Create AuthService class with Firebase Auth integration
    - Implement signInWithEmail, createUserWithEmail, and signOut methods
    - Add getCurrentUser and session validation methods
    - Handle Firebase Auth state changes and error mapping
    - _Requirements: 3.1, 3.2, 4.1, 4.2, 5.1, 6.1_

  - [x] 3.2 Add Apple Sign-In integration
    - Implement signInWithApple method using expo-auth-session
    - Handle Apple ID token validation and nonce verification
    - Map Apple-specific errors to user-friendly messages
    - _Requirements: 1.1, 1.2, 1.3, 13.1_

  - [x] 3.3 Add Google Sign-In integration
    - Implement signInWithGoogle method with proper scope configuration
    - Handle Google OAuth flow and token validation
    - Map Google-specific errors to user-friendly messages
    - _Requirements: 2.1, 2.2, 2.3, 13.2_

- [x] 4. Create authentication state management with Zustand
  - [x] 4.1 Implement auth store with user state and loading states
    - Create Zustand store for authentication state management
    - Add actions for sign-in, sign-out, and state updates
    - Implement session persistence using secure storage
    - _Requirements: 5.1, 5.2, 5.3, 12.5_

  - [x] 4.2 Add session management and persistence
    - Implement secure token storage using expo-secure-store
    - Add session validation and automatic refresh logic
    - Handle multi-device session management
    - _Requirements: 5.4, 12.1, 12.2, 12.3_

- [x] 5. Build core UI components for authentication
  - [x] 5.1 Create base form components (SLTextField, SLButton, SLFormHint)
    - Implement SLTextField with validation, error states, and accessibility
    - Create SLButton with variants (primary, secondary, ghost) and loading states
    - Add SLFormHint for inline validation feedback
    - _Requirements: 15.3, 15.4_

  - [x] 5.2 Create provider-specific components (SLProviderButton)
    - Implement Apple Sign-In button with proper branding and accessibility
    - Create Google Sign-In button following brand guidelines
    - Add loading states and disabled states for both providers
    - _Requirements: 1.4, 2.4, 15.3, 15.4_

  - [x] 5.3 Create feedback components (SLToast, SLDividerLabelled)
    - Implement toast notification system for success/error messages
    - Create labeled divider component for form sections
    - Add proper accessibility labels and screen reader support
    - _Requirements: 8.2, 8.4, 15.3_

- [ ] 6. Implement authentication screens
  - [x] 6.1 Create Sign In screen with email/password and social providers
    - Build main sign-in screen layout with proper spacing and typography
    - Integrate email/password form with validation
    - Add Apple and Google sign-in buttons with proper handlers
    - Implement error display and loading states
    - _Requirements: 1.1, 2.1, 4.1, 8.1, 8.2_

  - [x] 6.2 Create Sign Up screen with email registration
    - Build account creation form with email, password, and confirmation fields
    - Add password strength meter and validation checklist
    - Implement terms and privacy consent checkbox
    - Add form validation and error handling
    - _Requirements: 3.1, 3.2, 3.4, 14.1_

  - [x] 6.3 Create Forgot Password screen
    - Build password reset form with email input
    - Implement reset email sending with rate limiting UI
    - Add success feedback and resend functionality
    - Handle various error states (user not found, network issues)
    - _Requirements: 4.4, 9.4_

  - [x] 6.4 Create Email Verification screen
    - Build verification prompt screen with email display
    - Add resend verification email functionality with throttling
    - Implement verification status polling
    - Add navigation to email app and change email options
    - _Requirements: 9.1, 9.2, 9.3_

- [x] 7. Implement security features
  - [x] 7.1 Add rate limiting for authentication attempts
    - Create rate limiter service for failed sign-in attempts
    - Implement IP-based and device-based rate limiting
    - Add countdown UI for rate-limited users
    - Store rate limit data securely on device
    - _Requirements: 7.1, 7.2, 7.5_

  - [x] 7.2 Implement audit logging for security events
    - Create security event logging service
    - Log authentication attempts, failures, and suspicious activity
    - Implement local event storage and batch upload to Firebase
    - Add event types for different security scenarios
    - _Requirements: 7.4, 13.4_

  - [x] 7.3 Add bot protection integration
    - Integrate reCAPTCHA for web-based flows
    - Add DeviceCheck integration for iOS
    - Implement SafetyNet integration for Android
    - Handle bot protection challenges in UI
    - _Requirements: 13.3_

- [x] 8. Add advanced authentication features
  - [x] 8.1 Implement account linking functionality
    - Create account linking flow for multiple providers
    - Handle duplicate email detection and merging
    - Add Apple Private Relay email handling
    - Implement re-authentication for account linking
    - _Requirements: 10.1, 10.2, 10.3_

  - [x] 8.2 Add re-authentication for sensitive actions
    - Create re-authentication modal component
    - Implement recent login validation (5-minute window)
    - Add provider-specific re-auth flows
    - Integrate with sensitive action workflows
    - _Requirements: 11.1, 11.2, 11.3, 11.4_

  - [x] 8.3 Implement multi-device session management
    - Create device registration and tracking system
    - Add "Sign out all devices" functionality
    - Implement active device list in user settings
    - Handle concurrent session limits
    - _Requirements: 12.1, 12.2, 12.3_

- [ ] 9. Add compliance and legal features
  - [x] 9.1 Implement consent management system
    - Create consent tracking for Terms of Service and Privacy Policy
    - Add version control for legal documents
    - Implement consent UI with proper accessibility
    - Store consent data with timestamps in user profile
    - _Requirements: 14.1, 14.3_

  - [x] 9.2 Add age verification and parental consent
    - Create age verification flow during registration
    - Implement parental consent requirements for minors
    - Add region-specific age gate logic (COPPA, GDPR-K)
    - Handle account activation pending parental consent
    - _Requirements: 14.2, 14.4, 14.5_

  - [ ] 9.3 Implement account deletion and data export
    - Create account deletion flow with re-authentication
    - Add data export functionality (JSON format)
    - Implement async data purge job integration
    - Show deletion progress and completion status
    - _Requirements: 16.1, 16.2, 16.3, 16.4_

- [ ] 10. Create navigation and routing integration
  - [ ] 10.1 Implement authentication route guards
    - Create AuthGuard component for protected routes
    - Add authentication state checking and loading states
    - Implement automatic routing based on auth state
    - Handle deep links and redirect flows
    - _Requirements: 5.3, 5.4, 12.4, 15.5_

  - [ ] 10.2 Set up authentication navigation flow
    - Configure Expo Router for authentication screens
    - Implement navigation between auth screens
    - Add proper back button handling and navigation stack
    - Handle authentication success navigation to main app
    - _Requirements: 1.5, 2.5, 3.5, 4.5_

- [ ] 11. Add error handling and user feedback
  - [ ] 11.1 Implement comprehensive error mapping
    - Map all Firebase Auth error codes to user-friendly messages
    - Add localization support for error messages
    - Implement error recovery suggestions and actions
    - Create error boundary for authentication flows
    - _Requirements: 8.2, 8.3, 15.2_

  - [ ] 11.2 Add analytics and monitoring integration
    - Implement authentication event tracking
    - Add performance monitoring for auth flows
    - Create success/failure rate tracking
    - Add security event monitoring and alerting
    - _Requirements: 15.1, 13.4_

- [ ] 12. Write comprehensive tests for authentication system
  - [ ] 12.1 Create unit tests for authentication service
    - Test all AuthService methods with mocked Firebase responses
    - Test error handling and edge cases
    - Test rate limiting logic and session management
    - _Requirements: All core authentication requirements_

  - [ ] 12.2 Create integration tests for authentication flows
    - Test complete sign-in flows with test accounts
    - Test provider linking and account merging
    - Test session persistence across app restarts
    - _Requirements: 1.1-1.5, 2.1-2.5, 3.1-3.5, 4.1-4.5_

  - [ ] 12.3 Create UI component tests
    - Test all authentication screen components
    - Test form validation and error display
    - Test accessibility compliance and screen reader support
    - _Requirements: 15.3, 15.4_

- [ ] 13. Polish and accessibility improvements
  - [ ] 13.1 Implement micro-interactions and animations
    - Add button press animations and loading states
    - Implement screen transition animations
    - Add success feedback animations and micro-interactions
    - Create form validation shake animations for errors
    - _Requirements: 15.4_

  - [ ] 13.2 Ensure full accessibility compliance
    - Verify all components meet WCAG AA standards
    - Test with VoiceOver and TalkBack screen readers
    - Ensure proper focus management and keyboard navigation
    - Add semantic labels and accessibility hints
    - _Requirements: 15.3, 15.4_

  - [ ] 13.3 Add final performance optimizations
    - Optimize bundle size and lazy load authentication screens
    - Implement proper loading states and skeleton screens
    - Add offline handling for cached authentication state
    - Optimize Firebase Auth initialization and token refresh
    - _Requirements: 5.1, 12.4_
-
 [ ] 14. Platform and console setup (pre-flight configuration)
  - [ ] 14.1 Configure Apple Developer Console for Sign in with Apple
    - Set up App ID with Sign in with Apple capability enabled
    - Create Services ID for web authentication flows
    - Configure Associated Domains for universal links (applinks:)
    - Generate and configure Sign in with Apple keys
    - Document Apple Private Relay email handling requirements
    - _Requirements: 1.1, 1.4, 13.1_

  - [ ] 14.2 Configure Google Cloud Console for OAuth
    - Set up OAuth consent screen with proper branding and privacy policy
    - Create iOS, Android, and Web client IDs for different platforms
    - Configure OAuth scopes (email, profile) and test user access
    - Set up authorized redirect URIs for all environments
    - _Requirements: 2.1, 2.4, 13.2_

  - [ ] 14.3 Configure Firebase project settings
    - Set up separate Firebase projects for dev, staging, and production
    - Add iOS, Android, and Web apps with proper bundle IDs
    - Configure SHA-256 fingerprints for Android apps
    - Set up Dynamic Links domain for email verification links
    - _Requirements: 9.1, 15.5_

  - [ ] 14.4 Prepare RevenueCat integration for future subscriptions
    - Map sandbox test users to Firebase UIDs for testing
    - Configure webhook endpoints for subscription events
    - Set up entitlement mapping for premium features
    - _Requirements: Future subscription requirements_

- [ ] 15. Deep links and email templates implementation
  - [ ] 15.1 Implement universal links and app links
    - Configure universal links for email verification flows
    - Set up app links for password reset redirects
    - Handle post-SSO redirect deep links properly
    - Add proper link validation and security checks
    - _Requirements: 9.1, 9.4, 15.5_

  - [ ] 15.2 Create transactional email templates
    - Design and implement email verification templates
    - Create password reset email templates with branding
    - Add welcome email template for new users
    - Implement localization keys for multi-language support
    - _Requirements: 9.1, 9.4, 15.2_

  - [ ] 15.3 Add "Open Mail" deep-link helpers
    - Implement iOS mailto: deep-link functionality
    - Add Gmail and Outlook app deep-link fallbacks
    - Create smart mail app detection and routing
    - Handle cases where no mail app is installed
    - _Requirements: 9.1_

  - [ ] 15.4 Implement resend throttling UX
    - Create countdown UI component for resend limitations
    - Wire countdown to backend timestamp validation
    - Add visual feedback for throttling states
    - Implement proper error handling for throttled requests
    - _Requirements: 9.2, 9.3_

- [ ] 16. Environment management and feature flags
  - [ ] 16.1 Set up environment matrix configuration
    - Configure separate environments: dev, staging, production
    - Set up different Firebase projects and bundle IDs per environment
    - Configure separate OAuth client IDs for each environment
    - Document environment-specific configuration requirements
    - _Requirements: All requirements across environments_

  - [ ] 16.2 Implement secrets management system
    - Create .env files for each environment with proper secrets
    - Set up CI/CD masked variables for sensitive data
    - Ensure no secrets are hardcoded in source code
    - Implement runtime secret validation and error handling
    - _Requirements: 13.1, 13.2, 13.3_

  - [ ] 16.3 Add feature flags for authentication features
    - Implement auth.magicLink feature flag for future magic link sign-in
    - Add auth.reauthModal flag for re-authentication modal
    - Create auth.deviceList flag for device management features
    - Make flags togglable at runtime without app updates
    - _Requirements: 11.1, 12.1_

  - [ ] 16.4 Implement storage key versioning and migration
    - Create versioned secure storage keys for authentication data
    - Implement migration plan from schema v1 to v2
    - Add backward compatibility for existing user sessions
    - Handle storage corruption and recovery scenarios
    - _Requirements: 5.1, 12.4_

- [ ] 17. Monitoring, alerts, and incident response
  - [ ] 17.1 Implement comprehensive analytics schema
    - Add auth_start event tracking for authentication attempts
    - Track auth_success and auth_error events with error codes
    - Implement rate_limited and reauth_required event logging
    - Create user journey funnel tracking for conversion analysis
    - _Requirements: 15.1, 13.4_

  - [ ] 17.2 Set up crash and performance monitoring
    - Configure Firebase Crashlytics for authentication screens
    - Add Firebase Performance monitoring for screen loads
    - Track SSO provider latency and error rates
    - Monitor authentication success rates and failure patterns
    - _Requirements: 15.1_

  - [ ] 17.3 Configure alerting and incident response
    - Set up threshold alerts for authentication failure spikes
    - Create on-call escalation documentation and procedures
    - Configure Slack webhook notifications for critical issues
    - Implement automated incident detection and response
    - _Requirements: 13.4_

  - [ ] 17.4 Implement security audit log export
    - Create daily security audit log export job
    - Set up automated export to cloud storage bucket
    - Configure BigQuery integration for log retention and analysis
    - Implement compliance reporting and audit trail maintenance
    - _Requirements: 7.4, 13.4_

- [ ] 18. QA playbooks and end-to-end testing
  - [ ] 18.1 Create comprehensive test accounts matrix
    - Set up email test accounts (verified and unverified states)
    - Create Apple test accounts (relay and non-relay emails)
    - Configure Google test accounts for various scenarios
    - Add minor/parental consent edge case test accounts
    - _Requirements: 9.1, 10.2, 14.2_

  - [ ] 18.2 Implement end-to-end test automation
    - Create Detox/Playwright test suite for sign-up→verify→login flow
    - Add automated tests for forgot password functionality
    - Test rate limiting scenarios and recovery flows
    - Implement provider linking test automation
    - _Requirements: All authentication flow requirements_

  - [ ] 18.3 Conduct accessibility audits and testing
    - Create VoiceOver and TalkBack testing scripts
    - Test focus order and keyboard navigation flows
    - Verify keyboard submit functionality across all forms
    - Validate screen reader announcements and labels
    - _Requirements: 15.3, 15.4_

  - [ ] 18.4 Complete design QA checklist validation
    - Verify brand-accurate SSO button implementations
    - Test AA contrast compliance across all screens
    - Validate loading and disabled state visual feedback
    - Ensure consistent typography and spacing implementation
    - _Requirements: 15.2, 15.3, 15.4_