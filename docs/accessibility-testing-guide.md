# Accessibility Testing Guide - StatLocker Mobile

## Overview

This guide provides step-by-step instructions for testing accessibility in the StatLocker mobile app. It covers both automated and manual testing procedures to ensure WCAG AA compliance.

## Testing Environment Setup

### iOS Testing Setup
1. **Enable VoiceOver**:
   - Settings > Accessibility > VoiceOver > On
   - Learn VoiceOver gestures in Settings > Accessibility > VoiceOver > VoiceOver Practice

2. **Enable Accessibility Inspector**:
   - Settings > Accessibility > Accessibility Inspector > On
   - Use to inspect element properties and hierarchy

3. **Configure Additional Settings**:
   - Settings > Display & Brightness > Text Size > Larger Text > On
   - Settings > Accessibility > Motion > Reduce Motion > On (test both states)
   - Settings > Accessibility > Display & Text Size > Increase Contrast > On

### Android Testing Setup
1. **Enable TalkBack**:
   - Settings > Accessibility > TalkBack > On
   - Complete TalkBack tutorial

2. **Install Accessibility Scanner**:
   - Download from Google Play Store
   - Enable in Settings > Accessibility > Accessibility Scanner

3. **Configure Additional Settings**:
   - Settings > Display > Font size and style > Large
   - Settings > Accessibility > Remove animations > On (test both states)
   - Settings > Accessibility > High contrast text > On

## Automated Testing

### Running Accessibility Tests
```bash
# Run all accessibility tests
npm test -- --testPathPattern="accessibility"

# Run component accessibility compliance tests
npm test -- --testPathPattern="AccessibilityCompliance"

# Run specific accessibility test suites
npm test -- --testNamePattern="Screen Reader"
npm test -- --testNamePattern="Color Contrast"
npm test -- --testNamePattern="Touch Target"
npm test -- --testNamePattern="Focus Management"

# Run with coverage
npm test -- --coverage --testPathPattern="accessibility"
```

### Interpreting Test Results
- **Green tests**: Accessibility requirements met
- **Red tests**: Accessibility violations found - must fix before release
- **Yellow warnings**: Recommendations for improvement
- **Coverage reports**: Ensure all components are tested

## Manual Testing Procedures

### 1. Screen Reader Testing (iOS VoiceOver)

#### Basic Navigation Test
1. **Launch the app** with VoiceOver enabled
2. **Navigate through elements**:
   - Swipe right to move to next element
   - Swipe left to move to previous element
   - Double-tap to activate element
3. **Verify each element**:
   - Has meaningful accessibility label
   - Announces correct role (button, heading, etc.)
   - Announces current state (selected, disabled, etc.)

#### Complete User Flow Test
**Test Flow: App Launch → Tab Navigation → Action**
1. **App Launch**:
   - VoiceOver announces app name
   - Focus moves to first interactive element
   - Loading states are announced

2. **Tab Navigation**:
   - Each tab is announced with name and role
   - Selected state is announced
   - Tab content changes are announced

3. **Action Execution**:
   - Button presses are announced
   - Loading states are communicated
   - Success/error states are announced

#### Recording VoiceOver Session
```bash
# iOS Simulator recording
xcrun simctl io booted recordVideo --type=mp4 voiceover-test.mp4

# Stop recording with Ctrl+C
# Video saved to current directory
```

### 2. Screen Reader Testing (Android TalkBack)

#### Basic Navigation Test
1. **Launch the app** with TalkBack enabled
2. **Navigate through elements**:
   - Swipe right to move to next element
   - Swipe left to move to previous element
   - Double-tap to activate element
3. **Verify announcements**:
   - Element labels are clear and descriptive
   - Roles are announced correctly
   - States are communicated properly

#### Gesture Testing
- **Two-finger swipe up/down**: Scroll content
- **Two-finger tap**: Pause/resume TalkBack
- **Three-finger swipe left/right**: Navigate between screens
- **Volume up + down**: Quick TalkBack toggle

### 3. Keyboard Navigation Testing

