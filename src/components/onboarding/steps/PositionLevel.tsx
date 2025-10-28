import { View, Text } from 'react-native'
import { useOnboardingStore } from '../../../stores/onboardingStore'
import { SelectionCard } from '../SelectionCard'
import type { PositionData } from '../../../types/onboarding'
import { ACADEMIC_LEVELS } from '../../../types/onboarding'

/**
 * Step 3: Position & Level Component
 * 
 * Collects athletic position and academic level
 * Features:
 * - Dynamic position options based on sport/gender
 * - Academic level selection (Freshman/JV/Varsity)
 * - Position-specific descriptions and imagery
 * - Validation for required selections
 */
export function PositionLevel() {
  const { profile, updateProfile } = useOnboardingStore()

  // Get position options based on sport and gender
  const getPositionOptions = () => {
    if (profile.sport === 'lacrosse') {
      if (profile.gender === 'male') {
        return [
          {
            id: 'attack',
            title: 'Attack',
            description: 'Score goals and create offensive opportunities. Track goals, assists, and shots.',
            statCategories: ['Goals', 'Assists', 'Shots', 'Shot %']
          },
          {
            id: 'midfield',
            title: 'Midfield',
            description: 'Play both ends of the field. Track goals, assists, ground balls, and faceoffs.',
            statCategories: ['Goals', 'Assists', 'Ground Balls', 'Faceoff %']
          },
          {
            id: 'defense',
            title: 'Defense',
            description: 'Protect the goal and clear the ball. Track ground balls, caused turnovers, and clears.',
            statCategories: ['Ground Balls', 'Caused TOs', 'Clear %']
          },
          {
            id: 'goalie',
            title: 'Goalie',
            description: 'Guard the net and start the clear. Track saves, goals against, and clear assists.',
            statCategories: ['Saves', 'Save %', 'Goals Against', 'Clear Assists']
          },
          {
            id: 'fogo',
            title: 'FOGO',
            description: 'Specialist faceoff player. Track faceoff wins, ground balls, and clears.',
            statCategories: ['Faceoff %', 'Ground Balls', 'Clear %']
          }
        ]
      } else if (profile.gender === 'female') {
        return [
          {
            id: 'attack',
            title: 'Attack',
            description: 'Score goals and create offensive opportunities. Track goals, assists, and shots.',
            statCategories: ['Goals', 'Assists', 'Shots', 'Shot %']
          },
          {
            id: 'midfield',
            title: 'Midfield',
            description: 'Control the center of the field. Track goals, assists, ground balls, and draw controls.',
            statCategories: ['Goals', 'Assists', 'Ground Balls', 'Draw %']
          },
          {
            id: 'defense',
            title: 'Defense',
            description: 'Protect the goal and clear the ball. Track ground balls, caused turnovers, and interceptions.',
            statCategories: ['Ground Balls', 'Caused TOs', 'Interceptions']
          },
          {
            id: 'goalie',
            title: 'Goalie',
            description: 'Guard the net and distribute the ball. Track saves, goals against, and clear assists.',
            statCategories: ['Saves', 'Save %', 'Goals Against', 'Clear Assists']
          }
        ]
      }
    }
    
    return []
  }

  // Academic level options
  const academicLevelOptions = [
    {
      id: 'freshman',
      title: 'Freshman',
      description: 'First year of high school. Focus on skill development and team integration.'
    },
    {
      id: 'jv',
      title: 'JV (Junior Varsity)',
      description: 'Developing player on junior varsity team. Building competitive experience.'
    },
    {
      id: 'varsity',
      title: 'Varsity',
      description: 'Top level high school player. Competing at the highest school level.'
    }
  ]

  const positionOptions = getPositionOptions()

  const handlePositionSelect = (position: string) => {
    updateProfile({ position })
  }

  const handleAcademicLevelSelect = (level: 'freshman' | 'jv' | 'varsity') => {
    updateProfile({ academicLevel: level })
  }

  return (
    <View className="flex-1">
      {/* Step Introduction */}
      <View className="mb-6">
        <Text className="text-gray-300 text-base leading-6">
          Tell us about your position and level so we can provide the most relevant stats and insights for your game.
        </Text>
      </View>

      {/* Position Selection */}
      <View className="mb-8">
        <Text className="text-white text-lg font-semibold mb-4">
          What position do you play?
        </Text>
        
        {positionOptions.length > 0 ? (
          positionOptions.map((position) => (
            <SelectionCard
              key={position.id}
              title={position.title}
              description={position.description}
              selected={profile.position === position.id}
              onPress={() => handlePositionSelect(position.id)}
              motivationalText={`Perfect! ${position.title} stats are going to look amazing! 📊`}
            />
          ))
        ) : (
          <View className="p-4 bg-gray-800 rounded-xl border border-gray-600">
            <Text className="text-gray-400 text-center">
              Please select your sport and gender in the previous step to see position options.
            </Text>
          </View>
        )}
      </View>

      {/* Academic Level Selection */}
      <View className="mb-6">
        <Text className="text-white text-lg font-semibold mb-4">
          What's your current level?
        </Text>
        
        {academicLevelOptions.map((level) => (
          <SelectionCard
            key={level.id}
            title={level.title}
            description={level.description}
            selected={profile.academicLevel === level.id}
            onPress={() => handleAcademicLevelSelect(level.id as 'freshman' | 'jv' | 'varsity')}
            variant="compact"
          />
        ))}
      </View>

      {/* Position Stats Preview */}
      {profile.position && (
        <View className="mt-4 p-4 bg-blue-900/20 border border-blue-700 rounded-xl">
          <Text className="text-blue-400 text-sm font-medium mb-2">
            📈 Your {positionOptions.find(p => p.id === profile.position)?.title} Stats Will Include:
          </Text>
          <Text className="text-gray-300 text-sm">
            {positionOptions.find(p => p.id === profile.position)?.statCategories.join(' • ')}
          </Text>
        </View>
      )}

      {/* Helper Text */}
      <View className="mt-6">
        <Text className="text-gray-500 text-sm text-center leading-5">
          These help us customize your dashboard and provide position-specific insights.
        </Text>
      </View>
    </View>
  )
}