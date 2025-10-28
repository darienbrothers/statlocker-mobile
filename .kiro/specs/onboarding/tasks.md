# Onboarding Implementation Plan

- [ ] 1. Set up onboarding infrastructure and core architecture
  - Create onboarding directory structure under `/app/(auth)/onboarding/`
  - Set up Expo Router dynamic routing for onboarding steps
  - Create base TypeScript interfaces for OnboardingProfile and step data
  - Configure Zustand store for onboarding state management
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [ ] 1.1 Create onboarding directory structure and routing
  - Create `/app/(auth)/onboarding/index.tsx` entry point
  - Create `/app/(auth)/onboarding/[step].tsx` dynamic step router
  - Set up `/src/components/onboarding/` component directory
  - Create `/src/hooks/onboarding/` hooks directory
  - _Requirements: 1.1, 10.1, 10.3_

- [ ] 1.2 Define core TypeScript interfaces and types
  - Create `OnboardingProfile` interface with all step data fields
  - Define step-specific interfaces (RoleData, SportData, etc.)
  - Create validation rule types and error handling interfaces
  - Define analytics event types for onboarding tracking
  - _Requirements: 1.3, 2.3, 3.3, 4.3, 5.3_

- [ ] 1.3 Implement Zustand onboarding store
  - Create onboarding store with state management actions
  - Implement step navigation and validation logic
  - Add progress persistence to local storage
  - Create store selectors for component consumption
  - _Requirements: 10.3, 16.1, 16.2, 16.4_

- [ ] 1.4 Write unit tests for core infrastructure
  - Test onboarding store state transitions and actions
  - Test TypeScript interface validation
  - Test routing and navigation logic
  - _Requirements: 1.1, 1.2, 1.3_

- [ ] 2. Build shared onboarding components and layout system
  - Create StepWrapper component for consistent step layout
  - Implement ProgressBar component with step tracking
  - Build NavigationBar component for step navigation
  - Create shared form components and validation helpers
  - _Requirements: 10.1, 10.2, 10.4, 10.5_

- [ ] 2.1 Create StepWrapper component with consistent layout
  - Implement responsive step container with proper spacing
  - Add progress indication and step numbering
  - Include accessibility labels and focus management
  - Integrate loading states and error boundaries
  - _Requirements: 10.1, 10.4, 18.2_

- [ ] 2.2 Build ProgressBar component with visual feedback
  - Create linear progress indicator with step completion status
  - Add smooth animations for progress transitions
  - Implement accessibility announcements for progress changes
  - Include motivational progress messaging
  - _Requirements: 10.4, 18.2, 4.1_

- [ ] 2.3 Implement NavigationBar with step controls
  - Create back/next navigation with proper state management
  - Add step validation before allowing progression
  - Implement keyboard navigation support
  - Include haptic feedback for navigation actions
  - _Requirements: 10.1, 10.2, 10.5, 18.2_

- [ ] 2.4 Create shared form components and validation
  - Build reusable input components with validation
  - Create selection components (cards, dropdowns, toggles)
  - Implement real-time validation with error messaging
  - Add motivational microcopy and success feedback
  - _Requirements: 2.2, 3.2, 4.2, 5.2_

- [ ] 2.5 Write component tests for shared UI elements
  - Test StepWrapper rendering and accessibility
  - Test ProgressBar animations and state updates
  - Test NavigationBar interaction and validation
  - Test form components validation and error states
  - _Requirements: 10.1, 10.2, 10.4_

- [ ] 3. Implement core onboarding steps (1-5)
  - Create RoleSelection component for athlete/coach choice
  - Build SportGender component with demographics collection
  - Implement PositionLevel component for athletic details
  - Create TeamDetails component for school/club information
  - Build GoalSelection component for performance objectives
  - _Requirements: 1.1, 2.1, 3.1, 4.1, 5.1_

- [ ] 3.1 Create RoleSelection step component
  - Implement role selection cards with clear descriptions
  - Add role-specific imagery and motivational copy
  - Include immediate validation and progression logic
  - Store role selection in onboarding state
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [ ] 3.2 Build SportGender step with demographics
  - Create sport selection interface (lacrosse primary)
  - Implement gender selection with inclusive options
  - Add date of birth picker with age calculation
  - Include graduation year dropdown (2025-2029)
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 11.1, 11.2_

