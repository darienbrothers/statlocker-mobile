# Mobile App Shell Design (Mobbin-Quality)

## Overview

The Mobile App Shell creates a production-grade foundation for the StatLocker mobile application that matches the polish and quality of top iOS apps featured on Mobbin. The shell provides crisp information architecture, unified design tokens, smooth motion, robust accessibility, and dependable patterns through the Screen component and sticky CTA system.

This design focuses exclusively on light mode for MVP while establishing a scalable foundation for future features. The shell serves as the contract for all upcoming features (Auth, Paywall, Onboarding) with stable tokens and components that extend rather than replace.

## Architecture

### Navigation Structure & Information Architecture

**Boot Flow:**
1. Wait for auth resolution
2. Route to (auth) if signed-out
3. Route to (tabs) if signed-in (persisted sessions resume)

**File Layout:**
```
app/
├── (auth)/
│   ├── sign-in.tsx          # Authentication screen
│   └── onboarding/
│       └── index.tsx        # Future onboarding flow
└── (tabs)/
    ├── _layout.tsx          # Tab navigation layout
    ├── dashboard.tsx        # Main dashboard (Locker)
    ├── stats.tsx            # Stats and analytics
    ├── goals.tsx            # Goals and achievements
    └── recruiting.tsx       # Recruiting roadmap
```

**Project Structure & Path Aliases:**
```
src/
├── components/              # Reusable UI components
├── features/               # Feature-specific components
├── store/                  # Zustand state stores
├── lib/                    # Utilities and configurations
├── services/               # API and external services
└── types/                  # TypeScript type definitions
```

**TypeScript Configuration:**
- Path alias: `@/*` → `src/*`
- Update tsconfig.json and Babel configuration

### Authentication Flow

```mermaid
graph TD
    A[App Launch] --> B[Auth Gate/Splash]
    B --> C{Auth State Check}
    C -->|Signed Out| D[(auth) Group]
    C -->|Signed In| E[(tabs) Group]
    D --> F[Welcome Screen]
    F --> G[Sign In]
    G --> H[Onboarding]
    H --> E
    E --> I[Dashboard]
```

### State Management Architecture

```typescript
// Core app state structure
interface AppState {
  auth: {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
  };
  navigation: {
    activeTab: TabName;
    previousRoute: string;
  };
  ui: {
    isKeyboardVisible: boolean;
    isOffline: boolean;
    theme: ThemeConfig;
  };
}
```

## Components and Interfaces

### Core Layout Components

#### Screen Primitive
The foundational layout component with precise API:

```typescript
interface ScreenProps {
  children: React.ReactNode;
  title?: string;
  scroll?: boolean;
  stickyCta?: React.ReactNode;
  gradientUnderCta?: boolean;
  testID?: string;
  className?: string;
}
```

**Layout Structure:**
- Safe-area aware container
- Header (optional) with title
- Content area (scroll or static)
- Bottom inset padding

**Sticky CTA Integration:**
- When `stickyCta` is present: provide bottom container (72–80pt total: 56pt button + 16pt inset)
- Apply translucent bottom gradient under CTA when content scrolls (`gradientUnderCta`)
- **Keyboard-aware:** Never overlaps keyboard on iOS/Android
- **No layout shift** when CTA appears/disappears

#### Sticky CTA Component
Production-grade bottom CTA with micro-interactions:

```typescript
interface StickyCTAProps {
  variant: 'primary' | 'secondary' | 'fab';
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
  testID?: string;
}
```

**Design Specifications:**
- **Primary button:** 56pt height, full-width, `rounded-2xl`, `shadow-cta`
- **Micro-interaction:** Scale to 0.98 on press (120ms), light haptic feedback
- **States:**
  - Default: Full opacity with shadow
  - Loading: Spinner with reduced opacity
  - Disabled: Reduced opacity, no shadow
- **Focus ring:** 2px (outer `#0047AB`, inner `#9CA3AF`)
- **Keyboard safety:** Automatically adjusts position to avoid keyboard overlap

### Navigation Components

#### Tab Bar Design
Bottom tab navigation with precise specifications:

```typescript
interface TabConfig {
  name: string;
  title: string;
  icon: IconName;
  activeIcon?: IconName;
}

const tabs: TabConfig[] = [
  { name: 'dashboard', title: 'Dashboard', icon: 'home' },
  { name: 'stats', title: 'Stats', icon: 'trending-up' },
  { name: 'goals', title: 'Goals', icon: 'target' },
  { name: 'recruiting', title: 'Recruiting', icon: 'compass' }
];
```

