import { View, Text, ScrollView } from 'react-native'
import { useState, useEffect } from 'react'
import { useOnboardingStore } from '../../../stores/onboardingStore'
import { SelectionCard } from '../SelectionCard'
import type { AthleteDNA } from '../../../types/onboarding'

/**
 * Step 6: AthleteDNA Quiz Component
 * 
 * Six-question personality assessment for AI personalization
 * Features:
 * - Six personality assessment questions
 * - Multiple choice responses with clear descriptions
 * - Progress indication within the quiz
 * - Motivational copy and question explanations
 */
export function AthleteDNA() {
  const { profile, updateProfile, trackEvent } = useOnboardingStore()
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [responses, setResponses] = useState<Partial<AthleteDNA>>(profile.dna || {})

  // DNA Questions with options
  const dnaQuestions = [
    {
      id: 'motivation' as keyof AthleteDNA,
      question: 'What drives you most in sports?',
      description: 'Understanding your motivation helps us provide insights that resonate with you.',
      options: [
        {
          value: 'intrinsic',
          title: 'Personal Growth',
          description: 'I play to improve myself and master my skills',
          icon: '🎯'
        },
        {
          value: 'extrinsic',
          title: 'Recognition & Rewards',
          description: 'I play to win, get noticed, and achieve external success',
          icon: '🏆'
        },
        {
          value: 'balanced',
          title: 'Both Matter',
          description: 'I value personal improvement and external achievements equally',
          icon: '⚖️'
        }
      ]
    },
    {
      id: 'confidence' as keyof AthleteDNA,
      question: 'How would you describe your confidence level?',
      description: 'Your confidence affects how you approach challenges and setbacks.',
      options: [
        {
          value: 'high',
          title: 'Very Confident',
          description: 'I believe in my abilities and rarely doubt myself',
          icon: '💪'
        },
        {
          value: 'moderate',
          title: 'Situational Confidence',
          description: 'My confidence varies depending on the situation',
          icon: '🎭'
        },
        {
          value: 'building',
          title: 'Building Confidence',
          description: 'I\'m working on believing in myself more',
          icon: '🌱'
        }
      ]
    },
    {
      id: 'focusMode' as keyof AthleteDNA,
      question: 'How do you focus best during games?',
      description: 'Your focus style helps us understand how you process information.',
      options: [
        {
          value: 'intense',
          title: 'Laser Focus',
          description: 'I lock in completely and block out everything else',
          icon: '🔥'
        },
        {
          value: 'steady',
          title: 'Steady Awareness',
          description: 'I maintain consistent focus throughout the game',
          icon: '🧘'
        },
        {
          value: 'burst',
          title: 'Burst Focus',
          description: 'I focus intensely in key moments, then relax',
          icon: '⚡'
        }
      ]
    },
    {
      id: 'competitiveness' as keyof AthleteDNA,
      question: 'How competitive are you?',
      description: 'Your competitive nature influences how you respond to challenges.',
      options: [
        {
          value: 'high',
          title: 'Ultra Competitive',
          description: 'I hate losing and always want to be the best',
          icon: '🔥'
        },
        {
          value: 'moderate',
          title: 'Balanced Competitor',
          description: 'I like to win but can handle losses well',
          icon: '⚖️'
        },
        {
          value: 'collaborative',
          title: 'Team First',
          description: 'I compete hard but prioritize team success',
          icon: '🤝'
        }
      ]
    },
    {
      id: 'coachability' as keyof AthleteDNA,
      question: 'How do you respond to coaching?',
      description: 'Your coachability affects how you receive and apply feedback.',
      options: [
        {
          value: 'high',
          title: 'Love Feedback',
          description: 'I actively seek coaching and apply it immediately',
          icon: '🎓'
        },
        {
          value: 'moderate',
          title: 'Selective Listener',
          description: 'I listen to coaching but filter what works for me',
          icon: '🎯'
        },
        {
          value: 'independent',
          title: 'Self-Directed',
          description: 'I prefer to figure things out on my own first',
          icon: '🦅'
        }
      ]
    },
    {
      id: 'resilience' as keyof AthleteDNA,
      question: 'How do you handle setbacks?',
      description: 'Your resilience determines how we frame challenges and growth.',
      options: [
        {
          value: 'high',
          title: 'Bounce Back Fast',
          description: 'I recover quickly from mistakes and failures',
          icon: '🏃'
        },
        {
          value: 'moderate',
          title: 'Process & Recover',
          description: 'I need time to process setbacks but come back strong',
          icon: '🔄'
        },
        {
          value: 'developing',
          title: 'Learning Resilience',
          description: 'I\'m working on handling setbacks better',
          icon: '🌱'
        }
      ]
    }
  ]

  const currentQuestionData = dnaQuestions[currentQuestion]
  const totalQuestions = dnaQuestions.length
  const progressPercentage = ((currentQuestion + 1) / totalQuestions) * 100

  const handleResponse = (questionId: keyof AthleteDNA, value: string) => {
    const newResponses = {
      ...responses,
      [questionId]: value
    }
    
    setResponses(newResponses)
    
    // Track individual question response
    trackEvent('dna_question_answered', {
      questionId,
      answer: value,
      timeSpent: 0 // Will be calculated by analytics service
    })

    // Auto-advance to next question after a brief delay
    setTimeout(() => {
      if (currentQuestion < totalQuestions - 1) {
        setCurrentQuestion(currentQuestion + 1)
      } else {
        // Quiz completed - save to profile
        const completedDNA: AthleteDNA = {
          ...newResponses as AthleteDNA,
          completedAt: new Date()
        }
        
        updateProfile({ dna: completedDNA })
        
        // Track completion
        trackEvent('dna_completed', {
          responses: newResponses,
          totalTimeSpent: 0 // Will be calculated by analytics service
        })
      }
    }, 800)
  }

  const handlePreviousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1)
    }
  }

  const isQuizComplete = Object.keys(responses).length === totalQuestions
  const currentResponse = responses[currentQuestionData?.id]

  // Update local state when profile changes
  useEffect(() => {
    if (profile.dna) {
      setResponses(profile.dna)
      
      // Find the first unanswered question
      const answeredQuestions = Object.keys(profile.dna).length
      if (answeredQuestions < totalQuestions) {
        setCurrentQuestion(answeredQuestions)
      } else {
        setCurrentQuestion(totalQuestions - 1)
      }
    }
  }, [profile.dna, totalQuestions])

  return (
    <View className="flex-1">
      {/* Quiz Introduction */}
      <View className="mb-6">
        <Text className="text-gray-300 text-base leading-6">
          Help us understand your athletic personality! This quick assessment helps our AI provide insights that match your style.
        </Text>
      </View>

      {/* Progress Indicator */}
      <View className="mb-6">
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-blue-400 text-sm font-medium">
            Question {currentQuestion + 1} of {totalQuestions}
          </Text>
          <Text className="text-gray-400 text-sm">
            {Math.round(progressPercentage)}% Complete
          </Text>
        </View>
        
        <View className="h-2 bg-gray-700 rounded-full overflow-hidden">
          <View 
            className="h-full bg-blue-500 rounded-full transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          />
        </View>
      </View>

      {/* Quiz Complete State */}
      {isQuizComplete ? (
        <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
          <View className="p-6 bg-green-900/20 border border-green-700 rounded-xl mb-6">
            <Text className="text-green-400 text-lg font-semibold mb-2">
              🎉 AthleteDNA Complete!
            </Text>
            <Text className="text-gray-300 text-base leading-6">
              Great job! Your personality profile will help our AI provide personalized insights that match your style and goals.
            </Text>
          </View>

          {/* DNA Summary */}
          <View className="space-y-3">
            <Text className="text-white text-lg font-semibold mb-4">
              Your AthleteDNA Profile
            </Text>
            
            {dnaQuestions.map((question, index) => {
              const response = responses[question.id]
              const selectedOption = question.options.find(opt => opt.value === response)
              
              return selectedOption ? (
                <View key={question.id} className="p-4 bg-gray-800 rounded-xl border border-gray-600">
                  <Text className="text-gray-400 text-sm mb-1">
                    {question.question}
                  </Text>
                  <Text className="text-white font-medium">
                    {selectedOption.icon} {selectedOption.title}
                  </Text>
                </View>
              ) : null
            })}
          </View>
        </ScrollView>
      ) : (
        /* Current Question */
        <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
          {currentQuestionData && (
            <View>
              {/* Question Header */}
              <View className="mb-6">
                <Text className="text-white text-xl font-bold mb-3 leading-7">
                  {currentQuestionData.question}
                </Text>
                <Text className="text-gray-400 text-base leading-6">
                  {currentQuestionData.description}
                </Text>
              </View>

              {/* Answer Options */}
              <View className="space-y-3">
                {currentQuestionData.options.map((option) => (
                  <SelectionCard
                    key={option.value}
                    title={`${option.icon} ${option.title}`}
                    description={option.description}
                    selected={currentResponse === option.value}
                    onPress={() => handleResponse(currentQuestionData.id, option.value)}
                    variant="large"
                    motivationalText={currentResponse === option.value ? "Perfect choice! 🎯" : undefined}
                  />
                ))}
              </View>

              {/* Navigation */}
              {currentQuestion > 0 && (
                <View className="mt-6">
                  <SelectionCard
                    title="← Previous Question"
                    description="Go back to the previous question"
                    onPress={handlePreviousQuestion}
                    variant="compact"
                  />
                </View>
              )}
            </View>
          )}
        </ScrollView>
      )}

      {/* Motivational Footer */}
      <View className="mt-6">
        <Text className="text-gray-500 text-sm text-center leading-5">
          {isQuizComplete 
            ? "Your AthleteDNA will help us provide insights that truly resonate with you!"
            : "No right or wrong answers - just be honest about who you are as an athlete!"
          }
        </Text>
      </View>
    </View>
  )
}