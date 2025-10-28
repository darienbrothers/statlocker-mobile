import { useState } from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  withTiming 
} from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'

interface FormToggleProps {
  label: string
  description?: string
  value: boolean
  onToggle: (value: boolean) => void
  disabled?: boolean
  variant?: 'switch' | 'checkbox'
  required?: boolean
  error?: string
}

/**
 * Toggle component for boolean form inputs
 * 
 * Features:
 * - Switch and checkbox variants
 * - Smooth animations and haptic feedback
 * - Accessibility support
 * - Error states and validation
 * - Motivational feedback on selection
 */
export function FormToggle({
  label,
  description,
  value,
  onToggle,
  disabled = false,
  variant = 'switch',
  required = false,
  error
}: FormToggleProps) {
  // Animation values
  const switchPosition = useSharedValue(value ? 1 : 0)
  const switchColor = useSharedValue(value ? '#3B82F6' : '#374151')
  const checkboxScale = useSharedValue(value ? 1 : 0)
  const checkboxOpacity = useSharedValue(value ? 1 : 0)

  // Handle toggle
  const handleToggle = async () => {
    if (disabled) return
    
    const newValue = !value
    
    // Haptic feedback
    await Haptics.impactAsync(
      newValue 
        ? Haptics.ImpactFeedbackStyle.Medium 
        : Haptics.ImpactFeedbackStyle.Light
    )
    
    // Animate switch
    if (variant === 'switch') {
      switchPosition.value = withSpring(newValue ? 1 : 0, {
        damping: 15,
        stiffness: 300,
      })
      switchColor.value = withTiming(newValue ? '#3B82F6' : '#374151', {
        duration: 200
      })
    }
    
    // Animate checkbox
    if (variant === 'checkbox') {
      checkboxScale.value = withSpring(newValue ? 1 : 0, {
        damping: 15,
        stiffness: 300,
      })
      checkboxOpacity.value = withTiming(newValue ? 1 : 0, {
        duration: 200
      })
    }
    
    onToggle(newValue)
  }

  // Update animations when value changes externally
  useState(() => {
    if (variant === 'switch') {
      switchPosition.value = withSpring(value ? 1 : 0, {
        damping: 15,
        stiffness: 300,
      })
      switchColor.value = withTiming(value ? '#3B82F6' : '#374151', {
        duration: 200
      })
    }
    
    if (variant === 'checkbox') {
      checkboxScale.value = withSpring(value ? 1 : 0, {
        damping: 15,
        stiffness: 300,
      })
      checkboxOpacity.value = withTiming(value ? 1 : 0, {
        duration: 200
      })
    }
  })

  // Animated styles
  const switchTrackStyle = useAnimatedStyle(() => ({
    backgroundColor: switchColor.value,
  }))

  const switchThumbStyle = useAnimatedStyle(() => ({
    transform: [
      { 
        translateX: switchPosition.value * 24 // 24px is the travel distance
      }
    ],
  }))

  const checkboxCheckStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkboxScale.value }],
    opacity: checkboxOpacity.value,
  }))

  // Render switch variant
  if (variant === 'switch') {
    return (
      <View className="mb-4">
        <TouchableOpacity
          onPress={handleToggle}
          disabled={disabled}
          className={`flex-row items-center justify-between p-4 rounded-xl border ${
            error 
              ? 'border-red-500 bg-red-900/10' 
              : 'border-gray-700 bg-gray-800'
          } ${disabled ? 'opacity-50' : ''}`}
          accessibilityRole="switch"
          accessibilityLabel={label}
          accessibilityHint={description}
          accessibilityState={{ 
            checked: value,
            disabled 
          }}
        >
          <View className="flex-1 mr-4">
            <Text className={`text-base font-medium ${
              disabled ? 'text-gray-500' : 'text-white'
            }`}>
              {label}
              {required && <Text className="text-red-400 ml-1">*</Text>}
            </Text>
            
            {description && (
              <Text className={`text-sm mt-1 ${
                disabled ? 'text-gray-600' : 'text-gray-400'
              }`}>
                {description}
              </Text>
            )}
          </View>

          {/* Switch Control */}
          <Animated.View 
            style={switchTrackStyle}
            className="w-12 h-6 rounded-full p-1"
          >
            <Animated.View 
              style={switchThumbStyle}
              className="w-4 h-4 bg-white rounded-full"
            />
          </Animated.View>
        </TouchableOpacity>

        {/* Error Message */}
        {error && (
          <View className="mt-2">
            <Text 
              className="text-red-400 text-sm"
              accessibilityRole="alert"
              accessibilityLiveRegion="polite"
            >
              {error}
            </Text>
          </View>
        )}
      </View>
    )
  }

  // Render checkbox variant
  return (
    <View className="mb-4">
      <TouchableOpacity
        onPress={handleToggle}
        disabled={disabled}
        className={`flex-row items-start p-4 rounded-xl border ${
          error 
            ? 'border-red-500 bg-red-900/10' 
            : 'border-gray-700 bg-gray-800'
        } ${disabled ? 'opacity-50' : ''}`}
        accessibilityRole="checkbox"
        accessibilityLabel={label}
        accessibilityHint={description}
        accessibilityState={{ 
          checked: value,
          disabled 
        }}
      >
        {/* Checkbox */}
        <View className="mr-3 mt-0.5">
          <View className={`w-5 h-5 rounded border-2 items-center justify-center ${
            value 
              ? 'bg-blue-600 border-blue-600' 
              : 'border-gray-500'
          }`}>
            <Animated.View style={checkboxCheckStyle}>
              <Text className="text-white text-xs font-bold">✓</Text>
            </Animated.View>
          </View>
        </View>

        {/* Content */}
        <View className="flex-1">
          <Text className={`text-base font-medium ${
            disabled ? 'text-gray-500' : 'text-white'
          }`}>
            {label}
            {required && <Text className="text-red-400 ml-1">*</Text>}
          </Text>
          
          {description && (
            <Text className={`text-sm mt-1 leading-5 ${
              disabled ? 'text-gray-600' : 'text-gray-400'
            }`}>
              {description}
            </Text>
          )}
        </View>
      </TouchableOpacity>

      {/* Error Message */}
      {error && (
        <View className="mt-2">
          <Text 
            className="text-red-400 text-sm"
            accessibilityRole="alert"
            accessibilityLiveRegion="polite"
          >
            {error}
          </Text>
        </View>
      )}
    </View>
  )
}