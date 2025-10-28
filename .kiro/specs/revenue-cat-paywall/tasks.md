# Implementation Plan

- [ ] 1. Set up RevenueCat SDK and core infrastructure
  - Install and configure RevenueCat SDK for React Native
  - Create environment-specific configuration files for development, staging, and production
  - Set up TypeScript interfaces for subscription types and entitlements
  - _Requirements: 16.1, 16.2, 16.3_

- [ ] 1.1 Configure RevenueCat SDK integration
  - Initialize RevenueCat SDK with API keys in app initialization
  - Implement user identification when authentication state changes
  - Create configuration manager for environment-specific settings
  - _Requirements: 16.1, 16.2_

- [ ] 1.2 Create core subscription type definitions
  - Define TypeScript interfaces for SubscriptionTier, Entitlements, and CustomerInfo
  - Create enums for subscription states and error types
  - Implement data models for analytics events and paywall variants
  - _Requirements: 11.1, 14.1, 14.2_

- [ ] 1.3 Write unit tests for configuration and types
  - Test environment configuration loading and validation
  - Verify TypeScript type definitions and enums
  - Test SDK initialization with different configurations
  - _Requirements: 16.5_

- [ ] 2. Implement EntitlementManager service
  - Create central service for managing subscription state and feature access
  - Implement caching mechanism for offline entitlement access
  - Add entitlement refresh logic for app launch and resume
  - _Requirements: 3.3, 3.4, 3.5, 6.5_

- [ ] 2.1 Build core entitlement checking logic
  - Implement hasEntitlement method with feature-to-entitlement mapping
  - Create getCurrentTier method to determine active subscription level
  - Add trial status checking with isTrialActive and getTrialTimeRemaining methods
  - _Requirements: 3.1, 3.2, 11.1, 11.2_

- [ ] 2.2 Implement entitlement caching and offline support
  - Create EntitlementCacheManager with TTL-based caching
  - Implement offline mode that respects previously verified entitlements
  - Add background refresh mechanism for entitlement updates
  - _Requirements: 3.5, 6.5, 15.1, 15.3_

- [ ] 2.3 Add entitlement change event handling
  - Implement event listener system for entitlement updates
  - Create subscription to RevenueCat customer info changes
  - Add immediate feature access updates when subscription status changes
  - _Requirements: 3.4, 8.1, 8.2_

- [ ] 2.4 Write unit tests for EntitlementManager
  - Test entitlement checking for different subscription tiers
  - Verify caching behavior and offline functionality
  - Test event handling and subscription state changes
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 3. Create SubscriptionService wrapper
  - Build service layer wrapping RevenueCat SDK with app-specific logic
  - Implement purchase flow handling with proper error management
  - Add trial eligibility checking and subscriber attribute management
  - _Requirements: 1.1, 1.5, 7.1, 7.2, 7.3_

- [ ] 3.1 Implement core RevenueCat operations
  - Create methods for getOfferings, purchasePackage, and restorePurchases
  - Add customer info retrieval and subscription state checking
  - Implement user identification and subscriber attribute management
  - _Requirements: 2.4, 4.2, 4.3, 7.4, 7.5_

- [ ] 3.2 Add trial eligibility and management
  - Implement checkTrialEligibility using RevenueCat subscriber attributes
  - Create trial activation logic with 7-day period setup
  - Add trial status tracking and expiration handling
  - _Requirements: 1.1, 1.2, 7.1, 7.2, 7.3_

- [ ] 3.3 Implement purchase flow error handling
  - Add comprehensive error handling for all purchase scenarios
  - Create retry mechanisms for network failures
  - Implement graceful handling of user cancellations and payment failures
  - _Requirements: 6.1, 6.2, 6.3, 15.1, 15.2, 15.4_

- [ ] 3.4 Write unit tests for SubscriptionService
  - Test purchase flow with various success and error scenarios
  - Verify trial eligibility checking and activation
  - Test error handling and retry mechanisms
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [ ] 4. Build FeatureGateSystem for premium feature access
  - Create system to control access to premium features based on entitlements
  - Implement React components for feature gating and premium banners
  - Add analytics tracking for blocked feature interactions
  - _Requirements: 11.4, 17.1, 17.3, 17.4_

- [ ] 4.1 Create feature gating components
  - Build FeatureGate component that conditionally renders based on entitlements
  - Implement PremiumFeatureBanner for upgrade prompts
  - Create LockedFeatureOverlay for blocked premium features
  - _Requirements: 11.4, 17.2, 17.4_

- [ ] 4.2 Implement server-driven feature mapping
  - Create feature-to-entitlement mapping system with remote configuration
  - Add A/B testing support for feature flags
  - Implement caching and refresh logic for feature mappings
  - _Requirements: 11.1, 11.2, 11.3, 11.5_