- [ ] 3.3 Implement PositionLevel step for athletic details
  - Create dynamic position options based on sport/gender
  - Build academic level selection (Freshman/JV/Varsity)
  - Add position-specific descriptions and imagery
  - Include validation for required selections
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 11.3, 11.4_

- [ ] 3.4 Create TeamDetails step for organization info
  - Build school name input with autocomplete suggestions
  - Implement city/state selection with geolocation option
  - Add club team toggle with conditional fields
  - Include organization validation and data storage
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 12.1, 12.2, 12.3, 12.4_

- [ ] 3.5 Build GoalSelection step for performance objectives
  - Create position-specific goal categories and options
  - Implement exactly 3 goal selection with visual feedback
  - Add goal descriptions and success metrics display
  - Include drag-to-reorder functionality for selected goals
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 3.6 Write integration tests for core steps
  - Test step navigation and data persistence
  - Test validation rules and error handling
  - Test step-specific business logic
  - _Requirements: 1.1, 2.1, 3.1, 4.1, 5.1_

- [ ] 4. Implement personalization and AI features
  - Create AthleteDNA quiz component with personality assessment
  - Build TonePreference component for AI communication style
  - Implement persona derivation logic from DNA responses
  - Create AI personalization bridge for future features
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 13.1, 13.2, 13.3, 13.4, 13.5_

- [ ] 4.1 Create AthleteDNA quiz component
  - Build six-question personality assessment interface
  - Implement slider-based or multiple choice responses
  - Add progress indication within the quiz
  - Include motivational copy and question explanations
  - _Requirements: 13.1, 13.2, 13.3_

- [ ] 4.2 Build TonePreference component for AI style
  - Create four AI tone options with sample messages
  - Implement interactive preview of each tone style
  - Add personality-based recommendations from DNA results
  - Include clear descriptions of each communication style
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [ ] 4.3 Implement persona derivation and mapping logic
  - Create persona calculation from AthleteDNA responses
  - Build AI tone recommendation system
  - Implement persona-to-insights mapping for future use
  - Store derived persona data in user profile
  - _Requirements: 13.4, 13.5, 6.4_

- [ ] 4.4 Write tests for personalization features
  - Test AthleteDNA quiz logic and scoring
  - Test persona derivation algorithms
  - Test AI tone recommendation accuracy
  - _Requirements: 6.1, 13.1, 13.4_

- [ ] 5. Implement compliance and legal features
  - Create AgeVerification component for COPPA compliance
  - Build LegalConsent component for terms and privacy
  - Implement guardian consent flow for minors
  - Add data retention and privacy controls
  - _Requirements: 14.1, 14.2, 14.3, 14.4, 15.1, 15.2, 15.3, 15.4, 15.5_

- [ ] 5.1 Create AgeVerification component for compliance
  - Implement age calculation and compliance checking
  - Build guardian email collection for 13-15 year olds
  - Add COPPA/GDPR-K compliance messaging
  - Include age verification status tracking
  - _Requirements: 14.1, 14.2, 14.3, 14.4_

- [ ] 5.2 Build LegalConsent component for policies
  - Create Terms of Service and Privacy Policy links
  - Implement required consent checkboxes
  - Add optional benchmarking data consent toggle
  - Include clear legal language and explanations
  - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_

- [ ] 5.3 Implement guardian consent workflow
  - Create guardian email notification system
  - Build secure consent portal for parents
  - Implement consent tracking and validation
  - Add follow-up reminder system
  - _Requirements: 14.3, 14.4_

- [ ] 5.4 Write compliance and legal tests
  - Test age verification logic and edge cases
  - Test guardian consent workflow
  - Test legal consent validation
  - _Requirements: 14.1, 14.2, 15.1_

- [ ] 6. Build review and account creation flow
  - Create ReviewProfile component for data confirmation
  - Implement AccountCreation component with Firebase Auth
  - Build profile data validation and error handling
  - Add account creation success and error states
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 6.1 Create ReviewProfile component for confirmation
  - Display complete profile summary with all collected data
  - Add edit links to previous steps for corrections
  - Implement data accuracy confirmation interface
  - Include final validation before account creation
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [ ] 6.2 Implement AccountCreation with Firebase Auth
  - Build email/password collection interface
  - Integrate Firebase Authentication account creation
  - Add email verification requirement
  - Implement authentication error handling with retry
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 6.3 Build profile validation and error handling
  - Create comprehensive profile data validation
  - Implement graceful error recovery mechanisms
  - Add clear error messaging and correction guidance
  - Include retry logic for failed operations
  - _Requirements: 8.4, 8.5, 20.1, 20.3_

