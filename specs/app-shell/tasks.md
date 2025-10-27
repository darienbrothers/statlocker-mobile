# Mobile App Shell Implementation Plan

## Overview

This implementation plan converts the Mobile App Shell design into a series of incremental coding tasks. Each task builds on previous work and focuses on creating production-ready components that match Mobbin-quality standards. The plan prioritizes core functionality first, with optional testing tasks marked for flexibility.

## Implementation Tasks

- [x] 1. Project foundation and configuration
  - Set up Expo Router with (auth) and (tabs) route groups
  - Configure TypeScript strict mode with path aliases (@/* → src/*)
  - Create src/ folder structure (components, features, store, lib, services, types)
  - Install and configure NativeWind with design tokens
  - Set up ESLint, Prettier, and basic CI configuration
  - _Requirements: 1.1, 14.1, 14.2, 14.3, 14.4, 15.1, 15.2, 15.3_

- [x] 2. Design system and theming foundation
  - [x] 2.1 Implement NativeWind configuration with unified Royal Blue brand system
    - Configure Tailwind config with exact color tokens (primary.900 #0047AB, etc.)
    - Set up 8pt spacing scale and border radius definitions
    - Define shadow system (card, cta) and typography scales
    - _Requirements: 2.1, 2.2, 9.1, 9.2, 9.4_

  - [x] 2.2 Create core design token exports and utilities
    - Export design tokens as TypeScript constants
    - Create utility functions for consistent spacing and colors
    - Set up theme provider if needed for runtime token access
    - _Requirements: 2.5, 9.4, 9.5_

  - [x] 2.3 Add token-only color/style enforcement
    - Create ESLint rule (or custom lint script) that warns on hard-coded hex/rgb in components
    - Allow only Tailwind token classes (e.g., text-primary-900)
    - Add Prettier plugin or code-mod to auto-replace common hard-coded colors with tokens
    - _Requirements: 2.1, 2.2, 9.3_

  - [x] 2.4 Create Tailwind token reference documentation
    - Generate docs/tokens.md mapping design names → Tailwind classes for developers
    - Include examples for buttons, cards, stat chips, and focus rings
    - Document color usage patterns and accessibility considerations
    - _Requirements: 2.1, 2.2, 9.4_

- [x] 3. Core layout components
  - [x] 3.1 Build Screen primitive component
    - Implement Screen component with title, scroll, stickyCta, gradientUnderCta props
    - Add safe area handling for status bar and home indicator
    - Implement keyboard-aware behavior to prevent CTA overlap
    - Support both scrollable and static content modes
    - _Requirements: 3.1, 3.2, 3.3, 8.1, 8.2, 8.3_

  - [x] 3.2 Create StickyCTA component with micro-interactions
    - Build primary button variant with 56pt height and rounded-2xl styling
    - Implement scale-to-0.98 press animation (120ms duration)
    - Add loading state with spinner and disabled state styling
    - Integrate expo-haptics for light feedback on press
    - Add focus ring support for accessibility
    - _Requirements: 4.1, 4.2, 4.4, 11.1, 5.4_

  - [x] 3.3 Write unit tests for Screen and StickyCTA components
    - Test Screen component rendering with different prop combinations
    - Test StickyCTA states (default, loading, disabled) and interactions
    - Verify accessibility properties and keyboard behavior
    - _Requirements: 3.1, 4.1, 5.1, 5.2_

  - [x] 3.4 Keyboard QA matrix and edge-case testing
    - Test sticky CTA + Screen in multiple device combinations and record behavior
    - Test iOS (notch vs. non-notch) and Android (soft keys vs. gesture navigation)
    - Verify scroll + sticky CTA and static + sticky CTA scenarios
    - Test long forms (multiple inputs) with keyboard return/next navigation
    - Fix any overlap/jump issues and ensure smooth insets on both platforms
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [x] 4. Navigation system implementation
  - [x] 4.1 Set up Expo Router with route groups
    - Create app/(auth)/ and app/(tabs)/ directory structure
    - Implement auth gate logic that waits for authentication resolution
    - Set up routing logic: (auth) for signed-out, (tabs) for signed-in users
    - Handle persisted session restoration to (tabs) group
    - _Requirements: 1.1, 1.2, 6.1, 6.2, 6.3, 6.4_

  - [x] 4.2 Build bottom tab navigation with precise specifications
    - Create tab bar with 64-68pt height + safe area inset
    - Implement Dashboard, Stats, Goals, Recruiting tabs with icons and labels
    - Add 2px pill-underline that slides between active tabs (200ms ease-out)
    - Configure duotone/filled icons for active state, outline for inactive
    - Set up 12-13pt medium weight labels with proper color states
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [x] 4.3 Implement tab transition animations
    - Add cross-fade animation for tab content (180ms duration)
    - Create sliding underline animation with Reanimated
    - Implement subtle translateY-8 animation for card entries
    - Ensure 60fps performance during all tab transitions
    - _Requirements: 11.2, 11.3, 11.4_

  - [x] 4.4 Create basic render tests for navigation
    - Test tab bar rendering and icon/label display
    - Test route group switching between (auth) and (tabs)
    - Verify tab transition animations work correctly
    - _Requirements: 7.1, 7.2, 1.1, 1.2_

  - [x] 4.5 Implement deep link and cold-start paths
    - Add basic deep-link support using expo-linking
    - Test cold start to (auth) when signed-out
    - Test cold start to (tabs) when signed-in
    - Handle switching while links are active (auth completes → land on intended tab)
    - _Requirements: 1.1, 1.2, 6.1, 6.2, 6.3_

- [x] 5. UI Kit foundation components
  - [x] 5.1 Create Button component with all variants
    - Implement primary, secondary, and ghost button variants
    - Add proper className-based styling following design tokens
    - Support disabled, loading, and pressed states with visual feedback
    - Ensure 44pt minimum touch targets for accessibility
    - Add proper accessibility labels and roles
    - _Requirements: 10.1, 10.3, 10.5, 5.4, 5.1_

  - [x] 5.2 Build Card and StatCard components
    - Create base Card with bg-white, rounded-2xl, shadow-card styling
    - Implement StatCard with title (15-16pt semibold), value (22-24pt bold), delta chip
    - Ensure consistent hierarchy and right-aligned delta indicators
    - Support success/danger color states for delta values
    - _Requirements: 10.1, 10.3_

  - [x] 5.3 Implement remaining UI atoms
    - Create Tag/Chip component with default, success, and primary variants
    - Build Progress component for goal tracking
    - Implement Divider component for content separation
    - Create EmptyState component with 1-line promise + CTA pattern
    - Build Skeleton component matching card/grid proportions
    - _Requirements: 10.1, 10.2, 10.3_

  - [x] 5.4 Write comprehensive UI kit tests
    - Test all Button variants and states (primary, secondary, ghost, disabled, loading)
    - Test Card and StatCard rendering with different content
    - Test Tag, Progress, Divider, EmptyState, and Skeleton components
    - Verify accessibility compliance (contrast, touch targets, labels)
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

  - [x] 5.5 Set up icon pack system and states
    - Choose one icon set (Lucide or Phosphor) for consistency
    - Implement <TabIcon name active /> wrapper component
    - Configure duotone/filled icons for active state, outline for inactive
    - Set standard 24pt size and colors from design tokens
    - Document icon naming conventions in docs/icons.md
    - _Requirements: 7.1, 7.2, 7.3_

- [x] 6. State management and error handling
  - [x] 6.1 Set up Zustand store for app shell state
    - Create minimal shell state for auth, navigation, and UI states
    - Implement auth state management (user, isLoading, isAuthenticated)
    - Add navigation state tracking (activeTab, previousRoute)
    - Include UI state for keyboard visibility and offline status
    - _Requirements: 6.1, 6.5, 8.4, 12.2_

  - [x] 6.2 Implement global error boundary
    - Create error boundary component with friendly recovery UI
    - Add "Try Again" action that resets the error boundary
    - Implement error logging for monitoring and debugging
    - Style error UI to match StatLocker brand guidelines
    - _Requirements: 12.1, 12.4_

  - [x] 6.3 Add network state monitoring and offline banner
    - Integrate expo-network for connectivity monitoring
    - Create persistent offline banner that appears when disconnected
    - Implement auto-hide behavior when connection is restored
    - Style banner with warning colors and appropriate messaging
    - _Requirements: 12.2, 12.3, 12.5_

  - [x] 6.4 Implement error logging adapter
    - Create src/lib/logging.ts with pluggable provider support (Sentry/LogRocket/Console)
    - Wire global error boundary and critical catches to the logging adapter
    - Add user/session context when available (avoid PII)
    - Configure different log levels for development vs production
    - _Requirements: 12.1, 12.4_

- [x] 7. Analytics and performance optimization
  - [x] 7.1 Create analytics adapter and event tracking
    - Build analytics adapter (src/lib/analytics.ts) for provider flexibility
    - Implement screen_view events for route navigation
    - Add tab_change events with from/to tab tracking
    - Set up CTA press event tracking with context
    - Support both PostHog and Firebase Analytics integration
    - _Requirements: 13.1, 13.2, 13.3, 13.5_

  - [x] 7.2 Implement performance optimizations
    - Add lazy loading for tab screen components
    - Implement image optimization with placeholder strategies
    - Add memoization for heavy list components
    - Optimize bundle size and monitor performance metrics
    - Ensure 60fps performance during all interactions
    - _Requirements: 11.4, 11.5_

  - [x] 7.3 Add performance monitoring and testing
    - Set up performance monitoring for frame rate tracking
    - Create tests for animation performance and layout stability
    - Add bundle size analysis and monitoring
    - Test memory usage optimization strategies
    - _Requirements: 11.4, 11.5_

  - [x] 7.4 Implement performance budget checklist and CI checks
    - Add CI step to fail PRs if bundle size exceeds threshold
    - Configure eslint-plugin-react-perf or custom performance rules
    - Add manual performance checklist to PR template
    - Verify "no layout shift on CTA", "60fps tab switches", "memoized heavy lists"
    - _Requirements: 11.4, 11.5_

- [-] 8. Accessibility and internationalization
  - [x] 8.1 Implement comprehensive accessibility support
    - Add proper accessibility labels for all interactive elements
    - Implement screen reader navigation with semantic markup
    - Set up focus management during navigation transitions
    - Ensure WCAG AA color contrast ratios throughout
    - Add dynamic text sizing support up to Large accessibility sizes
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [x] 8.2 Set up internationalization foundation
    - Create lightweight i18n helper for centralized copy management
    - Implement en-US locale support for MVP
    - Design extensible system for future locale additions
    - Remove hardcoded strings from components
    - Add consistent text formatting and pluralization support
    - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5_

  - [x] 8.3 Create accessibility compliance tests
    - Test screen reader compatibility and navigation
    - Verify color contrast ratios meet WCAG AA standards
    - Test touch target sizes and keyboard navigation
    - Validate focus management and dynamic text scaling
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [x] 8.4 Conduct accessibility manual audit and create documentation
    - Create docs/a11y-checklist.md with 44pt targets, AA contrast, labels, focus rings, dynamic type
    - Record VoiceOver/TalkBack short videos for one complete flow (launch → tab switch → CTA)
    - Document accessibility testing procedures and validation steps
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 9. Tab placeholder screens and integration
  - [x] 9.1 Create placeholder screens for all tabs
    - Build Dashboard placeholder using Screen component
    - Create Stats placeholder with EmptyState component
    - Implement Goals placeholder with proper layout
    - Build Recruiting placeholder following design patterns
    - Ensure each placeholder uses consistent Screen + EmptyState pattern
    - _Requirements: 7.2, 7.3_

  - [x] 9.2 Wire up complete navigation flow
    - Connect auth gate to route group switching
    - Integrate tab navigation with analytics tracking
    - Test complete user flow from app launch to tab navigation
    - Verify state persistence and restoration works correctly
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 7.4, 13.1, 13.2_

  - [x] 9.3 Integration testing for complete flow
    - Test auth state resolution and routing logic
    - Verify tab switching preserves state correctly
    - Test offline/online state transitions
    - Validate analytics events fire at correct times
    - _Requirements: 6.1, 6.2, 6.3, 12.2, 13.1, 13.2_

  - [x] 9.4 Finalize empty-state copy and centralize messaging
    - Add finalized one-liners + actions per tab in src/lib/copy/empty.ts
    - Stats: "No games yet—log your first game to unlock trends." → Log a Game
    - Goals: "No goals yet—pick 3 season goals to stay on track." → Choose Goals
    - Recruiting: "Start your roadmap—stay organized and on time." → Open Roadmap
    - _Requirements: 16.1, 16.4_

- [ ] 10. Final polish and production readiness
  - [x] 10.1 Complete haptic feedback integration
    - Add light haptic feedback to all CTA interactions
    - Implement haptic feedback for tab presses
    - Add debouncing to prevent haptic stacking on rapid interactions
    - Test haptic feedback on both iOS and Android devices
    - _Requirements: 11.1_

  - [x] 10.2 Finalize CI/CD and quality gates
    - Complete ESLint and Prettier configuration enforcement
    - Set up comprehensive test suite execution in CI
    - Add TypeScript strict mode validation
    - Configure merge blocking on CI failures
    - Add code coverage reporting and thresholds
    - _Requirements: 14.4, 14.5_

  - [x] 10.3 Production configuration and deployment setup
    - Configure app.json for Expo with proper metadata
    - Set up eas.json for EAS Build configuration
    - Create environment template files (.env.example)
    - Add production analytics configuration
    - Prepare for initial deployment and testing
    - _Requirements: 14.1, 14.2_

  - [ ] 10.4 End-to-end testing and validation
    - Test complete app flow on physical devices
    - Validate performance on older devices
    - Test accessibility with real screen readers
    - Verify analytics data collection in staging environment
    - _Requirements: 11.4, 5.1, 13.1_

  - [ ] 10.5 Set up EAS dev build profiles and distribution
    - Add eas.json dev profiles for iOS/Android builds
    - Create npm scripts: pnpm build:dev:ios and pnpm build:dev:android
    - Generate both dev builds after shell completion
    - Attach QR codes or links for testing and validation
    - _Requirements: 14.1, 14.2_
#
# Definition of Done — App Shell

The Mobile App Shell is considered complete when all of the following criteria are met:

### Functional Requirements
- [ ] **All Acceptance Criteria** in Requirements document pass (navigation, tabs, tokens, UI kit, offline, errors, analytics)
- [ ] **Route groups** work correctly: (auth) for signed-out, (tabs) for signed-in users
- [ ] **Tab navigation** with Dashboard, Stats, Goals, Recruiting tabs functions smoothly
- [ ] **Sticky CTA** component works without keyboard overlap on iOS/Android
- [ ] **Error boundary** catches errors and provides recovery options
- [ ] **Offline banner** appears/disappears based on network connectivity

### Code Quality
- [ ] **TypeScript strict mode** enabled with no type errors
- [ ] **ESLint and Prettier** all green with no violations
- [ ] **Unit tests pass** for Screen, StickyCTA, Button, Card, EmptyState, Skeleton components
- [ ] **No hard-coded colors** in components (lint rule enforcement clean)
- [ ] **Design tokens** properly implemented and documented

### Accessibility Standards
- [ ] **44pt minimum touch targets** for all interactive elements
- [ ] **WCAG AA contrast ratios** verified for all text combinations
- [ ] **Screen reader labels** implemented and tested
- [ ] **Keyboard focus ring** visible on iPad/physical keyboard
- [ ] **Dynamic text scaling** supported up to Large accessibility sizes

### Performance Standards
- [ ] **No layout shift** on CTA appearances/disappearances
- [ ] **60fps tab switches** on current-generation devices
- [ ] **Bundle size** within established thresholds
- [ ] **Memory usage** optimized with proper image loading strategies

### Documentation
- [ ] **docs/tokens.md** created with design token mappings
- [ ] **docs/icons.md** created with icon usage guidelines
- [ ] **docs/a11y-checklist.md** created with accessibility validation steps
- [ ] **VoiceOver/TalkBack videos** recorded for key user flows

### Build & Distribution
- [ ] **EAS dev builds** generated for both iOS & Android
- [ ] **Basic smoke test** completed on real devices
- [ ] **QR codes/links** available for testing distribution

### Analytics & Monitoring
- [ ] **screen_view events** firing correctly for route navigation
- [ ] **tab_change events** tracking tab switches with proper data
- [ ] **Error logging** integrated and functional
- [ ] **Analytics adapter** configured for chosen provider (or stubbed with logs)

### Integration Testing
- [ ] **Auth state resolution** and routing logic verified
- [ ] **Deep linking** support implemented and tested
- [ ] **Keyboard behavior** tested across device types and orientations
- [ ] **Complete user flow** from app launch through tab navigation validated