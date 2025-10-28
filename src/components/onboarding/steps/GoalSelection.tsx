import { View, Text, ScrollView } from 'react-native'
import { useOnboardingStore } from '../../../stores/onboardingStore'
import { SelectionCard } from '../SelectionCard'
import { useState, useEffect } from 'react'
import type { GoalData } from '../../../types/onboarding'

/**
 * Step 5: Goal Selection Component
 * 
 * Allows users to select exactly 3 performance goals
 * Features:
 * - Position-specific goal categories and options
 * - Exactly 3 goal selection with visual feedback
 * - Goal descriptions and success metrics display
 * - Drag-to-reorder functionality for selected goals (future enhancement)
 */
export function GoalSelection() {
  const { profile, updateProfile, trackEvent } = useOnboardingStore()
  const [selectedGoals, setSelectedGoals] = useState<string[]>(profile.selectedGoals || [])

  // Get position-specific goals
  const getGoalOptions = () => {
    const position = profile.position
    const sport = profile.sport

    if (sport === 'lacrosse') {
      switch (position) {
        case 'attack':
          return [
            {
              id: 'goals_per_game',
              category: 'Scoring',
              title: 'Goals Per Game',
              description: 'Increase your average goals scored per game',
              targetMetric: '2+ goals/game',
              icon: '🥅'
            },
            {
              id: 'shooting_percentage',
              category: 'Accuracy',
              title: 'Shooting Percentage',
              description: 'Improve shot accuracy and efficiency',
              targetMetric: '40%+ shooting',
              icon: '🎯'
            },
            {
              id: 'assists_per_game',
              category: 'Playmaking',
              title: 'Assists Per Game',
              description: 'Create more scoring opportunities for teammates',
              targetMetric: '1+ assists/game',
              icon: '🤝'
            },
            {
              id: 'shots_per_game',
              category: 'Aggression',
              title: 'Shots Per Game',
              description: 'Take more quality shots on goal',
              targetMetric: '5+ shots/game',
              icon: '⚡'
            },
            {
              id: 'man_up_goals',
              category: 'Special Situations',
              title: 'Man-Up Goals',
              description: 'Score more goals during man-up opportunities',
              targetMetric: '50%+ conversion',
              icon: '🔥'
            }
          ]

        case 'midfield':
          return [
            {
              id: 'ground_balls_per_game',
              category: 'Hustle',
              title: 'Ground Balls Per Game',
              description: 'Win more loose balls and possessions',
              targetMetric: '4+ GBs/game',
              icon: '💪'
            },
            {
              id: 'faceoff_percentage',
              category: 'Faceoffs',
              title: 'Faceoff Percentage',
              description: 'Win more faceoffs to control possession',
              targetMetric: '60%+ faceoff wins',
              icon: '⚔️'
            },
            {
              id: 'transition_goals',
              category: 'Transition',
              title: 'Transition Goals',
              description: 'Score more goals in transition opportunities',
              targetMetric: '1+ transition goals/game',
              icon: '🏃'
            },
            {
              id: 'assists_per_game',
              category: 'Playmaking',
              title: 'Assists Per Game',
              description: 'Create more scoring opportunities',
              targetMetric: '1+ assists/game',
              icon: '🤝'
            },
            {
              id: 'caused_turnovers',
              category: 'Defense',
              title: 'Caused Turnovers',
              description: 'Force more turnovers on defense',
              targetMetric: '2+ CTs/game',
              icon: '🛡️'
            }
          ]

        case 'defense':
          return [
            {
              id: 'ground_balls_per_game',
              category: 'Hustle',
              title: 'Ground Balls Per Game',
              description: 'Win more loose balls and clear opportunities',
              targetMetric: '5+ GBs/game',
              icon: '💪'
            },
            {
              id: 'caused_turnovers',
              category: 'Defense',
              title: 'Caused Turnovers',
              description: 'Force more turnovers and stops',
              targetMetric: '3+ CTs/game',
              icon: '🛡️'
            },
            {
              id: 'clear_percentage',
              category: 'Clearing',
              title: 'Clear Percentage',
              description: 'Successfully clear the ball more often',
              targetMetric: '85%+ clear success',
              icon: '🚀'
            },
            {
              id: 'interceptions',
              category: 'Ball Skills',
              title: 'Interceptions',
              description: 'Intercept more passes and create turnovers',
              targetMetric: '1+ interceptions/game',
              icon: '🎯'
            },
            {
              id: 'slides_per_game',
              category: 'Team Defense',
              title: 'Successful Slides',
              description: 'Execute more effective defensive slides',
              targetMetric: '3+ successful slides/game',
              icon: '🔄'
            }
          ]

        case 'goalie':
          return [
            {
              id: 'save_percentage',
              category: 'Saves',
              title: 'Save Percentage',
              description: 'Stop a higher percentage of shots',
              targetMetric: '60%+ save percentage',
              icon: '🥅'
            },
            {
              id: 'goals_against_average',
              category: 'Goals Against',
              title: 'Goals Against Average',
              description: 'Allow fewer goals per game',
              targetMetric: '<8 goals against/game',
              icon: '🛡️'
            },
            {
              id: 'clear_assists',
              category: 'Clearing',
              title: 'Clear Assists',
              description: 'Start more successful clears',
              targetMetric: '3+ clear assists/game',
              icon: '🚀'
            },
            {
              id: 'saves_per_game',
              category: 'Volume',
              title: 'Saves Per Game',
              description: 'Make more saves and stops',
              targetMetric: '10+ saves/game',
              icon: '✋'
            },
            {
              id: 'ground_balls_per_game',
              category: 'Hustle',
              title: 'Ground Balls Per Game',
              description: 'Win more loose balls in the crease',
              targetMetric: '2+ GBs/game',
              icon: '💪'
            }
          ]

        case 'fogo':
          return [
            {
              id: 'faceoff_percentage',
              category: 'Faceoffs',
              title: 'Faceoff Percentage',
              description: 'Win more faceoffs consistently',
              targetMetric: '65%+ faceoff wins',
              icon: '⚔️'
            },
            {
              id: 'ground_balls_per_game',
              category: 'Hustle',
              title: 'Ground Balls Per Game',
              description: 'Control more loose balls after faceoffs',
              targetMetric: '6+ GBs/game',
              icon: '💪'
            },
            {
              id: 'fast_break_goals',
              category: 'Transition',
              title: 'Fast Break Goals',
              description: 'Score more goals off faceoff wins',
              targetMetric: '1+ fast break goals/game',
              icon: '⚡'
            },
            {
              id: 'clear_percentage',
              category: 'Clearing',
              title: 'Clear Percentage',
              description: 'Successfully clear after faceoff wins',
              targetMetric: '80%+ clear success',
              icon: '🚀'
            },
            {
              id: 'wing_help',
              category: 'Team Play',
              title: 'Wing Assists',
              description: 'Help wings win more faceoffs',
              targetMetric: '70%+ wing success rate',
              icon: '🤝'
            }
          ]

        default:
          return []
      }
    }

    return []
  }

  const goalOptions = getGoalOptions()

  const handleGoalToggle = (goalId: string) => {
    let newSelectedGoals = [...selectedGoals]

    if (newSelectedGoals.includes(goalId)) {
      // Remove goal if already selected
      newSelectedGoals = newSelectedGoals.filter(id => id !== goalId)
    } else if (newSelectedGoals.length < 3) {
      // Add goal if under limit
      newSelectedGoals.push(goalId)
    } else {
      // Replace oldest goal if at limit
      newSelectedGoals.shift()
      newSelectedGoals.push(goalId)
    }

    setSelectedGoals(newSelectedGoals)
    updateProfile({ selectedGoals: newSelectedGoals })

    // Track goal selection
    trackEvent('goal_selected', {
      goalId,
      category: goalOptions.find(g => g.id === goalId)?.category || 'Unknown',
      position: newSelectedGoals.indexOf(goalId)
    })
  }

  // Update local state when profile changes
  useEffect(() => {
    if (profile.selectedGoals) {
      setSelectedGoals(profile.selectedGoals)
    }
  }, [profile.selectedGoals])

  const getSelectionText = () => {
    const count = selectedGoals.length
    if (count === 0) return 'Select 3 goals to track your progress'
    if (count === 1) return '2 more goals to go!'
    if (count === 2) return '1 more goal to complete your selection'
    return 'Perfect! Your 3 goals are selected 🎯'
  }

  const getSelectionColor = () => {
    const count = selectedGoals.length
    if (count === 0) return 'text-gray-400'
    if (count < 3) return 'text-blue-400'
    return 'text-green-400'
  }

  return (
    <View className="flex-1">
      {/* Step Introduction */}
      <View className="mb-6">
        <Text className="text-gray-300 text-base leading-6">
          Choose 3 performance goals that matter most to you. We'll track your progress and provide insights to help you achieve them.
        </Text>
      </View>

      {/* Selection Status */}
      <View className="mb-6 p-4 bg-gray-800 rounded-xl border border-gray-600">
        <View className="flex-row items-center justify-between">
          <Text className={`text-sm font-medium ${getSelectionColor()}`}>
            {getSelectionText()}
          </Text>
          <Text className={`text-lg font-bold ${getSelectionColor()}`}>
            {selectedGoals.length}/3
          </Text>
        </View>
        
        {selectedGoals.length === 3 && (
          <Text className="text-green-400 text-xs mt-2">
            🎉 Great choices! These goals will help you level up your game.
          </Text>
        )}
      </View>

      {/* Goal Options */}
      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        {goalOptions.length > 0 ? (
          <View>
            <Text className="text-white text-lg font-semibold mb-4">
              {profile.position ? `${profile.position.charAt(0).toUpperCase() + profile.position.slice(1)} Goals` : 'Performance Goals'}
            </Text>
            
            {goalOptions.map((goal, index) => {
              const isSelected = selectedGoals.includes(goal.id)
              const selectionOrder = selectedGoals.indexOf(goal.id) + 1
              
              return (
                <SelectionCard
                  key={goal.id}
                  title={`${goal.icon} ${goal.title}`}
                  description={`${goal.description} • Target: ${goal.targetMetric}`}
                  selected={isSelected}
                  onPress={() => handleGoalToggle(goal.id)}
                  badge={isSelected ? `Goal #${selectionOrder}` : goal.category}
                  motivationalText={isSelected ? `Goal #${selectionOrder} locked in! 🔒` : undefined}
                />
              )
            })}
          </View>
        ) : (
          <View className="p-6 bg-gray-800 rounded-xl border border-gray-600">
            <Text className="text-gray-400 text-center text-base">
              Please complete the previous steps to see position-specific goals.
            </Text>
            <Text className="text-gray-500 text-center text-sm mt-2">
              We need your sport and position to show relevant performance goals.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Selected Goals Summary */}
      {selectedGoals.length > 0 && (
        <View className="mt-6 p-4 bg-blue-900/20 border border-blue-700 rounded-xl">
          <Text className="text-blue-400 text-sm font-medium mb-2">
            🎯 Your Selected Goals:
          </Text>
          {selectedGoals.map((goalId, index) => {
            const goal = goalOptions.find(g => g.id === goalId)
            return goal ? (
              <Text key={goalId} className="text-gray-300 text-sm">
                {index + 1}. {goal.icon} {goal.title}
              </Text>
            ) : null
          })}
        </View>
      )}

      {/* Helper Text */}
      <View className="mt-6">
        <Text className="text-gray-500 text-sm text-center leading-5">
          You can change these goals anytime in your profile. We'll help you track progress and celebrate achievements!
        </Text>
      </View>
    </View>
  )
}