- [ ] 6.4 Write tests for review and account creation
  - Test profile review display and editing
  - Test Firebase Auth integration
  - Test error handling and recovery flows
  - _Requirements: 7.1, 8.1, 8.2_

- [ ] 7. Implement Firestore profile storage and trial activation
  - Create Firestore profile document structure
  - Build profile data storage with error handling
  - Integrate RevenueCat trial activation
  - Implement post-onboarding state transition
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 17.1, 17.2, 17.3, 17.4, 17.5_

- [ ] 7.1 Create Firestore profile document structure
  - Define complete user profile schema in Firestore
  - Implement profile document creation with validation
  - Add profile metadata (timestamps, versions)
  - Include data indexing for efficient queries
  - _Requirements: 9.1, 9.2, 9.3_

- [ ] 7.2 Build profile storage with error handling
  - Implement robust profile data storage logic
  - Add retry mechanisms for failed Firestore operations
  - Create error recovery and user notification system
  - Include offline storage queue for network issues
  - _Requirements: 9.4, 9.5, 20.1, 20.2, 20.5_

- [ ] 7.3 Integrate RevenueCat trial activation
  - Connect RevenueCat SDK for trial management
  - Implement automatic 7-day trial activation
  - Add trial status tracking and storage
  - Create trial confirmation UI and messaging
  - _Requirements: 17.1, 17.2, 17.3_

- [ ] 7.4 Implement post-onboarding transition
  - Create seamless transition to main application
  - Add welcome screen with trial status display
  - Implement analytics event logging for completion
  - Include onboarding completion celebration
  - _Requirements: 17.4, 17.5, 9.5_

- [ ] 7.5 Write tests for storage and trial features
  - Test Firestore profile creation and storage
  - Test RevenueCat trial activation flow
  - Test error handling and recovery mechanisms
  - _Requirements: 9.1, 9.4, 17.1_

- [x] 8. Add progress persistence and recovery features
  - Implement automatic progress saving to local storage
  - Build onboarding resume functionality
  - Create multi-device sync and conflict resolution
  - Add "Start Over" functionality with confirmation
  - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5_

- [x] 8.1 Implement automatic progress persistence
  - Create local storage backup of onboarding data
  - Add automatic saving after each step completion
  - Implement Firestore sync for cross-device access
  - Include progress validation and integrity checks
  - _Requirements: 16.1, 16.4_

- [x] 8.2 Build onboarding resume functionality
  - Create resume detection on app launch
  - Implement step restoration with data validation
  - Add "Resume Setup" UI for returning users
  - Include progress indicator for resumed sessions
  - _Requirements: 16.2, 16.5_

- [x] 8.3 Create multi-device sync and conflict resolution
  - Implement device conflict detection logic
  - Build user choice interface for data conflicts
  - Add timestamp-based automatic resolution
  - Include merge capabilities for compatible data
  - _Requirements: 16.1, 16.2_

- [x] 8.4 Add "Start Over" functionality
  - Create confirmation dialog for onboarding reset
  - Implement complete state cleanup and reset
  - Add data export option before reset
  - Include analytics tracking for reset events
  - _Requirements: 16.3, 16.5_

- [x] 8.5 Write tests for persistence and recovery
  - Test automatic progress saving and restoration
  - Test multi-device sync and conflict resolution
  - Test "Start Over" functionality and cleanup
  - _Requirements: 16.1, 16.2, 16.3_

- [ ] 9. Implement analytics and performance tracking
  - Create comprehensive onboarding analytics events
  - Build funnel tracking and conversion metrics
  - Add performance monitoring and optimization
  - Implement A/B testing infrastructure for onboarding
  - _Requirements: 19.1, 19.2, 19.3, 19.4, 19.5_

