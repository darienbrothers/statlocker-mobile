# Requirements Document

## Introduction

This feature implements RevenueCat integration for StatLocker's subscription model, providing a 7-day free trial with Pro ($9.99/mo) and Elite ($19.99/mo) tiers. The system will gate premium features, handle purchase restoration, and present a polished paywall experience for converting trial users to paid subscribers.

## Glossary

- **StatLocker_App**: The mobile application built with React Native and Expo
- **RevenueCat_SDK**: Third-party subscription management service and SDK
- **Paywall_Screen**: User interface for subscription purchase and trial activation
- **Entitlement_System**: RevenueCat's feature access control mechanism
- **Trial_Period**: 7-day free access to premium features for new users
- **Pro_Tier**: $9.99/month subscription with full tracking and AI insights
- **Elite_Tier**: $19.99/month subscription with advanced analytics and unlimited AI summaries
- **Premium_Features**: Features requiring active subscription (AI insights, advanced analytics, unlimited summaries)
- **Purchase_Restoration**: Process to restore previously purchased subscriptions on new device installations

## Requirements

### Requirement 1

**User Story:** As a new athlete, I want to start a 7-day free trial so that I can experience premium features before committing to a subscription.

#### Acceptance Criteria

1. WHEN a new user completes onboarding, THE StatLocker_App SHALL automatically activate a 7-day Trial_Period
2. WHILE the Trial_Period is active, THE StatLocker_App SHALL provide full access to Premium_Features
3. WHEN the Trial_Period expires, THE StatLocker_App SHALL display the Paywall_Screen
4. THE StatLocker_App SHALL display trial countdown in user interface during Trial_Period
5. WHEN trial activation occurs, THE RevenueCat_SDK SHALL record the trial start date and expiration

### Requirement 2

**User Story:** As an athlete using the free version, I want to see a paywall when accessing premium features so that I understand what subscription benefits are available.

#### Acceptance Criteria

1. WHEN a user without active subscription attempts to access Premium_Features, THE StatLocker_App SHALL display the Paywall_Screen
2. THE Paywall_Screen SHALL display Pro_Tier and Elite_Tier subscription options with pricing
3. THE Paywall_Screen SHALL highlight feature differences between subscription tiers
4. WHEN a user selects a subscription tier, THE RevenueCat_SDK SHALL initiate the purchase flow
5. THE Paywall_Screen SHALL include terms of service and privacy policy links

### Requirement 3

**User Story:** As a paying subscriber, I want my premium features to work seamlessly so that I can access all functionality I've paid for.

#### Acceptance Criteria

1. WHEN a user has an active Pro_Tier subscription, THE Entitlement_System SHALL grant access to full tracking and AI insights
2. WHEN a user has an active Elite_Tier subscription, THE Entitlement_System SHALL grant access to advanced analytics and unlimited AI summaries
3. THE StatLocker_App SHALL check subscription status on app launch and resume
4. WHEN subscription status changes, THE StatLocker_App SHALL update feature access immediately
5. THE StatLocker_App SHALL cache entitlement status for offline access

### Requirement 4

**User Story:** As a user who reinstalls the app, I want to restore my previous purchases so that I don't lose access to features I've already paid for.

#### Acceptance Criteria

1. THE StatLocker_App SHALL provide a restore purchases option in settings
2. WHEN restore purchases is triggered, THE RevenueCat_SDK SHALL query Apple App Store and Google Play Store for previous purchases
3. WHEN previous purchases are found, THE Entitlement_System SHALL reactivate appropriate subscription tier
4. THE StatLocker_App SHALL display confirmation message when purchases are successfully restored
5. IF no previous purchases exist, THE StatLocker_App SHALL display appropriate message to user

### Requirement 5

**User Story:** As a user managing my subscription, I want to access subscription management options so that I can modify or cancel my subscription as needed.

#### Acceptance Criteria

1. THE StatLocker_App SHALL provide subscription management access in user settings
2. WHEN subscription management is accessed, THE StatLocker_App SHALL redirect to platform-specific subscription management
3. THE StatLocker_App SHALL display current subscription status and renewal date
4. WHEN subscription is cancelled, THE Entitlement_System SHALL maintain access until expiration date
5. THE StatLocker_App SHALL handle subscription renewal notifications from RevenueCat_SDK

### Requirement 6

**User Story:** As a developer, I want proper error handling for subscription flows so that users receive clear feedback when issues occur.

#### Acceptance Criteria

1. WHEN purchase fails due to network issues, THE StatLocker_App SHALL display retry option with clear error message
2. WHEN purchase is cancelled by user, THE StatLocker_App SHALL return to previous screen without error
3. WHEN RevenueCat_SDK encounters errors, THE StatLocker_App SHALL log errors and display user-friendly messages
4. THE StatLocker_App SHALL handle subscription verification failures gracefully
5. WHEN App Store or Google Play Store is unavailable, THE StatLocker_App SHALL provide offline access to previously verified entitlements

### Requirement 7

**User Story:** As a business, I want the free trial granted only once per real user to prevent abuse.

#### Acceptance Criteria

1. THE StatLocker_App SHALL check RevenueCat_SDK subscriber attributes to determine prior trial eligibility
2. WHEN user is ineligible for trial, THE StatLocker_App SHALL hide free trial copy and show purchase options
3. WHEN Apple App Store or Google Play Store reports past trial for same account, THE StatLocker_App SHALL show paid options directly
4. THE RevenueCat_SDK SHALL store trial eligibility flag in subscriber attributes
5. THE StatLocker_App SHALL mirror trial eligibility data in Firestore for analytics

### Requirement 8

**User Story:** As a subscriber, I want service continuity during billing hiccups and transparency on price changes.