#### Setup External Keyboard
- **iOS**: Connect Bluetooth keyboard or use iOS Simulator
- **Android**: Connect Bluetooth keyboard or use Android emulator

#### Navigation Test Procedure
1. **Tab Navigation**:
   - Press Tab to move forward through interactive elements
   - Press Shift+Tab to move backward
   - Verify focus order is logical and matches visual layout

2. **Activation Testing**:
   - Press Enter or Space to activate buttons
   - Press Arrow keys for tab groups and radio buttons
   - Press Escape to close modals/dialogs

3. **Focus Visibility**:
   - Verify focus indicators are clearly visible
   - Check focus indicators meet 3:1 contrast ratio
   - Ensure focus doesn't get lost or trapped

#### Focus Order Validation
```
Expected Focus Order:
1. Skip links (if present)
2. Main navigation (tabs)
3. Page content (top to bottom, left to right)
4. Secondary actions
5. Footer elements
```

### 4. Color Contrast Testing

#### Automated Contrast Validation
```bash
# Run contrast tests
npm test -- --testNamePattern="contrast"

# Check specific color combinations
node -e "
const { getContrastRatio } = require('./src/lib/accessibility');
console.log('Primary button:', getContrastRatio('#FFFFFF', '#0047AB'));
console.log('Body text:', getContrastRatio('#111827', '#FFFFFF'));
"
```

#### Manual Contrast Testing
1. **Use Colour Contrast Analyser**:
   - Download from TPGi website
   - Test foreground/background color combinations
   - Verify ratios meet WCAG AA requirements

2. **Test in High Contrast Mode**:
   - Enable system high contrast mode
   - Verify all text remains readable
   - Check that UI elements are still distinguishable

3. **Color Blindness Testing**:
   - Use Sim Daltonism (macOS) or Color Oracle
   - Test with different types of color blindness
   - Ensure information isn't conveyed by color alone

### 5. Touch Target Testing

#### Size Validation
1. **Measure touch targets**:
   - Use accessibility inspector tools
   - Verify minimum 44pt × 44pt size
   - Check spacing between adjacent targets

2. **Physical Testing**:
   - Test on actual devices with fingers
   - Verify targets are easy to tap accurately
   - Check for accidental activations

#### Touch Target Test Cases
```
Test Cases:
- Small buttons (icons, close buttons)
- Tab bar items
- Form controls (checkboxes, radio buttons)
- List items with actions
- Floating action buttons
```

### 6. Dynamic Text Scaling Testing

#### iOS Text Scaling Test
1. **Navigate to Settings**:
   - Settings > Display & Brightness > Text Size
   - Move slider to largest size
   - Enable "Larger Accessibility Sizes"

2. **Test App Layout**:
   - Launch StatLocker app
   - Navigate through all screens
   - Verify text scales appropriately
   - Check that layout doesn't break

#### Android Text Scaling Test
1. **Navigate to Settings**:
   - Settings > Display > Font size and style
   - Select "Huge" or largest available size

2. **Test App Behavior**:
   - Verify text scales correctly
   - Check touch targets grow with text
   - Ensure horizontal scrolling isn't required

### 7. Motion and Animation Testing

#### Reduce Motion Testing
1. **Enable Reduce Motion**:
   - iOS: Settings > Accessibility > Motion > Reduce Motion
   - Android: Settings > Accessibility > Remove animations

2. **Test App Animations**:
   - Verify animations are reduced or disabled
   - Check that functionality isn't lost
   - Ensure transitions are still smooth

#### Animation Accessibility
- **Avoid flashing content** (seizure risk)
- **Provide pause controls** for auto-playing content
- **Respect user motion preferences**

## Testing Checklists

### Pre-Release Testing Checklist
- [ ] **Automated tests pass** (100% pass rate required)
- [ ] **VoiceOver navigation** tested on iOS
- [ ] **TalkBack navigation** tested on Android
- [ ] **Keyboard navigation** tested with external keyboard
- [ ] **Color contrast** validated for all text
- [ ] **Touch targets** meet minimum size requirements
- [ ] **Text scaling** tested up to 200%
- [ ] **Reduce motion** preferences respected
- [ ] **Focus management** works correctly
- [ ] **Error states** are accessible
- [ ] **Loading states** are announced
- [ ] **Empty states** provide clear guidance

