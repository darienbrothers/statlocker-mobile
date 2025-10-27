# StatLocker Design Tokens

This document maps design names to Tailwind classes for developers. Use these tokens consistently throughout the app to maintain brand consistency and accessibility standards.

## Color System

### Primary Colors (Royal Blue Brand)

| Design Name | Tailwind Class | Hex Value | Usage |
|-------------|----------------|-----------|-------|
| Royal Blue (Brand) | `text-primary-900` / `bg-primary-900` | `#0047AB` | Primary buttons, active states, brand elements |
| Primary 800 | `text-primary-800` / `bg-primary-800` | `#1558B8` | Hover states, secondary brand elements |
| Primary 700 | `text-primary-700` / `bg-primary-700` | `#1F56C4` | Pressed states, darker variants |
| Primary 600 | `text-primary-600` / `bg-primary-600` | `#2E6FD6` | Interactive elements |
| Primary 500 | `text-primary-500` / `bg-primary-500` | `#3A84E9` | Light interactive elements |
| Primary 100 | `text-primary-100` / `bg-primary-100` | `#E6F0FF` | Light backgrounds, subtle highlights |

### Status Colors

| Design Name | Tailwind Class | Hex Value | Usage |
|-------------|----------------|-----------|-------|
| Aqua Glow (Success) | `text-success` / `bg-success` | `#00D4FF` | Success states, positive feedback |
| Momentum Gold (Warning) | `text-warning` / `bg-warning` | `#F5C542` | Warning states, caution indicators |
| Crimson Red (Danger) | `text-danger` / `bg-danger` | `#DC2626` | Error states, destructive actions |

### Neutral Colors

| Design Name | Tailwind Class | Hex Value | Usage |
|-------------|----------------|-----------|-------|
| Gray 50 | `text-gray-50` / `bg-gray-50` | `#F9FAFB` | Light backgrounds |
| Gray 100 | `text-gray-100` / `bg-gray-100` | `#F3F4F6` | Card backgrounds, subtle dividers |
| Gray 200 | `text-gray-200` / `bg-gray-200` | `#E5E7EB` | Borders, dividers |
| Gray 400 | `text-gray-400` / `bg-gray-400` | `#9CA3AF` | Placeholder text, disabled states |
| Gray 500 | `text-gray-500` / `bg-gray-500` | `#6B7280` | Secondary text, inactive elements |
| Gray 900 | `text-gray-900` / `bg-gray-900` | `#111827` | Primary text, high contrast elements |
| White | `text-white` / `bg-white` | `#FFFFFF` | Primary backgrounds, reverse text |

### Focus Ring Colors

| Design Name | Tailwind Class | Hex Value | Usage |
|-------------|----------------|-----------|-------|
| Focus Outer | `ring-focus-outer` | `#0047AB` | Outer focus ring |
| Focus Inner | `ring-focus-inner` | `#9CA3AF` | Inner focus ring |

## Spacing System (8pt Grid)

| Design Name | Tailwind Class | Value | Usage |
|-------------|----------------|-------|-------|
| 1 | `p-1`, `m-1`, `gap-1` | 4px | Minimal spacing |
| 2 | `p-2`, `m-2`, `gap-2` | 8px | Small spacing |
| 3 | `p-3`, `m-3`, `gap-3` | 12px | Medium-small spacing |
| 4 | `p-4`, `m-4`, `gap-4` | 16px | Standard spacing |
| 5 | `p-5`, `m-5`, `gap-5` | 20px | Medium spacing |
| 6 | `p-6`, `m-6`, `gap-6` | 24px | Large spacing |
| 8 | `p-8`, `m-8`, `gap-8` | 32px | Extra large spacing |
| 10 | `p-10`, `m-10`, `gap-10` | 40px | Maximum spacing |

### Component-Specific Spacing

| Design Name | Tailwind Class | Value | Usage |
|-------------|----------------|-------|-------|
| CTA Height | `h-14`, `min-h-14` | 56px | Button height |
| Tab Bar Base | `h-16` | 64px | Minimum tab bar height |
| Tab Bar Max | `h-17` | 68px | Maximum tab bar height |
| CTA Container | `h-18` | 72px | CTA container height |
| CTA with Inset | `h-20` | 80px | CTA container with safe area |

## Border Radius

| Design Name | Tailwind Class | Value | Usage |
|-------------|----------------|-------|-------|
| XL | `rounded-xl` | 16px | Cards, buttons |
| 2XL | `rounded-2xl` | 24px | Large cards, CTAs |
| 3XL | `rounded-3xl` | 28px | Special components |
| 4XL | `rounded-4xl` | 32px | Hero elements |

## Shadows

| Design Name | Tailwind Class | Usage |
|-------------|----------------|-------|
| Card Shadow | `shadow-card` | Cards, elevated surfaces |
| CTA Shadow | `shadow-cta` | Primary buttons, floating elements |

## Typography

### Font Sizes & Weights

