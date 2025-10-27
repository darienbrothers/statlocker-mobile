# Icon System Documentation

## Overview

StatLocker uses a consistent icon system based on Lucide React Native icons. This provides a unified visual language across the entire application.

## Components

### Icon Component

The general-purpose `Icon` component supports all common icons used throughout the app.

```tsx
import { Icon } from '@/components';

// Basic usage
<Icon name="home" />

// With custom size and color
<Icon name="plus" size="large" color="primary" />

// Filled variant
<Icon name="check" filled color="success" />
```

### TabIcon Component

Specialized component for tab navigation with active/inactive states.

```tsx
import { TabIcon } from '@/components';

// Tab navigation usage
<TabIcon name="home" active={isActive} />
```

## Icon Names

### Navigation Icons
- `home` - Dashboard/Home
- `trending-up` - Stats/Analytics
- `target` - Goals/Objectives
- `compass` - Recruiting/Navigation

### Action Icons
- `plus` - Add/Create
- `edit` - Edit/Modify
- `trash` - Delete/Remove
- `save` - Save/Confirm
- `share` - Share/Export
- `download` - Download
- `upload` - Upload

### UI Icons
- `search` - Search functionality
- `filter` - Filter/Sort
- `settings` - Settings/Configuration
- `menu` - Menu/Navigation
- `x` - Close/Cancel
- `chevron-left` - Navigate back
- `chevron-right` - Navigate forward
- `chevron-up` - Expand up
- `chevron-down` - Expand down

### Status Icons
- `check` - Success/Complete
- `alert` - Warning/Alert
- `info` - Information
- `help` - Help/Support

### Content Icons
- `calendar` - Date/Schedule
- `clock` - Time/Duration
- `map-pin` - Location
- `user` - Single user
- `users` - Multiple users
- `mail` - Email/Contact
- `phone` - Phone/Call

## Sizes

### Predefined Sizes
- `small` - 16pt (for inline text)
- `default` - 24pt (standard UI elements)
- `large` - 32pt (prominent actions)
- `xl` - 40pt (hero elements)

### Custom Sizes
You can also pass a number for custom pixel sizes:
```tsx
<Icon name="home" size={28} />
```

## Colors

### Design Token Colors
- `default` - Gray-700 (#374151)
- `primary` - Primary-900 (#0047AB)
- `success` - Green-600 (#059669)
- `warning` - Yellow-600 (#D97706)
- `danger` - Red-600 (#DC2626)
- `muted` - Gray-500 (#6B7280)

### Custom Colors
You can also pass any valid color string:
```tsx
<Icon name="home" color="#FF0000" />
```

## States

### Active/Inactive (TabIcon only)
```tsx
// Active state - filled with thicker stroke
<TabIcon name="home" active={true} />

// Inactive state - outline with thinner stroke
<TabIcon name="home" active={false} />
```

### Filled State (Icon component)
```tsx
// Filled icon
<Icon name="check" filled />

// Outline icon (default)
<Icon name="check" />
```

## Accessibility

### Labels
Always provide accessibility labels for icons used as interactive elements:

```tsx
<Icon 
  name="plus" 
  accessibilityLabel="Add new item"
  testID="add-button-icon"
/>
```

### Touch Targets
When using icons in buttons, ensure minimum 44pt touch targets:

```tsx
<Pressable className="p-3"> {/* Adds padding for 44pt target */}
  <Icon name="edit" />
</Pressable>
```

## Usage Guidelines

### Consistency
- Use the same icon for the same concept throughout the app
- Stick to the predefined sizes when possible
- Use design token colors for consistency

### Performance
- Icons are tree-shaken, so only imported icons are included in the bundle
- Prefer the `Icon` component over importing Lucide icons directly

### Adding New Icons
1. Import the icon from `lucide-react-native` in `Icon.tsx`
2. Add it to the `iconMap` object
3. Add the name to the `IconName` type
4. Update this documentation
5. Add tests for the new icon

## Examples

### Button with Icon
```tsx
<Button>
  <Icon name="plus" color="white" size="small" />
  <Text className="ml-2 text-white">Add Item</Text>
</Button>
```

### Status Indicator
```tsx
<View className="flex-row items-center">
  <Icon name="check" color="success" size="small" />
  <Text className="ml-1 text-green-800">Complete</Text>
</View>
```

### Navigation Header
```tsx
<View className="flex-row items-center justify-between p-4">
  <Icon name="chevron-left" onPress={goBack} />
  <Text className="text-lg font-semibold">Settings</Text>
  <Icon name="settings" />
</View>
```

## Testing

Icons should be tested for:
- Correct rendering with different props
- Accessibility compliance
- Error handling for invalid icon names

```tsx
// Test example
it('renders icon with accessibility label', () => {
  render(<Icon name="home" accessibilityLabel="Home" testID="home-icon" />);
  expect(screen.getByTestId('home-icon')).toHaveAccessibilityLabel('Home');
});
```