# Accessibility Checklist - StatLocker Mobile App

## Overview

This checklist ensures StatLocker meets WCAG AA accessibility standards and provides an excellent experience for users with disabilities. Use this checklist during development, code reviews, and before releases.

## Quick Reference

### ✅ WCAG AA Requirements
- **Color Contrast**: 4.5:1 for normal text, 3:1 for large text
- **Touch Targets**: Minimum 44pt × 44pt
- **Screen Reader**: Proper labels, roles, and navigation
- **Focus Management**: Visible focus indicators and logical order
- **Dynamic Text**: Support up to 200% text scaling

---

## 1. Touch Targets & Interactive Elements

### ✅ Minimum Size Requirements
- [ ] All interactive elements are **≥ 44pt × 44pt**
- [ ] Recommended size is **48pt × 48pt** for optimal usability
- [ ] Buttons maintain minimum size even with small text
- [ ] Touch targets don't overlap or interfere with each other

### ✅ Interactive States
- [ ] All interactive elements have **visible pressed states**
- [ ] **Disabled states** are clearly indicated (visual + accessibility)
- [ ] **Loading states** are announced to screen readers
- [ ] **Focus states** are visible for keyboard/external keyboard users

### 🧪 Testing
```bash
# Run touch target validation tests
npm test -- --testNamePattern="touch target"

# Manual test: Use iOS Accessibility Inspector
# Settings > Accessibility > Accessibility Inspector > Enable
```

---

## 2. Color Contrast (WCAG AA)

### ✅ Text Contrast Requirements
- [ ] **Normal text**: ≥ 4.5:1 contrast ratio
- [ ] **Large text** (≥18pt or ≥14pt bold): ≥ 3:1 contrast ratio
- [ ] **Interactive elements**: Meet contrast requirements in all states
- [ ] **Focus indicators**: 3:1 contrast against background

### ✅ StatLocker Brand Colors Validation
| Element | Foreground | Background | Ratio | Status |
|---------|------------|------------|-------|--------|
| Primary Button | `#FFFFFF` | `#0047AB` | 8.6:1 | ✅ Pass |
| Secondary Button | `#0047AB` | `#FFFFFF` | 8.6:1 | ✅ Pass |
| Body Text | `#111827` | `#FFFFFF` | 16.6:1 | ✅ Pass |
| Gray Text | `#6B7280` | `#FFFFFF` | 5.9:1 | ✅ Pass |
| Success Text | `#00D4FF` | `#FFFFFF` | 2.4:1 | ⚠️ Large text only |
| Warning Text | `#F5C542` | `#FFFFFF` | 1.8:1 | ❌ Needs dark background |
| Danger Text | `#DC2626` | `#FFFFFF` | 5.3:1 | ✅ Pass |

### 🧪 Testing
```bash
# Run contrast validation tests
npm test -- --testNamePattern="contrast"

# Online tools:
# - WebAIM Contrast Checker: https://webaim.org/resources/contrastchecker/
# - Colour Contrast Analyser: https://www.tpgi.com/color-contrast-checker/
```

---

## 3. Screen Reader Support