**Design Specifications:**
- **Height:** 64–68pt + safe area inset (not 80+)
- **Top border:** `border-t border-gray-200`
- **Active indicator:** 2px pill-underline that slides between items (200ms ease-out, 8px rounded ends)
- **Icon system:** One set only (Lucide or Phosphor), 24pt size
- **Labels:** 12–13pt medium weight
- **States:**
  - Active: `text-primary-900` (duotone/filled icons)
  - Inactive: `text-gray-500` (outline icons)
- **Animation:** Cross-fade tab content (avoid heavy slides)

## Design Tokens (Unified Brand System)

### Color System
**Single Royal Blue Brand System** - No mixing other blue scales

```typescript
interface ColorTokens {
  // Primary Brand Colors (Royal Blue)
  primary: {
    900: '#0047AB';  // Royal Blue (brand)
    800: '#1558B8';
    700: '#1F56C4';
    600: '#2E6FD6';
    500: '#3A84E9';
    100: '#E6F0FF';
  };
  
  // Status Colors
  success: '#00D4FF';    // Aqua Glow
  warning: '#F5C542';    // Momentum Gold
  danger: '#DC2626';     // Crimson Red
  
  // Neutral Colors
  gray: {
    50: '#F9FAFB';
    100: '#F3F4F6';
    200: '#E5E7EB';
    400: '#9CA3AF';
    500: '#6B7280';
    900: '#111827';
  };
  
  // Surfaces
  white: '#FFFFFF';
  muted: '#1F1F1F';
  
  // Focus Ring
  focusOuter: '#0047AB';
  focusInner: '#9CA3AF';
}
```

### Spacing Scale (8pt Rhythm)
```typescript
spacing: {
  1: 4,   // 4pt
  2: 8,   // 8pt
  3: 12,  // 12pt
  4: 16,  // 16pt
  5: 20,  // 20pt
  6: 24,  // 24pt
  8: 32,  // 32pt
  10: 40, // 40pt
}
```

### Border Radius & Shadows
```typescript
borderRadius: {
  xl: 16,    // 16pt
  '2xl': 24, // 24pt
  '3xl': 28, // 28pt
  '4xl': 32, // 32pt
}

shadows: {
  card: '0 1px 2px rgba(0,0,0,.06), 0 8px 24px rgba(0,0,0,.06)',
  cta: '0 8px 24px rgba(0,71,171,.18)',
}
```

### Typography Scale
```typescript
typography: {
  // Titles: 22–24pt semibold
  title: {
    fontSize: 22,
    fontWeight: '600',
  },
  
  // Body: 15–16pt regular
  body: {
    fontSize: 16,
    fontWeight: '400',
  },
  
  // Captions: 12–13pt medium
  caption: {
    fontSize: 12,
    fontWeight: '500',
  },
}
```

### UI Component State Models

```typescript
interface ComponentState {
  variant: 'primary' | 'secondary' | 'ghost' | 'outline';
  size: 'sm' | 'md' | 'lg';
  state: 'default' | 'hover' | 'pressed' | 'disabled' | 'loading';
}

interface AccessibilityProps {
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityRole?: string;
  testID?: string;
}
```

## Error Handling

### Global Error Boundary

```typescript
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
}
```

**Error Recovery Flow:**
1. Catch JavaScript errors in React components
2. Display user-friendly error message with StatLocker branding
3. Provide "Try Again" action that resets the error boundary
4. Log errors to Sentry for monitoring
5. Maintain app state when possible

### Network State Management

```typescript
interface NetworkState {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  type: NetworkStateType;
}
```

