import { View, Text } from 'react-native'
import { useOnboardingStore } from '../../../stores/onboardingStore'
import { SelectionCard } from '../SelectionCard'
import type { RoleData } from '../../../types/onboarding'

/**
 * Step 1: Role Selection Component
 * 
 * Allows users to choose between Athlete and Coach roles
 * Features:
 * - Clear role descriptions with motivational copy
 * - Role-specific imagery and benefits
 * - Immediate validation and progression logic
 * - Analytics tracking for role selection
 */
export function RoleSelection() {
  const { profile, updateProfile, trackEvent } = useOnboardingStore()

  const handleRoleSelect = (role: 'athlete' | 'coach') => {
    const roleData: RoleData = { role }
    
    updateProfile(roleData)
    
    // Track role selection analytics
    trackEvent('step_completed', {
      step: 1,
      duration: 0, // Will be calculated by analytics service
      attempts: 1,
      validationErrors: []
    })
    
    console.log('Role selected:', role)
  }

  const roleOptions = [
    {
      id: 'athlete',
      title: 'Athlete',
      description: 'Track your performance, set goals, and get AI-powered insights to take your game to the next level.',
      motivationalText: 'Ready to unlock your potential! 🚀',
      badge: 'Most Popular'
    },
    {
      id: 'coach',
      title: 'Coach',
      description: 'Manage your team, track player progress, and get coaching insights to develop winning strategies.',
      motivationalText: 'Time to build champions! 🏆',
      badge: 'Coming Soon'
    }
  ]

  return (
    <View className="flex-1">
      {/* Step Introduction */}
      <View className="mb-8">
        <Text className="text-gray-300 text-base leading-6">
          Let's start by understanding your role. This helps us personalize your StatLocker experience with the right features and insights.
        </Text>
      </View>

      {/* Role Selection Cards */}
      <View className="flex-1">
        {roleOptions.map((option) => (
          <SelectionCard
            key={option.id}
            title={option.title}
            description={option.description}
            selected={profile.role === option.id}
            onPress={() => handleRoleSelect(option.id as 'athlete' | 'coach')}
            variant="large"
            badge={option.badge}
            motivationalText={option.motivationalText}
            disabled={option.id === 'coach'} // Coach role disabled for MVP
          />
        ))}
      </View>

      {/* Helper Text */}
      <View className="mt-6">
        <Text className="text-gray-500 text-sm text-center leading-5">
          Don't worry - you can always change this later in your profile settings.
        </Text>
      </View>
    </View>
  )
}