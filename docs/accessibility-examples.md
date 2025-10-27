# Accessibility Implementation Examples

## Overview

This document provides practical examples of implementing accessibility features in StatLocker components, demonstrating best practices and common patterns.

## Component Examples

### 1. Accessible Button Component

#### ✅ Good Implementation
```typescript
import React from 'react';
import { Pressable, Text, ActivityIndicator } from 'react-native';
import { useTranslation } from '@/hooks/useTranslation';

interface AccessibleButtonProps {
  children: React.ReactNode;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  loading?: boolean;
  disabled?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export function AccessibleButton({
  children,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  accessibilityLabel,
  accessibilityHint,
}: AccessibleButtonProps) {
  const { t } = useTranslation();
  
  const buttonClasses = variant === 'primary' 
    ? 'bg-primary-900 text-white' 
    : 'bg-white border-2 border-primary-900 text-primary-900';

  return (
    <Pressable
      // Minimum 44pt touch target
      style={{ minHeight: 44, minWidth: 44 }}
      className={`${buttonClasses} px-6 py-3 rounded-2xl flex-row items-center justify-center`}
      onPress={onPress}
      disabled={disabled || loading}
      
      // Accessibility properties
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || (typeof children === 'string' ? children : 'Button')}
      accessibilityHint={accessibilityHint}
      accessibilityState={{
        disabled: disabled || loading,
        busy: loading,
      }}
    >
      {loading && (
        <ActivityIndicator 
          size="small" 
          color={variant === 'primary' ? '#FFFFFF' : '#0047AB'}
          className="mr-2"
          accessibilityLabel={t('loading.default')}
        />
      )}
      
      <Text className={`font-semibold ${variant === 'primary' ? 'text-white' : 'text-primary-900'}`}>
        {loading ? t('loading.default') : children}
      </Text>
    </Pressable>
  );
}
```

#### ❌ Poor Implementation
```typescript
// DON'T DO THIS
export function PoorButton({ children, onPress }: { children: string; onPress: () => void }) {
  return (
    <Pressable 
      style={{ width: 30, height: 30 }} // Too small!
      onPress={onPress}
      // Missing accessibility properties
    >
      <Text style={{ color: '#ccc' }}>{children}</Text> {/* Poor contrast */}
    </Pressable>
  );
}
```

### 2. Accessible Form Input

#### ✅ Good Implementation
```typescript
import React from 'react';
import { View, Text, TextInput } from 'react-native';
import { useTranslation } from '@/hooks/useTranslation';

interface AccessibleInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  error?: string;
  required?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric';
}

export function AccessibleInput({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  required = false,
  keyboardType = 'default',
}: AccessibleInputProps) {
  const { t } = useTranslation();
  const inputId = `input-${label.toLowerCase().replace(/\s+/g, '-')}`;
  const errorId = `${inputId}-error`;

  return (
    <View className="mb-4">
      {/* Label */}
      <Text 
        className="text-base font-medium text-gray-900 mb-2"
        accessibilityRole="text"
      >
        {label}
        {required && (
          <Text 
            className="text-danger ml-1"
            accessibilityLabel={t('validation.required')}
          >
            *
          </Text>
        )}
      </Text>

      {/* Input */}
      <TextInput
        className={`
          bg-white border rounded-xl px-4 py-3 text-base min-h-[44px]
          ${error ? 'border-danger' : 'border-gray-200'}
        `}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        keyboardType={keyboardType}
        
        // Accessibility properties
        accessibilityLabel={label}
        accessibilityHint={placeholder}
        accessibilityRequired={required}
        accessibilityInvalid={!!error}
        accessibilityDescribedBy={error ? errorId : undefined}
      />

      {/* Error message */}
      {error && (
        <Text 
          className="text-danger text-sm mt-1"
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
          nativeID={errorId}
        >
          {error}
        </Text>
      )}
    </View>
  );
}
```

### 3. Accessible Tab Navigation

#### ✅ Good Implementation
```typescript
import React from 'react';
import { View, Pressable, Text } from 'react-native';
import { useTranslation } from '@/hooks/useTranslation';

interface Tab {
  id: string;
  label: string;
  icon: React.ReactNode;
}

interface AccessibleTabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export function AccessibleTabs({ tabs, activeTab, onTabChange }: AccessibleTabsProps) {
  const { t } = useTranslation();

  return (
    <View 
      className="flex-row bg-white border-t border-gray-200"
      accessibilityRole="tablist"
    >
      {tabs.map((tab, index) => {
        const isActive = tab.id === activeTab;
        
        return (
          <Pressable
            key={tab.id}
            className={`
              flex-1 items-center justify-center py-3 min-h-[68px]
              ${isActive ? 'border-t-2 border-primary-900' : ''}
            `}
            onPress={() => onTabChange(tab.id)}
            
            // Accessibility properties
            accessibilityRole="tab"
            accessibilityLabel={`${tab.label} tab`}
            accessibilityHint={`Navigate to ${tab.label} screen`}
            accessibilityState={{
              selected: isActive,
            }}
          >
            {/* Icon */}
            <View className="mb-1">
              {tab.icon}
            </View>
            
            {/* Label */}
            <Text 
              className={`
                text-xs font-medium
                ${isActive ? 'text-primary-900' : 'text-gray-500'}
              `}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
```