- [ ] 4.3 Add blocked feature analytics tracking
  - Implement blocked_feature_viewed event logging with feature keys
  - Add paywall attribution tracking for different feature gates
  - Create funnel analysis events for premium feature interactions
  - _Requirements: 11.4, 17.3, 17.5_

- [ ] 4.4 Write unit tests for FeatureGateSystem
  - Test feature gating logic with different entitlement combinations
  - Verify analytics event tracking for blocked features
  - Test server-driven feature mapping updates
  - _Requirements: 11.1, 11.4, 17.3_

- [ ] 5. Develop PaywallController and UI components
  - Create controller for paywall presentation logic and user flows
  - Build responsive paywall UI with subscription options and feature comparison
  - Implement A/B testing variants for paywall optimization
  - _Requirements: 2.1, 2.2, 2.3, 12.1, 12.2, 12.3_

- [ ] 5.1 Build PaywallController service
  - Implement showPaywall method with source tracking and context handling
  - Create purchase flow orchestration with analytics tracking
  - Add paywall variant selection based on A/B testing configuration
  - _Requirements: 12.3, 12.4, 17.1, 17.3, 17.5_

- [ ] 5.2 Create PaywallScreen UI component
  - Build main paywall screen with header, content, and subscription options
  - Implement responsive design for different screen sizes
  - Add loading states and purchase flow feedback
  - _Requirements: 2.1, 2.2, 2.3, 12.1, 12.2_

- [ ] 5.3 Implement subscription option components
  - Create TrialOption component with eligibility checking
  - Build ProTierOption and EliteTierOption with feature highlighting
  - Add promotional offer rendering and pricing display
  - _Requirements: 2.2, 9.1, 9.2, 9.3, 12.1_

- [ ] 5.4 Add paywall footer and compliance elements
  - Implement RestorePurchasesButton as required by Apple App Store
  - Add terms of service, privacy policy, and EULA links
  - Create pricing disclaimer and country-specific tax information
  - _Requirements: 13.1, 13.2, 13.3, 13.5_

- [ ] 5.5 Write unit tests for PaywallController and components
  - Test paywall presentation logic with different sources and contexts
  - Verify A/B testing variant selection and analytics tracking
  - Test subscription option rendering and purchase flow initiation
  - _Requirements: 12.3, 12.4, 17.1, 17.3_

- [ ] 6. Implement promotional offers and pricing logic
  - Add support for intro prices, promotional offers, and offer codes
  - Create automatic offer eligibility checking and rendering
  - Implement promotional analytics tracking with RevenueCat transaction IDs
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ] 6.1 Build promotional offer system
  - Implement offer eligibility checking using RevenueCat offerings
  - Create automatic best offer selection for paywall rendering
  - Add offer code redemption flow integration
  - _Requirements: 9.1, 9.2, 9.3_

- [ ] 6.2 Add promotional offer UI components
  - Create PromotionalOfferBadge for highlighting discounts
  - Implement IntroOfferDisplay with pricing and duration
  - Add OfferCodeInput component for manual code entry
  - _Requirements: 9.2, 12.1, 12.2_

- [ ] 6.3 Implement promotional analytics tracking
  - Add promo_viewed, promo_redeemed, and promo_ineligible event logging
  - Include RevenueCat transaction IDs in promotional event data
  - Create promotional offer funnel analysis tracking
  - _Requirements: 9.4, 9.5, 14.1, 14.2_

- [ ] 6.4 Write unit tests for promotional offer system
  - Test offer eligibility checking and automatic selection
  - Verify promotional analytics event tracking
  - Test offer code redemption flow
  - _Requirements: 9.1, 9.2, 9.4, 9.5_

- [ ] 7. Add subscription management and billing edge cases
  - Implement grace period handling and billing retry notifications
  - Add support for paused subscriptions and price change consent
  - Create subscription management UI in app settings
  - _Requirements: 5.1, 5.2, 5.3, 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 7.1 Handle billing edge cases
  - Implement grace period detection with continued entitlement access
  - Add billing retry notification UI for payment issues
  - Create paused subscription handling with reactivation prompts
  - _Requirements: 8.1, 8.2, 8.3_

- [ ] 7.2 Add price change consent handling
  - Implement Apple App Store price increase consent detection
  - Create consent banner UI with App Store redirect
  - Add feature locking for pending price consent
  - _Requirements: 8.4, 8.5_

- [ ] 7.3 Build subscription management interface
  - Create subscription status display in app settings
  - Add platform-specific subscription management redirects
  - Implement subscription cancellation handling with access retention
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 7.4 Write unit tests for subscription management
  - Test grace period and billing retry handling
  - Verify price change consent flow
  - Test subscription management UI and redirects
  - _Requirements: 5.1, 5.2, 8.1, 8.2, 8.4_

- [ ] 8. Implement analytics and revenue tracking
  - Create comprehensive subscription funnel analytics
  - Set up RevenueCat webhook integration with Cloud Functions
  - Add revenue event tracking to Firestore for business intelligence
  - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_

