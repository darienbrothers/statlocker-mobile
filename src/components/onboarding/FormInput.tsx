import { useState, forwardRef } from 'react'
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity,
  TextInputProps 
} from 'react-native'
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming,
  withSpring 
} from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'

interface FormInputProps extends Omit<TextInputProps, 'style'> {
  label: string
  error?: string
  hint?: string
  required?: boolean
  success?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  onRightIconPress?: () => void
}

/**
 * Reusable input component with validation and accessibility
 * 
 * Features:
 * - Real-time validation with error messaging
 * - Success states with visual feedback
 * - Accessibility labels and hints
 * - Animated focus states and error indicators
 * - Motivational microcopy and success feedback
 */
export const FormInput = forwardRef<TextInput, FormInputProps>(({
  label,
  error,
  hint,
  required = false,
  success = false,
  leftIcon,
  rightIcon,
  onRightIconPress,
  onFocus,
  onBlur,
  ...textInputProps
}, ref) => {
  const [isFocused, setIsFocused] = useState(false)
  
  // Animation values
  const borderColor = useSharedValue('#374151') // gray-700
  const labelScale = useSharedValue(1)
  const errorOpacity = useSharedValue(0)
  const successOpacity = useSharedValue(0)

  // Handle focus events
  const handleFocus = (e: any) => {
    setIsFocused(true)
    
    // Animate border and label
    borderColor.value = withTiming('#3B82F6') // blue-500
    labelScale.value = withSpring(0.85, {
      damping: 15,
      stiffness: 300,
    })
    
    onFocus?.(e)
  }

  const handleBlur = (e: any) => {
    setIsFocused(false)
    
    // Reset animations if no error/success
    if (!error && !success) {
      borderColor.value = withTiming('#374151') // gray-700
      if (!textInputProps.value) {
        labelScale.value = withSpring(1, {
          damping: 15,
          stiffness: 300,
        })
      }
    }
    
    onBlur?.(e)
  }

  // Update animations based on state
  useState(() => {
    if (error) {
      borderColor.value = withTiming('#EF4444') // red-500
      errorOpacity.value = withTiming(1)
      successOpacity.value = withTiming(0)
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
    } else if (success) {
      borderColor.value = withTiming('#22C55E') // green-500
      errorOpacity.value = withTiming(0)
      successOpacity.value = withTiming(1)
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    } else {
      errorOpacity.value = withTiming(0)
      successOpacity.value = withTiming(0)
    }
  })

  // Animated styles
  const containerStyle = useAnimatedStyle(() => ({
    borderColor: borderColor.value,
  }))

  const labelStyle = useAnimatedStyle(() => ({
    transform: [{ scale: labelScale.value }],
  }))

  const errorStyle = useAnimatedStyle(() => ({
    opacity: errorOpacity.value,
  }))

  const successStyle = useAnimatedStyle(() => ({
    opacity: successOpacity.value,
  }))

  // Determine input state classes
  const getInputStateClasses = () => {
    if (error) return 'border-red-500 bg-red-900/10'
    if (success) return 'border-green-500 bg-green-900/10'
    if (isFocused) return 'border-blue-500 bg-blue-900/10'
    return 'border-gray-700 bg-gray-800'
  }

  return (
    <View className="mb-4">
      {/* Label */}
      <Animated.View style={labelStyle}>
        <Text 
          className="text-gray-300 text-sm font-medium mb-2"
          accessibilityLabel={`${label}${required ? ', required' : ''}`}
        >
          {label}
          {required && <Text className="text-red-400 ml-1">*</Text>}
        </Text>
      </Animated.View>

      {/* Input Container */}
      <Animated.View 
        style={containerStyle}
        className={`flex-row items-center rounded-xl border-2 px-4 py-3 ${getInputStateClasses()}`}
      >
        {/* Left Icon */}
        {leftIcon && (
          <View className="mr-3">
            {leftIcon}
          </View>
        )}

        {/* Text Input */}
        <TextInput
          ref={ref}
          className="flex-1 text-white text-base"
          placeholderTextColor="#9CA3AF"
          onFocus={handleFocus}
          onBlur={handleBlur}
          accessibilityLabel={label}
          accessibilityHint={hint}
          accessibilityRequired={required}
          {...textInputProps}
        />

        {/* Right Icon */}
        {rightIcon && (
          <TouchableOpacity
            onPress={onRightIconPress}
            className="ml-3"
            accessibilityRole="button"
            accessibilityLabel="Input action"
          >
            {rightIcon}
          </TouchableOpacity>
        )}
      </Animated.View>

      {/* Error Message */}
      {error && (
        <Animated.View style={errorStyle} className="mt-2">
          <Text 
            className="text-red-400 text-sm"
            accessibilityRole="alert"
            accessibilityLiveRegion="polite"
          >
            {error}
          </Text>
        </Animated.View>
      )}

      {/* Success Message */}
      {success && !error && (
        <Animated.View style={successStyle} className="mt-2">
          <Text 
            className="text-green-400 text-sm"
            accessibilityLiveRegion="polite"
          >
            ✓ Looking good!
          </Text>
        </Animated.View>
      )}

      {/* Hint Text */}
      {hint && !error && !success && (
        <View className="mt-2">
          <Text className="text-gray-500 text-sm">
            {hint}
          </Text>
        </View>
      )}
    </View>
  )
})

FormInput.displayName = 'FormInput'