import { useState } from 'react'
import { View, Text, TouchableOpacity, Image } from 'react-native'
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  withTiming 
} from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'

interface SelectionCardProps {
  title: string
  description?: string
  icon?: React.ReactNode
  image?: string
  selected?: boolean
  disabled?: boolean
  onPress?: () => void
  variant?: 'default' | 'large' | 'compact'
  badge?: string
  motivationalText?: string
}

/**
 * Reusable selection card component for onboarding choices
 * 
 * Features:
 * - Visual selection states with animations
 * - Support for icons, images, and badges
 * - Haptic feedback on selection
 * - Accessibility support
 * - Multiple size variants
 * - Motivational text for positive reinforcement
 */
export function SelectionCard({
  title,
  description,
  icon,
  image,
  selected = false,
  disabled = false,
  onPress,
  variant = 'default',
  badge,
  motivationalText
}: SelectionCardProps) {
  const [isPressed, setIsPressed] = useState(false)
  
  // Animation values
  const scale = useSharedValue(1)
  const borderWidth = useSharedValue(selected ? 2 : 1)
  const glowOpacity = useSharedValue(selected ? 1 : 0)

  // Handle press events
  const handlePressIn = () => {
    if (disabled) return
    
    setIsPressed(true)
    scale.value = withSpring(0.98, {
      damping: 15,
      stiffness: 300,
    })
  }

  const handlePressOut = () => {
    setIsPressed(false)
    scale.value = withSpring(1, {
      damping: 15,
      stiffness: 300,
    })
  }

  const handlePress = async () => {
    if (disabled || !onPress) return
    
    // Haptic feedback
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    
    // Selection animation
    borderWidth.value = withSpring(2, {
      damping: 15,
      stiffness: 300,
    })
    glowOpacity.value = withTiming(1, { duration: 200 })
    
    onPress()
  }

  // Update animations when selected state changes
  useState(() => {
    borderWidth.value = withSpring(selected ? 2 : 1, {
      damping: 15,
      stiffness: 300,
    })
    glowOpacity.value = withTiming(selected ? 1 : 0, { duration: 200 })
  })

  // Animated styles
  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    borderWidth: borderWidth.value,
  }))

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }))

  // Variant-specific styles
  const getVariantClasses = () => {
    switch (variant) {
      case 'large':
        return 'p-6 min-h-[120px]'
      case 'compact':
        return 'p-3 min-h-[60px]'
      default:
        return 'p-4 min-h-[80px]'
    }
  }

  // Card state classes
  const getCardStateClasses = () => {
    if (disabled) {
      return 'bg-gray-800 border-gray-700 opacity-50'
    }
    if (selected) {
      return 'bg-blue-900/20 border-blue-500'
    }
    return 'bg-gray-800 border-gray-600'
  }

  return (
    <View className="mb-3">
      {/* Selection Glow Effect */}
      {selected && (
        <Animated.View 
          style={glowStyle}
          className="absolute inset-0 bg-blue-500/20 rounded-xl blur-sm"
        />
      )}
      
      {/* Main Card */}
      <Animated.View style={cardStyle}>
        <TouchableOpacity
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={disabled}
          className={`rounded-xl border-2 ${getVariantClasses()} ${getCardStateClasses()}`}
          accessibilityRole="button"
          accessibilityLabel={`${title}${description ? `. ${description}` : ''}`}
          accessibilityHint={selected ? 'Selected' : 'Tap to select'}
          accessibilityState={{ 
            selected, 
            disabled 
          }}
        >
          <View className="flex-row items-center">
            {/* Icon or Image */}
            {icon && (
              <View className="mr-4">
                {icon}
              </View>
            )}
            
            {image && (
              <View className="mr-4">
                <Image 
                  source={{ uri: image }}
                  className="w-12 h-12 rounded-lg"
                  accessibilityIgnoresInvertColors
                />
              </View>
            )}

            {/* Content */}
            <View className="flex-1">
              <View className="flex-row items-center justify-between">
                <Text className={`font-semibold ${
                  variant === 'large' ? 'text-lg' : 'text-base'
                } ${disabled ? 'text-gray-500' : 'text-white'}`}>
                  {title}
                </Text>
                
                {/* Badge */}
                {badge && (
                  <View className="bg-blue-600 px-2 py-1 rounded-full ml-2">
                    <Text className="text-white text-xs font-medium">
                      {badge}
                    </Text>
                  </View>
                )}
              </View>

              {/* Description */}
              {description && (
                <Text className={`mt-1 ${
                  variant === 'compact' ? 'text-sm' : 'text-base'
                } ${disabled ? 'text-gray-600' : 'text-gray-400'} leading-5`}>
                  {description}
                </Text>
              )}

              {/* Motivational Text (shown when selected) */}
              {selected && motivationalText && (
                <Text className="text-blue-400 text-sm font-medium mt-2">
                  {motivationalText}
                </Text>
              )}
            </View>

            {/* Selection Indicator */}
            <View className="ml-3">
              <View className={`w-6 h-6 rounded-full border-2 items-center justify-center ${
                selected 
                  ? 'bg-blue-500 border-blue-500' 
                  : 'border-gray-500'
              }`}>
                {selected && (
                  <View className="w-2 h-2 bg-white rounded-full" />
                )}
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  )
}