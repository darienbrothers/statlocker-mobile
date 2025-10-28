import React, { useEffect, useState } from 'react'
import { View, Text, Animated } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

interface ResumedProgressIndicatorProps {
  completionPercentage: number
  currentStep: number
  totalSteps: number
  stepTitle: string
  showWelcomeBack?: boolean
  onAnimationComplete?: () => void
}

export const ResumedProgressIndicator: React.FC<ResumedProgressIndicatorProps> = ({
  completionPercentage,
  currentStep,
  totalSteps,
  stepTitle,
  showWelcomeBack = true,
  onAnimationComplete
}) => {
  const [fadeAnim] = useState(new Animated.Value(0))
  const [progressAnim] = useState(new Animated.Value(0))
  const [scaleAnim] = useState(new Animated.Value(0.8))

  useEffect(() => {
    // Animate entrance
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true
        })
      ]),
      Animated.timing(progressAnim, {
        toValue: completionPercentage / 100,
        duration: 1200,
        useNativeDriver: false
      })
    ]).start(() => {
      if (onAnimationComplete) {
        setTimeout(onAnimationComplete, 500)
      }
    })
  }, [completionPercentage])

  return (
    <Animated.View style={{
      opacity: fadeAnim,
      transform: [{ scale: scaleAnim }],
      backgroundColor: '#FFFFFF',
      marginHorizontal: 20,
      marginVertical: 16,
      borderRadius: 16,
      padding: 24,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4
    }}>
      {/* Welcome Back Message */}
      {showWelcomeBack && (
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 20,
          paddingBottom: 16,
          borderBottomWidth: 1,
          borderBottomColor: '#F3F4F6'
        }}>
          <View style={{
            backgroundColor: '#22C55E',
            borderRadius: 20,
            padding: 8,
            marginRight: 12
          }}>
            <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{
              fontSize: 16,
              fontWeight: '700',
              color: '#1F2937',
              marginBottom: 2
            }}>
              Welcome back!
            </Text>
            <Text style={{
              fontSize: 14,
              color: '#6B7280'
            }}>
              Your progress has been restored
            </Text>
          </View>
        </View>
      )}

      {/* Progress Overview */}
      <View style={{ marginBottom: 20 }}>
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 8
        }}>
          <Text style={{
            fontSize: 14,
            fontWeight: '600',
            color: '#374151'
          }}>
            Setup Progress
          </Text>
          <Text style={{
            fontSize: 14,
            fontWeight: '700',
            color: '#0047AB'
          }}>
            {Math.round(completionPercentage)}%
          </Text>
        </View>

        {/* Animated Progress Bar */}
        <View style={{
          backgroundColor: '#E5E7EB',
          height: 8,
          borderRadius: 4,
          overflow: 'hidden'
        }}>
          <Animated.View style={{
            backgroundColor: '#0047AB',
            height: '100%',
            borderRadius: 4,
            width: progressAnim.interpolate({
              inputRange: [0, 1],
              outputRange: ['0%', '100%']
            })
          }} />
        </View>
      </View>

      {/* Current Step Info */}
      <View style={{
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        padding: 16,
        borderLeftWidth: 4,
        borderLeftColor: '#0047AB'
      }}>
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 4
        }}>
          <Text style={{
            fontSize: 12,
            fontWeight: '600',
            color: '#6B7280',
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            marginRight: 8
          }}>
            Step {currentStep} of {totalSteps}
          </Text>
          <View style={{
            backgroundColor: '#0047AB',
            borderRadius: 10,
            paddingHorizontal: 8,
            paddingVertical: 2
          }}>
            <Text style={{
              fontSize: 10,
              fontWeight: '700',
              color: '#FFFFFF'
            }}>
              CURRENT
            </Text>
          </View>
        </View>
        <Text style={{
          fontSize: 16,
          fontWeight: '600',
          color: '#1F2937'
        }}>
          {stepTitle}
        </Text>
      </View>

      {/* Motivational Message */}
      <View style={{
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6'
      }}>
        <Text style={{
          fontSize: 14,
          color: '#6B7280',
          textAlign: 'center',
          fontStyle: 'italic'
        }}>
          You're doing great! Let's finish setting up your StatLocker.
        </Text>
      </View>
    </Animated.View>
  )
}