#### Acceptance Criteria

1. WHEN store enters grace period, THE Entitlement_System SHALL maintain active entitlements
2. WHILE in grace period, THE StatLocker_App SHALL display payment retry notification
3. WHEN subscription is paused on Google Play Store, THE StatLocker_App SHALL downgrade access and show reactivation option
4. WHEN Apple App Store price increase consent is pending, THE StatLocker_App SHALL lock new features and show consent banner
5. THE StatLocker_App SHALL direct users to App Store for price increase review

### Requirement 9

**User Story:** As marketing, I want intro prices and win-back discounts through promotional offers.

#### Acceptance Criteria

1. THE RevenueCat_SDK SHALL support intro prices, promotional offers, and offer codes via offerings
2. THE Paywall_Screen SHALL automatically render the best eligible offer for each user
3. THE Paywall_Screen SHALL hide ineligible promotional offers
4. THE StatLocker_App SHALL log promotional events with RevenueCat_SDK transaction identifiers
5. THE StatLocker_App SHALL track promo_viewed, promo_redeemed, and promo_ineligible events

### Requirement 10

**User Story:** As a user, I want my access to switch if my family, club, or school covers me.

#### Acceptance Criteria

1. THE Entitlement_System SHALL support pro, elite, family_member, and org_member entitlement keys
2. WHEN org_member or family_member entitlement is active, THE StatLocker_App SHALL override personal plan paywall
3. THE StatLocker_App SHALL display coverage source as "Covered by Organization" or "Covered by Family"
4. THE Entitlement_System SHALL apply precedence order: org_member > family_member > individual
5. WHEN organizational coverage activates, THE StatLocker_App SHALL suggest canceling individual plan

### Requirement 11

**User Story:** As product, I want features to light up via entitlements without app releases.

#### Acceptance Criteria

1. THE StatLocker_App SHALL maintain server-driven feature-to-entitlement mapping
2. THE StatLocker_App SHALL refresh entitlement mapping on app start and resume
3. THE StatLocker_App SHALL cache entitlement mapping for offline access
4. THE StatLocker_App SHALL emit blocked_feature_viewed events with feature keys for funnel analysis
5. THE Entitlement_System SHALL support A/B testing flags in feature mapping

### Requirement 12

**User Story:** As a product manager, I want to iterate on paywall copy and pricing through A/B tests.

#### Acceptance Criteria

1. THE Paywall_Screen SHALL pull offerings and packages from RevenueCat_SDK
2. THE Paywall_Screen SHALL render locale-aware pricing, periods, and trial badges
3. THE StatLocker_App SHALL support A/B variants for paywall layout and copy
4. THE StatLocker_App SHALL log experiment identifiers in paywall analytics events
5. THE Paywall_Screen SHALL localize currency, dates, and legal strings with English fallback

### Requirement 13

**User Story:** As a store-compliant app, I must meet platform requirements for subscription apps.

#### Acceptance Criteria

1. THE Paywall_Screen SHALL include restore purchases button as required by Apple App Store
2. THE StatLocker_App SHALL provide restore purchases option in settings
3. THE Paywall_Screen SHALL display terms of service, privacy policy, and EULA links
4. THE StatLocker_App SHALL log consent version on first purchase
5. THE Paywall_Screen SHALL show country-specific pricing and taxes via store strings

### Requirement 14

**User Story:** As analytics, I need clean funnel data and revenue tracking.

#### Acceptance Criteria

1. THE StatLocker_App SHALL instrument paywall_shown, paywall_cta_tap, purchase_started, purchase_completed, and purchase_failed events
2. THE StatLocker_App SHALL track trial_started, trial_converted, and trial_expired_no_convert events
3. THE RevenueCat_SDK SHALL enable webhooks to Cloud Function for canonical purchase events
4. THE StatLocker_App SHALL write entitlement state, product identifiers, pricing, and country data to Firestore
5. THE StatLocker_App SHALL display trial countdown timer and log trial_countdown_seen events

### Requirement 15

**User Story:** As a user, I want clear guidance when subscription errors occur.

#### Acceptance Criteria

1. WHEN network failure occurs, THE StatLocker_App SHALL provide retry affordance and respect cached entitlements
2. WHEN user cancels purchase, THE StatLocker_App SHALL return silently to previous screen
3. WHEN receipt is missing or Play Store is unavailable, THE StatLocker_App SHALL enable offline mode for verified entitlements
4. THE StatLocker_App SHALL perform background retry for subscription verification
5. THE StatLocker_App SHALL provide user-friendly error messages for all subscription failure scenarios

### Requirement 16

**User Story:** As engineering, I want stable product identifiers across stores and environments.

#### Acceptance Criteria

1. THE RevenueCat_SDK SHALL mirror product identifiers across iOS and Android platforms
2. THE StatLocker_App SHALL maintain separate RevenueCat_SDK projects for development, staging, and production
3. THE RevenueCat_SDK SHALL store all subscription plans in single default offering
4. THE StatLocker_App SHALL feature-flag family and organizational plan visibility
5. THE StatLocker_App SHALL include unit tests validating entitlement mapping and offering completeness

### Requirement 17

**User Story:** As growth, I want timely subscription triggers that feel contextually relevant.

#### Acceptance Criteria

1. THE StatLocker_App SHALL trigger paywall from locked feature taps, trial expiry, dashboard banners, and milestone achievements
2. THE Paywall_Screen SHALL display contextual copy based on trigger source
3. THE StatLocker_App SHALL track paywall attribution with source identifiers
4. THE StatLocker_App SHALL trigger milestone nudges after 3 games logged or badge earned
5. THE StatLocker_App SHALL customize paywall messaging for each entrance point