### 4. Accessible Modal Dialog

#### ✅ Good Implementation
```typescript
import React, { useEffect, useRef } from 'react';
import { View, Text, Modal, Pressable } from 'react-native';
import { useTranslation } from '@/hooks/useTranslation';

interface AccessibleModalProps {
  visible: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  primaryAction?: {
    label: string;
    onPress: () => void;
  };
  secondaryAction?: {
    label: string;
    onPress: () => void;
  };
}

export function AccessibleModal({
  visible,
  title,
  children,
  onClose,
  primaryAction,
  secondaryAction,
}: AccessibleModalProps) {
  const { t } = useTranslation();
  const modalRef = useRef<View>(null);

  // Announce modal opening to screen readers
  useEffect(() => {
    if (visible) {
      // Focus management would go here
      // AccessibilityInfo.announceForAccessibility(`${title} dialog opened`);
    }
  }, [visible, title]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      
      // Accessibility properties
      accessibilityViewIsModal
    >
      <View className="flex-1 bg-black/50 justify-center items-center p-4">
        <View 
          ref={modalRef}
          className="bg-white rounded-2xl p-6 w-full max-w-sm"
          
          // Accessibility properties
          accessibilityRole="dialog"
          accessibilityModal
          accessibilityLabel={title}
        >
          {/* Header */}
          <View className="flex-row justify-between items-center mb-4">
            <Text 
              className="text-xl font-semibold text-gray-900"
              accessibilityRole="header"
            >
              {title}
            </Text>
            
            <Pressable
              className="p-2 -mr-2"
              onPress={onClose}
              style={{ minHeight: 44, minWidth: 44 }}
              
              // Accessibility properties
              accessibilityRole="button"
              accessibilityLabel={t('common.close')}
              accessibilityHint={`Close ${title} dialog`}
            >
              <Text className="text-gray-500 text-lg">×</Text>
            </Pressable>
          </View>

          {/* Content */}
          <View className="mb-6">
            {children}
          </View>

          {/* Actions */}
          {(primaryAction || secondaryAction) && (
            <View className="flex-row justify-end space-x-3">
              {secondaryAction && (
                <Pressable
                  className="px-4 py-2 rounded-xl border border-gray-300 min-h-[44px] justify-center"
                  onPress={secondaryAction.onPress}
                  accessibilityRole="button"
                  accessibilityLabel={secondaryAction.label}
                >
                  <Text className="text-gray-700 font-medium">
                    {secondaryAction.label}
                  </Text>
                </Pressable>
              )}
              
              {primaryAction && (
                <Pressable
                  className="px-4 py-2 rounded-xl bg-primary-900 min-h-[44px] justify-center"
                  onPress={primaryAction.onPress}
                  accessibilityRole="button"
                  accessibilityLabel={primaryAction.label}
                >
                  <Text className="text-white font-medium">
                    {primaryAction.label}
                  </Text>
                </Pressable>
              )}
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}
```

### 5. Accessible List with Actions

#### ✅ Good Implementation
```typescript
import React from 'react';
import { View, Text, Pressable, FlatList } from 'react-native';
import { useTranslation } from '@/hooks/useTranslation';

interface ListItem {
  id: string;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  onDelete?: () => void;
}

interface AccessibleListProps {
  items: ListItem[];
  emptyMessage?: string;
}

export function AccessibleList({ items, emptyMessage }: AccessibleListProps) {
  const { t } = useTranslation();

  const renderItem = ({ item, index }: { item: ListItem; index: number }) => (
    <View 
      className="bg-white border-b border-gray-100"
      accessibilityRole="listitem"
    >
      <Pressable
        className="p-4 flex-row items-center justify-between min-h-[60px]"
        onPress={item.onPress}
        disabled={!item.onPress}
        
        // Accessibility properties
        accessibilityRole={item.onPress ? "button" : "text"}
        accessibilityLabel={`${item.title}${item.subtitle ? `, ${item.subtitle}` : ''}`}
        accessibilityHint={item.onPress ? "Double tap to open" : undefined}
      >
        <View className="flex-1">
          <Text className="text-base font-medium text-gray-900">
            {item.title}
          </Text>
          {item.subtitle && (
            <Text className="text-sm text-gray-500 mt-1">
              {item.subtitle}
            </Text>
          )}
        </View>

        {item.onDelete && (
          <Pressable
            className="p-2 ml-2"
            onPress={item.onDelete}
            style={{ minHeight: 44, minWidth: 44 }}
            
            // Accessibility properties
            accessibilityRole="button"
            accessibilityLabel={`Delete ${item.title}`}
            accessibilityHint="Double tap to delete this item"
          >
            <Text className="text-danger">🗑</Text>
          </Pressable>
        )}
      </Pressable>
    </View>
  );

  if (items.length === 0) {
    return (
      <View className="flex-1 items-center justify-center p-8">
        <Text 
          className="text-gray-500 text-center"
          accessibilityRole="text"
        >
          {emptyMessage || t('common.noItems')}
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={items}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      
      // Accessibility properties
      accessibilityRole="list"
      accessibilityLabel={`List with ${items.length} items`}
    />
  );
}
```