**Offline Banner Design:**
- Position: Top of screen, below status bar
- Background: Warning yellow (#F59E0B)
- Text: "You're offline. Some features may be limited."
- Auto-hide when connection restored

## Testing Strategy

### Component Testing Approach

**UI Kit Components:**
- Render tests for all variants and states
- Accessibility compliance verification
- Interaction testing (press, focus, disabled states)
- Visual regression testing for design consistency

**Layout Components:**
- Safe area handling across different device sizes
- Keyboard behavior testing
- Navigation flow testing
- Performance testing for smooth animations

### Integration Testing

**Authentication Flow:**
- Auth state persistence and restoration
- Route group switching
- Onboarding completion flow

**Navigation Testing:**
- Tab switching with state preservation
- Deep linking support
- Back navigation behavior

### Accessibility Testing

**WCAG AA Compliance:**
- Color contrast ratios (minimum 4.5:1 for normal text)
- Touch target sizes (minimum 44x44pt)
- Screen reader compatibility
- Focus management and keyboard navigation

### Performance Testing

**60fps Target:**
- Animation performance monitoring
- Layout shift prevention
- Memory usage optimization
- Bundle size analysis

## Implementation Phases

### Phase 1: Core Infrastructure
1. Expo Router setup with route groups
2. NativeWind configuration with design tokens
3. Basic Screen and CTA components
4. Authentication state management

### Phase 2: Navigation & Theming
1. Tab navigation implementation
2. Complete design token system
3. Global error boundary
4. Network state monitoring

### Phase 3: UI Kit Foundation
1. Button component with all variants
2. Card, Tag, Progress components
3. EmptyState and Skeleton components
4. Accessibility compliance verification

### Phase 4: Advanced Features
1. Haptic feedback integration
2. Animation system with Reanimated
3. Analytics event tracking
4. Performance optimization

### Phase 5: Polish & Testing
1. Comprehensive testing suite
2. Visual regression testing
3. Performance monitoring
4. Documentation completion

## Design Decisions & Rationales

### NativeWind Over Styled Components
- **Decision:** Use NativeWind for styling
- **Rationale:** Provides design token integration, consistent class-based styling, and better performance than runtime CSS-in-JS solutions

### Zustand Over Redux
- **Decision:** Use Zustand for state management
- **Rationale:** Simpler API, smaller bundle size, and sufficient for app complexity while maintaining TypeScript support

### Expo Router Over React Navigation
- **Decision:** Use Expo Router for navigation
- **Rationale:** File-based routing aligns with modern web patterns, better TypeScript integration, and simplified deep linking

### Light Mode Only
- **Decision:** Support light mode only for MVP
- **Rationale:** Reduces complexity, aligns with StatLocker's clean aesthetic, and allows focus on core functionality

### Bottom Tabs Over Drawer Navigation
- **Decision:** Use bottom tabs for primary navigation
- **Rationale:** Better thumb accessibility on mobile devices, clearer information architecture, and aligns with iOS/Android conventions
## 
Technical Implementation Details

### NativeWind Configuration

```javascript
// tailwind.config.js
module.exports = {
  content: [
    "./App.{ts,tsx}", 
    "./app/**/*.{ts,tsx}", 
    "./src/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        // Single Royal Blue Brand System
        primary: {
          900: "#0047AB", // Royal Blue (brand)
          800: "#1558B8",
          700: "#1F56C4", 
          600: "#2E6FD6",
          500: "#3A84E9",
          100: "#E6F0FF"
        },
        
        // Status Colors
        success: "#00D4FF",  // Aqua Glow
        warning: "#F5C542",  // Momentum Gold
        danger: "#DC2626",   // Crimson Red
        
        // Neutral Grays
        gray: {
          50: "#F9FAFB",
          100: "#F3F4F6", 
          200: "#E5E7EB",
          400: "#9CA3AF",
          500: "#6B7280",
          900: "#111827"
        }
      },
      
      // 8pt Spacing Scale
      spacing: {
        1: 4,   // 4pt
        2: 8,   // 8pt  
        3: 12,  // 12pt
        4: 16,  // 16pt
        5: 20,  // 20pt
        6: 24,  // 24pt
        8: 32,  // 32pt
        10: 40  // 40pt
      },
      
      borderRadius: {
        xl: 16,     // 16pt
        "2xl": 24,  // 24pt
        "3xl": 28,  // 28pt
        "4xl": 32   // 32pt
      },
      
      boxShadow: {
        card: "0 1px 2px rgba(0,0,0,.06), 0 8px 24px rgba(0,0,0,.06)",
        cta: "0 8px 24px rgba(0,71,171,.18)"
      }
    }
  },
  plugins: []
};
```

### Styling Rules
- **Use className only** - Avoid inline styles except for unavoidable layout hacks
- **All shared components accept className** and composition via Tailwind utilities
- **Consistent application** of design tokens across all components

### Component Specifications

#### UI Kit Components

**Button Variants:**
```typescript
// Primary Button
className="bg-primary-900 text-white px-6 py-4 rounded-2xl font-semibold text-base min-h-[56px] active:bg-primary-700 disabled:bg-gray-200 disabled:text-gray-400"

// Secondary Button  
className="bg-white border-2 border-primary-900 text-primary-900 px-6 py-4 rounded-2xl font-semibold text-base min-h-[56px] active:bg-primary-100"

// Ghost Button
className="bg-transparent text-primary-900 px-6 py-4 rounded-2xl font-semibold text-base min-h-[56px] active:bg-primary-100"
```

**Card Components:**
```typescript
// Base Card
className="bg-white rounded-2xl p-5 shadow-card border border-gray-100"

// StatCard with consistent hierarchy
interface StatCardProps {
  title: string;    // 15–16pt semibold
  value: string;    // 22–24pt bold (stable number format; .0% acceptable for 0 stats)
  delta?: {         // ▲/▼ right-aligned in text-success or text-danger
    value: string;
    direction: 'up' | 'down';
  };
}
```

**Tag/Chip Components:**
```typescript
// Default Tag
className="bg-gray-100 text-gray-900 px-3 py-1.5 rounded-full text-sm font-medium"

// Success Tag
className="bg-success/10 text-success px-3 py-1.5 rounded-full text-sm font-medium"

// Primary Tag  
className="bg-primary-100 text-primary-900 px-3 py-1.5 rounded-full text-sm font-medium"
```

**Consistency Rule:** Never mix unrounded cards and rounded cards in the same view

## Loading, Empty, Error & Offline States

### Loading States (Skeletons)
- **Skeletons:** Rectangles and text bars matching card/grid proportions
- **Consistent styling:** Match the layout structure of actual content
- **Subtle animation:** Gentle shimmer effect

### Empty States
- **Format:** 1-line promise + one CTA
- **Example:** Stats → "No games yet—log your first game to unlock trends." → "Log a Game"
- **Tone:** Encouraging and actionable

### Error Handling
- **Error boundary:** Global boundary with friendly retry message
- **Recovery action:** Clear "Try Again" button
- **Logging:** Automatic error reporting to monitoring service

### Offline Banner
- **Trigger:** When expo-network reports offline
- **Position:** Sticky banner at top of screen
- **Message:** "You're offline. Some features may be limited."
- **Auto-hide:** When connection restored

## Motion Guidelines

### Timing Standards
- **Entrances:** 180–240ms ease-out
- **Exits:** 120–160ms ease-in
- **Stagger lists:** 20–30ms per item (Dashboard)
- **Tab transitions:** Cross-fade between tabs
- **Card entry:** Subtle translateY-8 animation

### Animation Principles
- **Keep animations subtle** - Maintain 60fps performance
- **Avoid heavy slides** - Use cross-fade for tab content
- **Consistent easing** - Use standard iOS/Android curves
- **Performance first** - No animation should drop frames

### Tab Transition Animation

```typescript
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming 
} from 'react-native-reanimated';

// Tab underline slide animation
const underlineAnimation = useAnimatedStyle(() => ({
  transform: [
    {
      translateX: withTiming(activeTabPosition, {
        duration: 200,
        easing: Easing.out(Easing.cubic),
      }),
    },
  ],
}));

// Content cross-fade
const contentAnimation = useAnimatedStyle(() => ({
  opacity: withTiming(isActive ? 1 : 0, {
    duration: 180,
  }),
  transform: [
    {
      translateY: withTiming(isActive ? 0 : 8, {
        duration: 180,
      }),
    },
  ],
}));
```

## Accessibility Standards (WCAG AA)

### Touch Targets & Interaction
- **Minimum touch targets:** ≥ 44×44pt for all interactive elements
- **Labels:** Proper accessibility labels on CTA and tab items
- **Focus ring support:** Keyboard focus ring for iPad/physical keyboard users
- **Haptic feedback:** Light impact on tab and CTA presses via expo-haptics (debounced for rapid interactions)

### Visual Accessibility
- **Color contrast:** WCAG AA contrast on all text over white backgrounds
- **Primary color verification:** Ensure primary blue meets contrast requirements over white
- **Dynamic type:** Font scaling support up to Large accessibility sizes
- **No color-only information:** Use icons + text for status communication

### Screen Reader Support

```typescript
// Screen component accessibility
<View
  accessible={true}
  accessibilityRole="main"
  accessibilityLabel={`${title} screen`}
>
  {/* Screen content */}
</View>

// Tab accessibility
<Pressable
  accessible={true}
  accessibilityRole="tab"
  accessibilityLabel={`${title} tab`}
  accessibilityState={{
    selected: isActive,
  }}
>
  {/* Tab content */}
</Pressable>
```

## Performance Budgets

### Frame Rate Targets
- **60fps on tab switches** and all interactions
- **No layout shift** when CTA appears/disappears
- **Smooth animations** - No dropped frames during transitions

### Optimization Strategies
- **Lazy-load imagery** - Use placeholder images during loading
- **Memoize heavy lists** - Prevent unnecessary re-renders
- **Avoid re-render storms** - Optimize state updates
- **Bundle size monitoring** - Track and optimize app size

### Memory Management
```typescript
// Image optimization example
<Image
  source={{ uri: imageUrl }}
  style={styles.image}
  resizeMode="cover"
  fadeDuration={200}
  defaultSource={require('../assets/placeholder.png')}
/>
```

### Performance Optimizations

#### Lazy Loading Strategy

```typescript
// Lazy load tab screens
const Dashboard = lazy(() => import('../screens/Dashboard'));
const Stats = lazy(() => import('../screens/Stats'));
const Goals = lazy(() => import('../screens/Goals'));
const Recruiting = lazy(() => import('../screens/Recruiting'));
```

#### Memory Management

```typescript
// Image optimization
<Image
  source={{ uri: imageUrl }}
  style={styles.image}
  resizeMode="cover"
  fadeDuration={200}
  // Optimize memory usage
  defaultSource={require('../assets/placeholder.png')}
/>
```

## Analytics Integration

### Event Tracking Requirements
- **Screen views:** Emit for each route navigation
- **Tab changes:** Track tab switches with tab key
- **Adapter pattern:** `src/lib/analytics.ts` for provider flexibility

### Analytics Adapter Implementation

```typescript
// src/lib/analytics.ts
interface AnalyticsEvent {
  screen_view: {
    screen_name: string;
    screen_class: string;
    previous_screen?: string;
  };
  
  tab_change: {
    from_tab: string;
    to_tab: string;
    timestamp: number;
  };
  
  cta_press: {
    cta_type: 'primary' | 'secondary' | 'fab';
    screen_name: string;
    action: string;
  };
}

class AnalyticsAdapter {
  static track<T extends keyof AnalyticsEvent>(
    eventName: T,
    properties: AnalyticsEvent[T]
  ) {
    if (__DEV__) {
      console.log('Analytics:', eventName, properties);
      return;
    }
    
    // PostHog or Firebase Analytics
    // Implementation swappable via adapter pattern
  }
  
  static screen(screenName: string) {
    this.track('screen_view', {
      screen_name: screenName,
      screen_class: screenName,
    });
  }
  
  static tabChange(fromTab: string, toTab: string) {
    this.track('tab_change', {
      from_tab: fromTab,
      to_tab: toTab,
      timestamp: Date.now(),
    });
  }
}
```

## Testing & CI Strategy

### Unit Testing Requirements
- **UI Kit atoms:** Button, Screen, StickyCTA, EmptyState, Skeleton
- **Test coverage:** Render tests + state variations
- **Tab placeholders:** Basic render tests for each tab

### CI Pipeline
- **TypeScript:** Strict mode type checking
- **Linting:** ESLint + Prettier enforcement
- **Tests:** Unit test execution
- **Merge blocking:** CI must pass before merge

### Testing Example
```typescript
// Button.test.tsx
describe('Button Component', () => {
  it('renders primary variant correctly', () => {
    render(<Button variant="primary">Test Button</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-primary-900');
  });
  
  it('handles disabled state', () => {
    render(<Button disabled>Disabled Button</Button>);
    expect(screen.getByRole('button')).toHaveClass('disabled:bg-gray-200');
  });
});
```

### Development Tools Configuration

#### TypeScript Configuration

```json
{
  "compilerOptions": {
    "strict": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@/components/*": ["src/components/*"],
      "@/screens/*": ["src/screens/*"],
      "@/hooks/*": ["src/hooks/*"],
      "@/store/*": ["src/store/*"],
      "@/lib/*": ["src/lib/*"],
      "@/types/*": ["src/types/*"]
    }
  }
}
```

#### ESLint Configuration

```json
{
  "extends": [
    "expo",
    "@react-native-community",
    "plugin:@typescript-eslint/recommended"
  ],
  "rules": {
    "react-native/no-inline-styles": "error",
    "@typescript-eslint/no-unused-vars": "error",
    "react-hooks/exhaustive-deps": "warn"
  }
}
```

This comprehensive design document provides the technical foundation for implementing the StatLocker mobile app shell with all the specified requirements, maintaining brand consistency, accessibility standards, and performance targets.## Im
plementation Notes & High-Level Tasks

### Configuration Phase
1. **Configure NativeWind + tokens** - Implement unified color system and confirm className flows through all atoms
2. **Project structure** - Set up src/ folders and path aliases (@/* → src/*)
3. **TypeScript strict mode** - Enable strict configuration with proper path mapping

### Core Components Phase  
1. **Build Screen and StickyCTA** - Implement keyboard-aware behavior and gradient option
2. **Implement Tab Bar** - 64–68pt height, underline slide animation, duotone icons, 12–13pt labels
3. **Create UI Kit atoms** - Button (primary/secondary/ghost), Card, Tag, Progress, Divider, EmptyState, Skeleton

### State & Patterns Phase
1. **Add loading patterns** - Skeletons and Empty states to each tab placeholder
2. **Error boundary** - Global error handling with friendly retry
3. **Offline banner** - Network state monitoring and user feedback

### Polish & Integration Phase
1. **Analytics adapter** - Wire screen_view + tab_change events
2. **Haptics integration** - Add feedback to CTA and tab presses
3. **Testing setup** - Enforce TS strict, ESLint/Prettier, add initial unit tests

## Acceptance Checklist (Design Parity)

### Visual Design Standards
- [ ] **Color system** uses single Royal Blue brand (no mixing other blues)
- [ ] **Spacing** follows 8pt scale; paddings/gaps are consistent across components
- [ ] **Cards** share same radius/shadow/border; StatCard value/label/delta rhythm is consistent
- [ ] **Typography** matches specifications (titles 22–24pt semibold, body 15–16pt, captions 12–13pt)

### Navigation & Interaction
- [ ] **Tab Bar** ≤ 68pt (+ inset), underline slide 200ms, duotone icons, 12–13pt labels
- [ ] **Sticky CTA** is keyboard-safe, gradient-backed, haptic on press, with loading/disabled states
- [ ] **Tab switches** feel 60fps with cross-fade content transitions
- [ ] **Focus management** works properly for accessibility

### Motion & Performance
- [ ] **Motion timings** match guidelines (entrances 180–240ms, exits 120–160ms)
- [ ] **List staggering** implemented subtly (20–30ms per item)
- [ ] **No CTA-related layout shift** when appearing/disappearing
- [ ] **Images lazy-load** and use proper placeholder strategies

### Content & States
- [ ] **Each tab** has purposeful empty state (1 line + single action)
- [ ] **Loading skeletons** match actual content proportions
- [ ] **Error boundary** provides friendly recovery experience
- [ ] **Offline banner** appears/disappears based on network state

### Accessibility & Quality
- [ ] **Touch targets** ≥44pt for all interactive elements
- [ ] **WCAG AA contrast** verified on all text combinations
- [ ] **Screen reader labels** implemented on navigation and CTA elements
- [ ] **Dynamic type support** up to Large accessibility sizes

### Technical Standards
- [ ] **Tests exist** for key UI atoms (Button, Screen, StickyCTA, etc.)
- [ ] **CI runs** typecheck/lint/tests and blocks merge on failure
- [ ] **Analytics events** fire correctly for screen views and tab changes
- [ ] **TypeScript strict mode** enabled with no type errors

## Design Contract

This shell serves as the **foundational contract** for all upcoming StatLocker features:

- **Auth flows** will use Screen + StickyCTA patterns
- **Paywall** will leverage the established button and card components  
- **Onboarding** will follow the motion and accessibility guidelines
- **Feature screens** will extend (not replace) the design token system

**Stability commitment:** Keep tokens and core components stable; extend functionality rather than breaking changes to maintain consistency across the entire application.