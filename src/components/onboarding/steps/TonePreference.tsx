import { View, Text, ScrollView, TouchableOpacity } from 'react-native'
import { useState, useEffect } from 'react'
import { useOnboardingStore } from '../../../stores/onboardingStore'
import { SelectionCard } from '../SelectionCard'
import { getRecommendedTone } from '../../../lib/onboarding/personaDerivation'
import type { AITone } from '../../../types/onboarding'

/**
 * Step 7: AI Tone Preference Component
 * 
 * Allows users to choose their preferred AI communication style
 * Features:
 * - Four AI tone options with sample messages
 * - Interactive preview of each tone style
 * - Personality-based recommendations from DNA results
 * - Clear descriptions of each communication style
 */
export function TonePreference() {
  const { profile, updateProfile, trackEvent } = useOnboardingStore()
  const [selectedTone, setSelectedTone] = useState<AITone | undefined>(profile.aiTone)
  const [previewingTone, setPreviewingTone] = useState<AITone | undefined>()

  // AI Tone options with sample messages
  const toneOptions = [
    {
      id: 'hype' as AITone,
      title: 'Hype',
      description: 'Energetic and motivational - gets you pumped up',
      icon: '🔥',
      personality: 'Perfect for competitive athletes who love energy and excitement',
      sampleMessages: [
        "LET'S GO! Your shooting percentage is UP 15% this week! 🚀",
        "You're absolutely CRUSHING those ground balls! Keep that energy!",
        "BEAST MODE: 3 goals in the last game? You're on FIRE! 🔥"
      ],
      color: 'bg-red-900/20 border-red-700',
      textColor: 'text-red-400'
    },
    {
      id: 'mentor' as AITone,
      title: 'Mentor',
      description: 'Supportive and encouraging - like a wise coach',
      icon: '🎓',
      personality: 'Great for athletes who value guidance and steady improvement',
      sampleMessages: [
        "I noticed your shooting accuracy improved this week. That practice is paying off.",
        "Your ground ball stats show real growth. Keep focusing on positioning.",
        "You're developing into a more complete player. Trust the process."
      ],
      color: 'bg-blue-900/20 border-blue-700',
      textColor: 'text-blue-400'
    },
    {
      id: 'analyst' as AITone,
      title: 'Analyst',
      description: 'Data-driven and strategic - focuses on the numbers',
      icon: '📊',
      personality: 'Ideal for athletes who love stats and tactical insights',
      sampleMessages: [
        "Your shot selection efficiency is 23% above position average.",
        "Data shows your performance peaks in the 3rd quarter. Interesting pattern.",
        "Your assist-to-turnover ratio improved 0.8 points this month."
      ],
      color: 'bg-purple-900/20 border-purple-700',
      textColor: 'text-purple-400'
    },
    {
      id: 'captain' as AITone,
      title: 'Captain',
      description: 'Direct and leadership-focused - straight talk',
      icon: '⚡',
      personality: 'Best for natural leaders who want honest, direct feedback',
      sampleMessages: [
        "Your team needs you to step up on defense. Time to lead by example.",
        "Good work on those assists. Now let's work on your shot selection.",
        "You're setting the standard for hustle. Keep pushing your teammates."
      ],
      color: 'bg-yellow-900/20 border-yellow-700',
      textColor: 'text-yellow-400'
    }
  ]

  const recommendedTone = profile.dna ? getRecommendedTone(profile.dna) : undefined
  const recommendedOption = toneOptions.find(opt => opt.id === recommendedTone)

  const handleToneSelection = (tone: AITone) => {
    setSelectedTone(tone)
    updateProfile({ aiTone: tone })
    
    // Track tone selection
    trackEvent('tone_selected', {
      tone,
      wasRecommended: tone === recommendedTone,
      previousTone: profile.aiTone
    })
  }

  const handleTonePreview = (tone: AITone) => {
    setPreviewingTone(tone)
    
    // Track preview interaction
    trackEvent('tone_previewed', {
      tone,
      duration: 0 // Will be calculated by analytics service
    })
    
    // Auto-hide preview after 5 seconds
    setTimeout(() => {
      setPreviewingTone(undefined)
    }, 5000)
  }

  // Update local state when profile changes
  useEffect(() => {
    if (profile.aiTone) {
      setSelectedTone(profile.aiTone)
    }
  }, [profile.aiTone])

  const currentPreview = toneOptions.find(opt => opt.id === previewingTone)

  return (
    <View className="flex-1">
      {/* Step Introduction */}
      <View className="mb-6">
        <Text className="text-gray-300 text-base leading-6">
          Choose how you'd like your AI coach to communicate with you. You can change this anytime in your settings.
        </Text>
      </View>

      {/* DNA-Based Recommendation */}
      {recommendedOption && (
        <View className="mb-6 p-4 bg-green-900/20 border border-green-700 rounded-xl">
          <Text className="text-green-400 text-sm font-medium mb-2">
            🎯 Recommended for You
          </Text>
          <Text className="text-white font-semibold">
            {recommendedOption.icon} {recommendedOption.title}
          </Text>
          <Text className="text-gray-300 text-sm mt-1">
            Based on your AthleteDNA, this tone matches your personality and motivation style.
          </Text>
        </View>
      )}

      {/* Tone Options */}
      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        <View className="space-y-4">
          {toneOptions.map((option) => {
            const isSelected = selectedTone === option.id
            const isRecommended = recommendedTone === option.id
            
            return (
              <View key={option.id}>
                <SelectionCard
                  title={`${option.icon} ${option.title}`}
                  description={option.description}
                  selected={isSelected}
                  onPress={() => handleToneSelection(option.id)}
                  variant="large"
                  badge={isRecommended ? 'Recommended' : undefined}
                  motivationalText={isSelected ? "Great choice! This tone fits you perfectly 🎯" : undefined}
                />
                
                {/* Personality Match */}
                <Text className="text-gray-500 text-sm mt-2 mb-2 px-1">
                  {option.personality}
                </Text>
                
                {/* Preview Button */}
                <TouchableOpacity
                  onPress={() => handleTonePreview(option.id)}
                  className="mb-4 p-3 bg-gray-800 border border-gray-600 rounded-lg"
                  accessibilityRole="button"
                  accessibilityLabel={`Preview ${option.title} tone`}
                >
                  <Text className="text-blue-400 text-sm font-medium text-center">
                    👁️ Preview {option.title} Style
                  </Text>
                </TouchableOpacity>
              </View>
            )
          })}
        </View>
      </ScrollView>

      {/* Tone Preview Modal */}
      {currentPreview && (
        <View className="absolute inset-0 bg-black/80 flex-1 justify-center items-center p-6">
          <View className={`w-full max-w-sm p-6 rounded-xl border-2 ${currentPreview.color}`}>
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-white text-lg font-bold">
                {currentPreview.icon} {currentPreview.title} Preview
              </Text>
              <TouchableOpacity
                onPress={() => setPreviewingTone(undefined)}
                className="w-8 h-8 bg-gray-700 rounded-full items-center justify-center"
                accessibilityRole="button"
                accessibilityLabel="Close preview"
              >
                <Text className="text-white text-lg">×</Text>
              </TouchableOpacity>
            </View>
            
            <Text className="text-gray-300 text-sm mb-4">
              Here's how your AI coach would talk to you:
            </Text>
            
            <View className="space-y-3">
              {currentPreview.sampleMessages.map((message, index) => (
                <View key={index} className="p-3 bg-gray-900 rounded-lg">
                  <Text className={`text-sm ${currentPreview.textColor}`}>
                    {message}
                  </Text>
                </View>
              ))}
            </View>
            
            <TouchableOpacity
              onPress={() => {
                handleToneSelection(currentPreview.id)
                setPreviewingTone(undefined)
              }}
              className="mt-4 p-3 bg-blue-600 rounded-lg"
              accessibilityRole="button"
              accessibilityLabel={`Select ${currentPreview.title} tone`}
            >
              <Text className="text-white text-center font-medium">
                Choose {currentPreview.title}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Selection Status */}
      {selectedTone && (
        <View className="mt-6 p-4 bg-blue-900/20 border border-blue-700 rounded-xl">
          <Text className="text-blue-400 text-sm font-medium mb-1">
            🎯 Your AI Coach Style
          </Text>
          <Text className="text-white font-semibold">
            {toneOptions.find(opt => opt.id === selectedTone)?.icon} {selectedTone.charAt(0).toUpperCase() + selectedTone.slice(1)}
          </Text>
          <Text className="text-gray-300 text-sm mt-1">
            Your AI coach will use this communication style for all insights and feedback.
          </Text>
        </View>
      )}

      {/* Helper Text */}
      <View className="mt-6">
        <Text className="text-gray-500 text-sm text-center leading-5">
          Don't worry - you can change your AI tone anytime in your profile settings. Find what motivates you best!
        </Text>
      </View>
    </View>
  )
}