## Testing Examples

### 1. Screen Reader Testing Script
```typescript
// Test script for VoiceOver/TalkBack
import { AccessibilityInfo } from 'react-native';

export async function testScreenReaderAnnouncement() {
  const isScreenReaderEnabled = await AccessibilityInfo.isScreenReaderEnabled();
  
  if (isScreenReaderEnabled) {
    // Announce important state changes
    AccessibilityInfo.announceForAccessibility('Form submitted successfully');
    
    // Set focus to important elements
    // AccessibilityInfo.setAccessibilityFocus(elementRef);
  }
}
```

### 2. Color Contrast Testing
```typescript
import { getContrastRatio, meetsContrastRequirement } from '@/lib/accessibility';

// Test color combinations
const testContrast = () => {
  const combinations = [
    { fg: '#FFFFFF', bg: '#0047AB', name: 'Primary button' },
    { fg: '#111827', bg: '#FFFFFF', name: 'Body text' },
    { fg: '#6B7280', bg: '#FFFFFF', name: 'Gray text' },
  ];

  combinations.forEach(({ fg, bg, name }) => {
    const ratio = getContrastRatio(fg, bg);
    const passes = meetsContrastRequirement(fg, bg, 'AA');
    
    console.log(`${name}: ${ratio.toFixed(2)}:1 ${passes ? '✅' : '❌'}`);
  });
};
```

### 3. Touch Target Testing
```typescript
import { validateTouchTarget } from '@/lib/accessibility';

// Test component touch targets
const testTouchTargets = () => {
  const elements = [
    { name: 'Primary button', width: 48, height: 48 },
    { name: 'Icon button', width: 44, height: 44 },
    { name: 'Tab item', width: 64, height: 68 },
  ];

  elements.forEach(({ name, width, height }) => {
    const validation = validateTouchTarget(width, height);
    console.log(`${name}: ${validation.isValid ? '✅' : '❌'} ${width}×${height}pt`);
    
    if (validation.recommendations.length > 0) {
      console.log(`  Recommendations: ${validation.recommendations.join(', ')}`);
    }
  });
};
```

## Common Patterns

### 1. Loading States
```typescript
// Announce loading states to screen readers
<View
  accessibilityRole="progressbar"
  accessibilityLabel={t('loading.default')}
  accessibilityState={{ busy: true }}
>
  <ActivityIndicator />
  <Text>{t('loading.default')}</Text>
</View>
```

### 2. Error States
```typescript
// Announce errors with live regions
<Text
  className="text-danger text-sm mt-1"
  accessibilityRole="alert"
  accessibilityLiveRegion="polite"
>
  {errorMessage}
</Text>
```

### 3. Success States
```typescript
// Announce success with live regions
<Text
  className="text-success text-sm mt-1"
  accessibilityRole="status"
  accessibilityLiveRegion="polite"
>
  {successMessage}
</Text>
```

### 4. Dynamic Content
```typescript
// Announce dynamic content changes
useEffect(() => {
  if (dataLoaded) {
    AccessibilityInfo.announceForAccessibility(
      `${items.length} items loaded`
    );
  }
}, [dataLoaded, items.length]);
```

## Best Practices Summary

### Do's ✅
- Use minimum 44pt touch targets
- Provide meaningful accessibility labels
- Test with actual screen readers
- Maintain 4.5:1 color contrast for normal text
- Use semantic roles and states
- Announce important state changes
- Support dynamic text scaling
- Implement proper focus management

### Don'ts ❌
- Don't rely on color alone to convey information
- Don't use generic labels like "button" or "link"
- Don't create keyboard traps
- Don't ignore screen reader testing
- Don't use hardcoded colors without contrast testing
- Don't make touch targets smaller than 44pt
- Don't forget to test with accessibility features enabled

This guide should be updated as new patterns emerge and accessibility standards evolve.