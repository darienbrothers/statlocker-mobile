import { View, TouchableOpacity, Text, Pressable } from 'react-native'
import { useEffect, useRef } from 'react'
import * as Haptics from 'expo-haptics'
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  withTiming 
} from 'react-native-reanimated'
import { useOnboardingStore } from '../../stores/onboardingStore'

interface NavigationBarProps {
  onNext?: () => void
  onBack?: () => void
  nextDisabled?: boolean
  showBack?: boolean
  nextText?: string
  backText?: string
  stepNumber?: number
  validationErrors?: string[]
}

/**
 * Navigation controls for onboarding steps
 * 
 * Features:
 * - Back/next navigation with proper state management
 * - Step validation before allowing progression
 * - Keyboard navigation support
 * - Haptic feedback for navigation actions
 * - Animated button states and feedback
 */
export function NavigationBar({
  onNext,
  onBack,
  nextDisabled = false,
  showBack = true,
  nextText = 'Continue',
  backText = 'Back',
  stepNumber,
  validationErrors = []
}: NavigationBarProps) {
  const { validateStep, canNavigateToStep } = useOnboardingStore()
  
  // Animation values
  const nextButtonScale = useSharedValue(1)
  const backButtonScale = useSharedValue(1)
  const nextButtonOpacity = useSharedValue(nextDisabled ? 0.5 : 1)
  
  // Refs for keyboard navigation
  const backButtonRef = useRef<TouchableOpacity>(null)
  const nextButtonRef = useRef<TouchableOpacity>(null)

  // Update button opacity when disabled state changes
  useEffect(() => {
    nextButtonOpacity.value = withTiming(nextDisabled ? 0.5 : 1, {
      duration: 200
    })
  }, [nextDisabled])

  // Handle next button press with validation and haptics
  const handleNext = async () => {
    if (nextDisabled || !onNext) return
    
    // Validate current step if stepNumber is provided
    if (stepNumber && !validateStep(stepNumber)) {
      // Haptic feedback for validation error
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      return
    }
    
    // Success haptic feedback
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    
    // Button press animation
    nextButtonScale.value = withSpring(0.95, {
      damping: 15,
      stiffness: 300,
    }, () => {
      nextButtonScale.value = withSpring(1, {
        damping: 15,
        stiffness: 300,
      })
    })
    
    onNext()
  }

  // Handle back button press with haptics
  const handleBack = async () => {
    if (!onBack) return
    
    // Haptic feedback
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    
    // Button press animation
    backButtonScale.value = withSpring(0.95, {
      damping: 15,
      stiffness: 300,
    }, () => {
      backButtonScale.value = withSpring(1, {
        damping: 15,
        stiffness: 300,
      })
    })
    
    onBack()
  }

  // Animated styles
  const nextButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: nextButtonScale.value }],
    opacity: nextButtonOpacity.value,
  }))

  const backButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: backButtonScale.value }],
  }))

  // Determine next button appearance based on state
  const getNextButtonStyle = () => {
    if (nextDisabled) {
      return 'bg-gray-700 border border-gray-600'
    }
    if (validationErrors.length > 0) {
      return 'bg-red-600 border border-red-500'
    }
    return 'bg-blue-600 border border-blue-500'
  }

  const getNextButtonTextColor = () => {
    if (nextDisabled) return 'text-gray-500'
    if (validationErrors.length > 0) return 'text-white'
    return 'text-white'
  }

  return (
    <View className="flex-row justify-between items-center">
      {/* Back Button */}
      {showBack ? (
        <Animated.View style={backButtonStyle}>
          <Pressable
            ref={backButtonRef}
            onPress={handleBack}
            className="px-6 py-4 rounded-xl border border-gray-600 bg-gray-800 min-w-[100px] items-center"
            accessibilityRole="button"
            accessibilityLabel="Go back to previous step"
            accessibilityHint="Navigate to the previous onboarding step"
            android_ripple={{ color: '#374151' }}
          >
            <Text className="text-gray-300 text-base font-semibold">
              {backText}
            </Text>
          </Pressable>
        </Animated.View>
      ) : (
        <View className="min-w-[100px]" /> // Spacer to maintain layout
      )}

      {/* Next Button */}
      {onNext && (
        <Animated.View style={nextButtonStyle}>
          <Pressable
            ref={nextButtonRef}
            onPress={handleNext}
            disabled={nextDisabled}
            className={`px-6 py-4 rounded-xl min-w-[120px] items-center ${getNextButtonStyle()}`}
            accessibilityRole="button"
            accessibilityLabel={nextDisabled ? "Complete required fields to continue" : "Continue to next step"}
            accessibilityHint={nextDisabled ? "Fill out all required information first" : "Navigate to the next onboarding step"}
            accessibilityState={{ disabled: nextDisabled }}
            android_ripple={{ color: nextDisabled ? '#4B5563' : '#1D4ED8' }}
          >
            <Text className={`text-base font-semibold ${getNextButtonTextColor()}`}>
              {validationErrors.length > 0 && !nextDisabled ? 'Fix Errors' : nextText}
            </Text>
          </Pressable>
        </Animated.View>
      )}
    </View>
  )
}