- [ ] 8.1 Build subscription analytics service
  - Implement all required subscription events (paywall_shown, purchase_completed, etc.)
  - Add trial countdown UI with trial_countdown_seen event tracking
  - Create contextual analytics with paywall source attribution
  - _Requirements: 14.1, 14.2, 14.5, 17.3, 17.5_

- [ ] 8.2 Set up RevenueCat webhook integration
  - Create Cloud Function to receive RevenueCat webhook events
  - Implement canonical purchase event processing and storage
  - Add entitlement state, product ID, pricing, and country data to Firestore
  - _Requirements: 14.3, 14.4_

- [ ] 8.3 Create revenue analytics dashboard data
  - Implement MRR, ARPU, and LTV calculation logic
  - Add churn rate and retention metrics tracking
  - Create premium feature usage analytics by subscription tier
  - _Requirements: 14.3, 14.4_

- [ ] 8.4 Write unit tests for analytics service
  - Test subscription event tracking with proper attribution
  - Verify webhook event processing and data storage
  - Test revenue metrics calculation accuracy
  - _Requirements: 14.1, 14.2, 14.3, 14.4_

- [ ] 9. Add family and organizational plan support
  - Implement family_member and org_member entitlement handling
  - Create entitlement precedence system (org > family > individual)
  - Add organizational coverage UI and individual plan migration
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ] 9.1 Build organizational entitlement system
  - Add family_member and org_member entitlement keys to EntitlementManager
  - Implement entitlement precedence logic (org_member > family_member > individual)
  - Create organizational coverage detection and display
  - _Requirements: 10.1, 10.2, 10.3, 10.4_

- [ ] 9.2 Create organizational coverage UI
  - Implement "Covered by Organization/Family" paywall override
  - Add individual plan cancellation suggestions when org coverage activates
  - Create organizational plan management interface
  - _Requirements: 10.2, 10.3, 10.5_

- [ ] 9.3 Add organizational plan feature flagging
  - Implement feature flags for family and organizational plan visibility
  - Create gradual rollout system for organizational features
  - Add organizational plan analytics tracking
  - _Requirements: 16.4_

- [ ] 9.4 Write unit tests for organizational plans
  - Test entitlement precedence logic with multiple active entitlements
  - Verify organizational coverage UI and individual plan migration
  - Test feature flagging for organizational plan visibility
  - _Requirements: 10.1, 10.2, 10.4, 16.4_

- [ ] 10. Implement localization and accessibility
  - Add multi-language support for paywall UI and subscription strings
  - Implement accessibility features for screen readers and keyboard navigation
  - Create currency and pricing localization for international markets
  - _Requirements: 12.5, 13.5_

- [ ] 10.1 Build localization system
  - Create PaywallStrings interface with all subscription-related text
  - Implement locale-aware pricing and currency formatting
  - Add fallback to English for unsupported locales
  - _Requirements: 12.5, 13.5_

- [ ] 10.2 Add accessibility support
  - Implement screen reader support for all paywall components
  - Add keyboard navigation for subscription option selection
  - Create high contrast mode support for paywall UI
  - _Requirements: Accessibility best practices_

- [ ] 10.3 Create international pricing support
  - Implement country-specific pricing display using store strings
  - Add tax information display without custom tax calculations
  - Create currency conversion and formatting utilities
  - _Requirements: 13.5_

- [ ] 10.4 Write unit tests for localization and accessibility
  - Test multi-language string rendering and fallbacks
  - Verify accessibility features and screen reader compatibility
  - Test international pricing and currency formatting
  - _Requirements: 12.5, 13.5_

- [ ] 11. Integration testing and end-to-end flows
  - Create comprehensive integration tests for subscription flows
  - Implement end-to-end testing for trial activation, purchase, and restoration
  - Add error scenario testing for network failures and edge cases
  - _Requirements: All requirements validation_

- [ ] 11.1 Build subscription flow integration tests
  - Test complete new user trial activation flow
  - Verify purchase flow from paywall to feature unlock
  - Test purchase restoration on app reinstall
  - _Requirements: 1.1, 1.2, 2.4, 4.2, 4.3_

- [ ] 11.2 Create error scenario testing
  - Test network failure handling with retry mechanisms
  - Verify graceful handling of cancelled purchases and payment failures
  - Test offline mode functionality with cached entitlements
  - _Requirements: 6.1, 6.2, 15.1, 15.2, 15.3_

- [ ] 11.3 Add RevenueCat webhook testing
  - Test webhook event processing with mock RevenueCat events
  - Verify entitlement synchronization between app and backend
  - Test analytics data accuracy with webhook integration
  - _Requirements: 14.3, 14.4_

- [ ] 11.4 Write comprehensive test suite
  - Create unit tests for all subscription services and components
  - Add integration tests for complete subscription workflows
  - Implement performance tests for entitlement checking and caching
  - _Requirements: 16.5_