| Design Name | Tailwind Class | Size | Line Height | Weight | Usage |
|-------------|----------------|------|-------------|--------|-------|
| Caption | `text-xs font-medium` | 12px | 16px | 500 | Small labels, metadata |
| Caption Large | `text-sm font-medium` | 13px | 18px | 500 | Tab labels, secondary info |
| Body | `text-base` | 16px | 24px | 400 | Primary content |
| Body Small | `text-lg` | 15px | 22px | 400 | Secondary content |
| Title | `text-2xl font-semibold` | 22px | 30px | 600 | Section headers |
| Title Large | `text-3xl font-semibold` | 24px | 32px | 600 | Page headers |

### Font Family

| Design Name | Tailwind Class | Usage |
|-------------|----------------|-------|
| Sans Serif | `font-sans` | All text (Inter font) |
| Display | `font-display` | Headers, special text |

## Component Examples

### Buttons

```tsx
// Primary Button
<Pressable className="bg-primary-900 text-white px-6 py-4 rounded-2xl font-semibold text-base min-h-14 active:bg-primary-700 disabled:bg-gray-200 disabled:text-gray-400">
  <Text className="text-white font-semibold">Primary Action</Text>
</Pressable>

// Secondary Button
<Pressable className="bg-white border-2 border-primary-900 text-primary-900 px-6 py-4 rounded-2xl font-semibold text-base min-h-14 active:bg-primary-100">
  <Text className="text-primary-900 font-semibold">Secondary Action</Text>
</Pressable>

// Ghost Button
<Pressable className="bg-transparent text-primary-900 px-6 py-4 rounded-2xl font-semibold text-base min-h-14 active:bg-primary-100">
  <Text className="text-primary-900 font-semibold">Ghost Action</Text>
</Pressable>
```

### Cards

```tsx
// Base Card
<View className="bg-white rounded-2xl p-5 shadow-card border border-gray-100">
  <Text className="text-gray-900 text-base">Card content</Text>
</View>

// StatCard
<View className="bg-white rounded-2xl p-5 shadow-card border border-gray-100">
  <Text className="text-gray-500 text-sm font-medium">Save Percentage</Text>
  <Text className="text-gray-900 text-3xl font-bold">87.5%</Text>
  <View className="flex-row items-center">
    <Text className="text-success text-sm font-medium">▲ +2.3%</Text>
  </View>
</View>
```

### Tags/Chips

```tsx
// Default Tag
<View className="bg-gray-100 text-gray-900 px-3 py-1.5 rounded-full">
  <Text className="text-gray-900 text-sm font-medium">Default</Text>
</View>

// Success Tag
<View className="bg-success/10 px-3 py-1.5 rounded-full">
  <Text className="text-success text-sm font-medium">Success</Text>
</View>

// Primary Tag
<View className="bg-primary-100 px-3 py-1.5 rounded-full">
  <Text className="text-primary-900 text-sm font-medium">Primary</Text>
</View>
```

### Focus Rings

```tsx
// Accessible Focus Ring
<Pressable className="rounded-xl focus:ring-2 focus:ring-focus-outer focus:ring-offset-2 focus:ring-offset-focus-inner">
  <Text>Focusable Element</Text>
</Pressable>
```

## Accessibility Guidelines

### Color Contrast

All color combinations meet WCAG AA standards:
- **Primary 900 on White**: 4.5:1 ratio ✅
- **Gray 900 on White**: 4.5:1 ratio ✅
- **Gray 500 on White**: 4.5:1 ratio ✅

### Touch Targets

- **Minimum size**: 44×44pt (use `min-h-touch min-w-touch`)
- **Recommended size**: 56×56pt for primary actions (use `min-h-14`)

### Focus States

Always provide visible focus indicators:
```tsx
className="focus:ring-2 focus:ring-focus-outer focus:ring-offset-2"
```

## Usage Rules

### ✅ Do

- Use design tokens consistently
- Combine tokens for complex styles: `bg-primary-900 text-white rounded-2xl shadow-cta`
- Use semantic color names: `text-success` for positive states
- Follow the 8pt spacing grid
- Ensure minimum touch target sizes

### ❌ Don't

- Use hardcoded hex colors: `#0047AB`
- Mix different blue scales outside the primary system
- Use arbitrary spacing values
- Create custom shadows outside the token system
- Use colors that don't meet accessibility standards

## Runtime Token Access

For dynamic styling, use the token utilities:

```tsx
import { utils } from '@/lib/tokens';

// Get color values
const primaryColor = utils.getColor('primary.900');

// Get spacing values
const standardSpacing = utils.getSpacing(4);

// Get shadow styles
const cardShadow = utils.getShadowStyle('card');

// Get typography styles
const titleStyle = utils.getTypographyStyle('title');
```

## Migration Guide

When updating existing components:

1. **Run the color replacement script**:
   ```bash
   npm run replace-colors:src
   ```

2. **Review and test changes**:
   - Check visual consistency
   - Verify accessibility compliance
   - Test on different screen sizes

3. **Update any remaining hardcoded values manually**

4. **Run linting to catch any missed hardcoded colors**:
   ```bash
   npm run lint
   ```

---

**Note**: This design system is the foundation for all StatLocker components. When in doubt, refer to this guide and prioritize accessibility and consistency.