### Component Testing Checklist
For each new component, verify:
- [ ] **Accessibility role** is appropriate
- [ ] **Accessibility label** is descriptive
- [ ] **Touch target** meets minimum size
- [ ] **Color contrast** meets WCAG AA
- [ ] **Focus indicator** is visible
- [ ] **States** are announced to screen readers
- [ ] **Keyboard activation** works
- [ ] **Text scaling** doesn't break layout

### User Flow Testing Checklist
For each critical user flow:
- [ ] **Complete flow** navigable with screen reader
- [ ] **Focus order** is logical throughout flow
- [ ] **Error handling** is accessible
- [ ] **Success confirmation** is announced
- [ ] **Back navigation** works correctly
- [ ] **State persistence** maintained during navigation

## Common Issues and Solutions

### Issue: Element Not Announced by Screen Reader
**Symptoms**: Screen reader skips over element
**Solutions**:
- Add `accessibilityLabel` prop
- Ensure element is focusable
- Check if element is hidden from accessibility tree
- Verify element has proper role

### Issue: Poor Focus Order
**Symptoms**: Tab navigation jumps around unexpectedly
**Solutions**:
- Review component structure and DOM order
- Use `tabIndex` sparingly and correctly
- Implement custom focus management for complex components
- Test with keyboard navigation

### Issue: Low Color Contrast
**Symptoms**: Text is hard to read, fails contrast tests
**Solutions**:
- Use darker colors for text on light backgrounds
- Add background colors to improve contrast
- Test with contrast checking tools
- Consider alternative visual indicators

### Issue: Touch Targets Too Small
**Symptoms**: Difficult to tap accurately on mobile devices
**Solutions**:
- Increase button padding
- Add transparent touch areas around small elements
- Use minimum 44pt × 44pt size
- Test on actual devices

## Reporting and Documentation

### Test Report Template
```markdown
# Accessibility Test Report - [Feature/Release]

## Test Summary
- **Date**: [Date]
- **Tester**: [Name]
- **Platform**: iOS/Android
- **Version**: [App Version]

## Tests Performed
- [ ] Screen Reader Navigation
- [ ] Keyboard Navigation
- [ ] Color Contrast Validation
- [ ] Touch Target Testing
- [ ] Text Scaling Testing

## Issues Found
| Issue | Severity | Component | Status |
|-------|----------|-----------|--------|
| [Description] | High/Medium/Low | [Component] | Open/Fixed |

## Recommendations
- [List of recommendations for improvement]

## Sign-off
- [ ] All critical issues resolved
- [ ] Ready for release
```

### Video Documentation
Record short videos demonstrating:
1. **VoiceOver navigation** through main user flow
2. **TalkBack navigation** through key features
3. **Keyboard navigation** demonstration
4. **Text scaling** behavior
5. **Focus management** during transitions

### Accessibility Statement
Maintain an accessibility statement that includes:
- **Conformance level** (WCAG 2.1 AA)
- **Known limitations** and workarounds
- **Contact information** for accessibility feedback
- **Testing methodology** and tools used
- **Last updated date**

## Continuous Improvement

### Regular Testing Schedule
- **Daily**: Automated accessibility tests in CI/CD
- **Weekly**: Manual testing of new features
- **Monthly**: Comprehensive accessibility review
- **Quarterly**: Full app accessibility audit
- **Annually**: Third-party accessibility assessment

### Team Training
- **Onboarding**: Accessibility basics for new team members
- **Workshops**: Regular accessibility training sessions
- **Resources**: Maintain library of accessibility resources
- **Certification**: Encourage accessibility certification

### User Feedback
- **Feedback channels**: Provide easy ways to report accessibility issues
- **User testing**: Regular testing with users with disabilities
- **Community engagement**: Participate in accessibility communities
- **Continuous learning**: Stay updated with accessibility best practices

This testing guide should be updated regularly as new features are added and accessibility standards evolve.