### ✅ Accessibility Labels
- [ ] All interactive elements have **meaningful accessibility labels**
- [ ] Labels describe the **purpose**, not just the visual appearance
- [ ] **Avoid redundant text** (don't repeat visible text in label)
- [ ] **Dynamic content changes** are announced

### ✅ Accessibility Roles
- [ ] **Buttons**: `accessibilityRole="button"`
- [ ] **Links**: `accessibilityRole="link"`
- [ ] **Headings**: Proper heading hierarchy
- [ ] **Lists**: `accessibilityRole="list"` with list items
- [ ] **Tabs**: `accessibilityRole="tab"` with `accessibilityState`
- [ ] **Progress**: `accessibilityRole="progressbar"` with value

### ✅ State Communication
- [ ] **Loading states**: `accessibilityState={{ busy: true }}`
- [ ] **Disabled states**: `accessibilityState={{ disabled: true }}`
- [ ] **Selected states**: `accessibilityState={{ selected: true }}`
- [ ] **Expanded states**: `accessibilityState={{ expanded: true }}`

### ✅ Content Structure
- [ ] **Logical reading order** without visual styling
- [ ] **Meaningful headings** create proper document outline
- [ ] **Skip links** for long content (if applicable)
- [ ] **Landmark roles** for main content areas

### 🧪 Testing
```bash
# Enable screen reader testing
# iOS: Settings > Accessibility > VoiceOver > On
# Android: Settings > Accessibility > TalkBack > On

# Test navigation:
# - Swipe right/left to navigate elements
# - Double-tap to activate
# - Three-finger swipe to scroll
```

---

## 4. Focus Management

### ✅ Focus Indicators
- [ ] **Visible focus rings** on all interactive elements
- [ ] **Focus rings** have 3:1 contrast against background
- [ ] **Focus order** follows logical sequence
- [ ] **Focus doesn't get trapped** in components

### ✅ Navigation Focus
- [ ] **Modal dialogs** trap focus appropriately
- [ ] **Tab navigation** returns focus to trigger element
- [ ] **Screen transitions** maintain or restore focus logically
- [ ] **Keyboard shortcuts** work as expected

### ✅ Focus Ring Specifications
```css
/* StatLocker Focus Ring Standard */
border: 2px solid #0047AB;  /* Outer ring: Primary blue */
outline: 2px solid #9CA3AF; /* Inner ring: Gray for contrast */
outline-offset: 2px;
border-radius: 4px;
```

### 🧪 Testing
```bash
# Keyboard navigation test:
# - Tab through all interactive elements
# - Shift+Tab to navigate backwards
# - Enter/Space to activate buttons
# - Arrow keys for tab/radio groups
```

---

## 5. Dynamic Text Scaling

### ✅ Text Scaling Support
- [ ] **Text scales up to 200%** without horizontal scrolling
- [ ] **Layout adapts** to larger text sizes
- [ ] **Touch targets grow** with text scaling
- [ ] **Content remains readable** at all scale levels

### ✅ Text Size Categories
| Category | Scale | Use Case |
|----------|-------|----------|
| xSmall | 0.8× | Fine print, captions |
| Small | 0.9× | Secondary text |
| Medium | 1.0× | Body text (default) |
| Large | 1.1× | Accessibility preference |
| xLarge | 1.2× | Accessibility preference |
| xxLarge | 1.3× | Accessibility preference |
| xxxLarge | 1.4× | Maximum accessibility |

### 🧪 Testing
```bash
# iOS: Settings > Display & Brightness > Text Size
# Android: Settings > Display > Font size and style

# Test at different sizes:
# - Default size
# - Large accessibility size
# - Largest accessibility size
```

---

## 6. Component-Specific Guidelines

### Button Components
```typescript
// ✅ Good: Accessible button
<Button
  accessibilityLabel="Save document"
  accessibilityHint="Saves the current document to your account"
  accessibilityRole="button"
  onPress={handleSave}
>
  Save
</Button>

// ❌ Bad: Missing accessibility properties
<Pressable onPress={handleSave}>
  <Text>Save</Text>
</Pressable>
```

### Form Elements
```typescript
// ✅ Good: Accessible form field
<View>
  <Text accessibilityRole="text">Email Address</Text>
  <TextInput
    accessibilityLabel="Email address"
    accessibilityHint="Enter your email to sign in"
    placeholder="Enter email"
    value={email}
    onChangeText={setEmail}
  />
</View>
```

### Navigation Elements
```typescript
// ✅ Good: Accessible tab navigation
<Pressable
  accessibilityRole="tab"
  accessibilityLabel="Dashboard tab"
  accessibilityState={{ selected: isActive }}
  onPress={() => navigateToTab('dashboard')}
>
  <Text>Dashboard</Text>
</Pressable>
```

### Loading States
```typescript
// ✅ Good: Accessible loading state
<View
  accessibilityRole="progressbar"
  accessibilityLabel="Loading content"
  accessibilityState={{ busy: true }}
>
  <ActivityIndicator />
  <Text>Loading...</Text>
</View>
```

---

## 7. Testing Procedures

### Automated Testing
```bash
# Run all accessibility tests
npm test -- --testPathPattern="accessibility"

# Run component accessibility tests
npm test -- --testPathPattern="AccessibilityCompliance"

# Run contrast validation
npm test -- --testNamePattern="contrast"

# Run touch target validation
npm test -- --testNamePattern="touch target"
```

### Manual Testing Checklist

#### Screen Reader Testing (iOS VoiceOver)
- [ ] **Enable VoiceOver**: Settings > Accessibility > VoiceOver
- [ ] **Navigate with gestures**: Swipe right/left between elements
- [ ] **Activate elements**: Double-tap to activate
- [ ] **Scroll content**: Three-finger swipe up/down
- [ ] **Test all screens**: Ensure logical navigation order
- [ ] **Test state changes**: Loading, error, success states announced

#### Screen Reader Testing (Android TalkBack)
- [ ] **Enable TalkBack**: Settings > Accessibility > TalkBack
- [ ] **Navigate with gestures**: Swipe right/left between elements
- [ ] **Activate elements**: Double-tap to activate
- [ ] **Scroll content**: Two-finger swipe up/down
- [ ] **Test all screens**: Ensure logical navigation order
- [ ] **Test state changes**: Loading, error, success states announced

#### Keyboard Navigation Testing
- [ ] **Connect external keyboard** (iOS/Android)
- [ ] **Tab navigation**: Tab through all interactive elements
- [ ] **Reverse navigation**: Shift+Tab works correctly
- [ ] **Activation**: Enter/Space activates buttons
- [ ] **Focus visible**: Focus indicators clearly visible
- [ ] **Focus order**: Logical sequence matches visual layout

#### Visual Testing
- [ ] **High contrast mode**: Test in system high contrast mode
- [ ] **Dark mode**: Ensure contrast maintained (future)
- [ ] **Zoom testing**: Test at 200% zoom level
- [ ] **Color blindness**: Test with color blindness simulators
- [ ] **Reduced motion**: Respect reduce motion preferences

---

## 8. Common Issues & Solutions

### Issue: Low Color Contrast
**Problem**: Text doesn't meet 4.5:1 contrast ratio
**Solution**: 
- Use darker text colors on light backgrounds
- Use lighter text colors on dark backgrounds
- Test with contrast checking tools
- Consider adding background colors for better contrast

### Issue: Small Touch Targets
**Problem**: Interactive elements smaller than 44pt
**Solution**:
- Increase button padding
- Add transparent touch area around small elements
- Use `minHeight` and `minWidth` properties
- Test on actual devices with fingers

### Issue: Missing Accessibility Labels
**Problem**: Screen readers can't identify element purpose
**Solution**:
- Add descriptive `accessibilityLabel` props
- Use `accessibilityHint` for additional context
- Ensure labels describe function, not appearance
- Test with screen reader enabled

### Issue: Poor Focus Management
**Problem**: Focus jumps unexpectedly or gets lost
**Solution**:
- Implement proper focus order
- Return focus to logical elements after actions
- Use focus management utilities
- Test keyboard navigation thoroughly

### Issue: Text Doesn't Scale
**Problem**: Text remains small when user increases system text size
**Solution**:
- Use relative text sizing
- Test with large accessibility text sizes
- Ensure layout adapts to larger text
- Use dynamic text sizing utilities

---

## 9. Accessibility Testing Tools

### Development Tools
- **React Native Accessibility Inspector**: Built into React Native debugger
- **Flipper Accessibility Plugin**: Visual accessibility tree inspection
- **ESLint Plugin**: `eslint-plugin-react-native-a11y` for code linting

### Device Testing Tools
- **iOS Accessibility Inspector**: Settings > Accessibility > Accessibility Inspector
- **Android Accessibility Scanner**: Download from Play Store
- **VoiceOver**: iOS built-in screen reader
- **TalkBack**: Android built-in screen reader

### Online Tools
- **WebAIM Contrast Checker**: https://webaim.org/resources/contrastchecker/
- **Colour Contrast Analyser**: Desktop app for contrast testing
- **axe DevTools**: Browser extension for accessibility testing

### Color Blindness Testing
- **Sim Daltonism**: macOS app for color blindness simulation
- **Color Oracle**: Cross-platform color blindness simulator
- **Coblis**: Online color blindness simulator

---

## 10. Validation Steps

### Pre-Release Checklist
- [ ] **All automated tests pass**
- [ ] **Manual screen reader testing completed**
- [ ] **Keyboard navigation tested**
- [ ] **Color contrast validated**
- [ ] **Touch targets verified**
- [ ] **Dynamic text scaling tested**
- [ ] **Focus management verified**
- [ ] **Loading states accessible**
- [ ] **Error states accessible**
- [ ] **Empty states accessible**

### Code Review Checklist
- [ ] **Accessibility props present** on interactive elements
- [ ] **Semantic HTML/components** used appropriately
- [ ] **Color not sole indicator** of information
- [ ] **Text alternatives** provided for images/icons
- [ ] **Focus order** logical and predictable
- [ ] **Error messages** descriptive and helpful
- [ ] **Form labels** properly associated

### QA Testing Checklist
- [ ] **Test with screen reader** on actual devices
- [ ] **Test keyboard navigation** with external keyboard
- [ ] **Test at 200% text scale**
- [ ] **Test in high contrast mode**
- [ ] **Test with reduce motion enabled**
- [ ] **Test all user flows** end-to-end
- [ ] **Verify error handling** is accessible

---

## 11. Documentation & Training

### Team Resources
- **WCAG 2.1 Guidelines**: https://www.w3.org/WAI/WCAG21/quickref/
- **React Native Accessibility**: https://reactnative.dev/docs/accessibility
- **Apple Accessibility**: https://developer.apple.com/accessibility/
- **Android Accessibility**: https://developer.android.com/guide/topics/ui/accessibility

### Internal Documentation
- **Component accessibility examples** in Storybook
- **Accessibility testing procedures** in QA documentation
- **Design system accessibility guidelines**
- **Code review accessibility checklist**

---

## 12. Continuous Improvement

### Metrics to Track
- **Automated test coverage** for accessibility
- **Manual testing completion** rates
- **User feedback** on accessibility
- **Accessibility violations** found in reviews

### Regular Audits
- **Monthly accessibility reviews** of new features
- **Quarterly comprehensive audits** of entire app
- **Annual third-party accessibility audits**
- **User testing** with people with disabilities

### Feedback Channels
- **In-app feedback** for accessibility issues
- **Support email** for accessibility concerns
- **Community forums** for accessibility discussions
- **Regular user research** with diverse users

---

## Quick Start Guide

### For Developers
1. **Install accessibility linting**: Add `eslint-plugin-react-native-a11y`
2. **Use accessibility props**: Always add labels and roles
3. **Test with screen reader**: Enable VoiceOver/TalkBack during development
4. **Run automated tests**: Include accessibility tests in your workflow

### For Designers
1. **Design with contrast**: Use high contrast color combinations
2. **Size touch targets**: Minimum 44pt for all interactive elements
3. **Consider focus states**: Design visible focus indicators
4. **Test with scaling**: Ensure designs work with large text

### For QA
1. **Enable accessibility tools**: Use built-in accessibility inspectors
2. **Test with assistive tech**: Use screen readers and keyboard navigation
3. **Validate contrast**: Use contrast checking tools
4. **Test edge cases**: Large text, high contrast, reduce motion

---

## Emergency Accessibility Fixes

### Critical Issues (Fix Immediately)
- **Completely inaccessible features** (no screen reader access)
- **Severe contrast violations** (< 3:1 ratio)
- **Keyboard traps** (focus gets stuck)
- **Missing form labels** (forms unusable with screen reader)

### High Priority Issues (Fix in Next Release)
- **Minor contrast violations** (3:1 - 4.5:1 for normal text)
- **Small touch targets** (< 44pt)
- **Missing accessibility labels** (confusing but not blocking)
- **Poor focus order** (illogical but navigable)

### Medium Priority Issues (Fix in Upcoming Releases)
- **Missing accessibility hints**
- **Suboptimal focus indicators**
- **Text scaling issues**
- **Reduce motion not respected**

---

This checklist should be reviewed and updated regularly as the app evolves and accessibility standards change. Remember: accessibility is not a one-time task but an ongoing commitment to inclusive design.