- [ ] 9.1 Create onboarding analytics event system
  - Implement event tracking for all onboarding actions
  - Add segmentation fields (source, device, version)
  - Create funnel analysis and drop-off tracking
  - Include user interaction and engagement metrics
  - _Requirements: 19.1, 19.2, 19.3, 19.4, 19.5_

- [ ] 9.2 Build performance monitoring
  - Add step completion time tracking
  - Implement memory usage and performance metrics
  - Create network request monitoring
  - Include animation performance tracking
  - _Requirements: 19.5_

- [ ] 9.3 Write analytics and performance tests
  - Test event tracking accuracy and completeness
  - Test performance metric collection
  - Test A/B testing infrastructure
  - _Requirements: 19.1, 19.2_

- [ ] 10. Add accessibility and internationalization support
  - Implement comprehensive accessibility features
  - Build internationalization framework with English/Spanish
  - Create screen reader support and keyboard navigation
  - Add dynamic type and high contrast support
  - _Requirements: 18.1, 18.2, 18.3, 18.4, 18.5_

- [ ] 10.1 Implement accessibility features
  - Add VoiceOver labels and accessibility hints
  - Create proper heading hierarchy and landmarks
  - Implement keyboard navigation and focus management
  - Include high contrast and reduced motion support
  - _Requirements: 18.1, 18.2, 18.4, 18.5_

- [ ] 10.2 Build internationalization framework
  - Set up react-i18next with namespace organization
  - Create English and Spanish translation files
  - Implement locale-aware validation and formatting
  - Add cultural considerations for different regions
  - _Requirements: 18.3_

- [ ] 10.3 Write accessibility and i18n tests
  - Test screen reader compatibility and navigation
  - Test keyboard accessibility and focus management
  - Test translation accuracy and locale handling
  - _Requirements: 18.1, 18.2, 18.3_

- [ ] 11. Polish UI/UX and add delight features
  - Implement design tokens and consistent theming
  - Add motivational animations and micro-interactions
  - Create celebration moments and success feedback
  - Build error recovery and offline support UI
  - _Requirements: 4.1, 20.1, 20.2, 20.3, 20.4, 20.5_

- [ ] 11.1 Implement design tokens and theming
  - Create comprehensive design token system
  - Build consistent color, typography, and spacing
  - Add animation timing and easing definitions
  - Implement responsive design breakpoints
  - _Requirements: Design consistency requirements_

- [ ] 11.2 Add motivational animations and interactions
  - Create step transition animations with spring physics
  - Implement goal selection celebrations with confetti
  - Add progress milestone animations and haptic feedback
  - Build completion celebration with full-screen effects
  - _Requirements: 4.1, Delight moments from design_

- [ ] 11.3 Create error recovery and offline UI
  - Build graceful network error handling interfaces
  - Add offline mode indicators and messaging
  - Implement retry mechanisms with clear feedback
  - Create data sync status and conflict resolution UI
  - _Requirements: 20.1, 20.2, 20.3, 20.4, 20.5_

- [ ] 11.4 Write UI/UX and interaction tests
  - Test animation performance and smoothness
  - Test error handling and recovery flows
  - Test offline functionality and data sync
  - _Requirements: 20.1, 20.2, 20.3_

- [ ] 12. Integration testing and end-to-end validation
  - Create comprehensive end-to-end onboarding tests
  - Build integration tests for Firebase and RevenueCat
  - Test complete user journeys and edge cases
  - Validate analytics tracking and data accuracy
  - _Requirements: All requirements validation_

- [ ] 12.1 Create end-to-end onboarding flow tests
  - Test complete athlete onboarding journey
  - Test coach onboarding flow (when implemented)
  - Test error scenarios and recovery paths
  - Test multi-device and offline scenarios
  - _Requirements: Complete flow validation_

- [ ] 12.2 Build integration tests for external services
  - Test Firebase Auth account creation and management
  - Test Firestore profile storage and retrieval
  - Test RevenueCat trial activation and status
  - Test analytics event delivery and accuracy
  - _Requirements: 8.1, 9.1, 17.1, 19.1_

- [ ] 12.3 Write comprehensive test coverage validation
  - Ensure all requirements have corresponding tests
  - Test edge cases and error conditions
  - Validate accessibility compliance
  - Test performance under various conditions
  - _Requirements: All requirements coverage_