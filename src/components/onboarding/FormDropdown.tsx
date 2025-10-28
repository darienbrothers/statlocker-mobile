import { useState } from 'react'
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Modal, 
  FlatList,
  Pressable 
} from 'react-native'
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  withTiming 
} from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'

interface DropdownOption {
  label: string
  value: string
  disabled?: boolean
}

interface FormDropdownProps {
  label: string
  placeholder?: string
  options: DropdownOption[]
  value?: string
  onSelect: (value: string) => void
  error?: string
  required?: boolean
  disabled?: boolean
  searchable?: boolean
}

/**
 * Dropdown component for form selections
 * 
 * Features:
 * - Modal-based dropdown with smooth animations
 * - Search functionality for large option lists
 * - Error states and validation
 * - Accessibility support
 * - Haptic feedback
 */
export function FormDropdown({
  label,
  placeholder = 'Select an option',
  options,
  value,
  onSelect,
  error,
  required = false,
  disabled = false,
  searchable = false
}: FormDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  
  // Animation values
  const borderColor = useSharedValue(error ? '#EF4444' : '#374151')
  const dropdownRotation = useSharedValue(0)
  
  // Filter options based on search
  const filteredOptions = searchable 
    ? options.filter(option => 
        option.label.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : options

  // Get selected option label
  const selectedOption = options.find(option => option.value === value)
  const displayText = selectedOption?.label || placeholder

  // Handle dropdown toggle
  const toggleDropdown = async () => {
    if (disabled) return
    
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    
    setIsOpen(!isOpen)
    dropdownRotation.value = withSpring(isOpen ? 0 : 180, {
      damping: 15,
      stiffness: 300,
    })
  }

  // Handle option selection
  const handleSelect = async (optionValue: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    
    onSelect(optionValue)
    setIsOpen(false)
    setSearchQuery('')
    dropdownRotation.value = withSpring(0, {
      damping: 15,
      stiffness: 300,
    })
  }

  // Update border color based on state
  useState(() => {
    if (error) {
      borderColor.value = withTiming('#EF4444') // red-500
    } else if (value) {
      borderColor.value = withTiming('#22C55E') // green-500
    } else {
      borderColor.value = withTiming('#374151') // gray-700
    }
  })

  // Animated styles
  const containerStyle = useAnimatedStyle(() => ({
    borderColor: borderColor.value,
  }))

  const dropdownIconStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${dropdownRotation.value}deg` }],
  }))

  // Dropdown state classes
  const getDropdownStateClasses = () => {
    if (disabled) return 'bg-gray-800 border-gray-700 opacity-50'
    if (error) return 'bg-red-900/10 border-red-500'
    if (value) return 'bg-green-900/10 border-green-500'
    return 'bg-gray-800 border-gray-700'
  }

  return (
    <View className="mb-4">
      {/* Label */}
      <Text 
        className="text-gray-300 text-sm font-medium mb-2"
        accessibilityLabel={`${label}${required ? ', required' : ''}`}
      >
        {label}
        {required && <Text className="text-red-400 ml-1">*</Text>}
      </Text>

      {/* Dropdown Trigger */}
      <Animated.View style={containerStyle}>
        <TouchableOpacity
          onPress={toggleDropdown}
          disabled={disabled}
          className={`flex-row items-center justify-between rounded-xl border-2 px-4 py-3 ${getDropdownStateClasses()}`}
          accessibilityRole="button"
          accessibilityLabel={`${label} dropdown. Current selection: ${selectedOption?.label || 'None'}`}
          accessibilityHint="Tap to open dropdown menu"
          accessibilityState={{ 
            disabled,
            expanded: isOpen 
          }}
        >
          <Text className={`text-base ${
            selectedOption ? 'text-white' : 'text-gray-400'
          }`}>
            {displayText}
          </Text>
          
          <Animated.View style={dropdownIconStyle}>
            <Text className="text-gray-400 text-lg">▼</Text>
          </Animated.View>
        </TouchableOpacity>
      </Animated.View>

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

      {/* Dropdown Modal */}
      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <Pressable 
          className="flex-1 bg-black/50 justify-center px-4"
          onPress={() => setIsOpen(false)}
        >
          <View className="bg-gray-800 rounded-xl border border-gray-600 max-h-80">
            {/* Modal Header */}
            <View className="p-4 border-b border-gray-600">
              <Text className="text-white text-lg font-semibold">
                {label}
              </Text>
            </View>

            {/* Options List */}
            <FlatList
              data={filteredOptions}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => handleSelect(item.value)}
                  disabled={item.disabled}
                  className={`p-4 border-b border-gray-700 ${
                    item.value === value ? 'bg-blue-900/30' : ''
                  } ${item.disabled ? 'opacity-50' : ''}`}
                  accessibilityRole="button"
                  accessibilityLabel={item.label}
                  accessibilityState={{ 
                    selected: item.value === value,
                    disabled: item.disabled 
                  }}
                >
                  <View className="flex-row items-center justify-between">
                    <Text className={`text-base ${
                      item.disabled ? 'text-gray-500' : 'text-white'
                    }`}>
                      {item.label}
                    </Text>
                    
                    {item.value === value && (
                      <Text className="text-blue-400 text-lg">✓</Text>
                    )}
                  </View>
                </TouchableOpacity>
              )}
              showsVerticalScrollIndicator={false}
            />

            {/* Cancel Button */}
            <TouchableOpacity
              onPress={() => setIsOpen(false)}
              className="p-4 border-t border-gray-600"
              accessibilityRole="button"
              accessibilityLabel="Cancel selection"
            >
              <Text className="text-gray-400 text-center text-base font-medium">
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </View>
  )
}