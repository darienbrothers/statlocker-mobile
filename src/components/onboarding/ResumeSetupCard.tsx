import React from 'react'
import { View, Text, TouchableOpacity, Alert } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { useOnboardingResume } from '@/hooks/onboarding/useOnboardingResume'

interface ResumeSetupCardProps {
  onResumePress?: () => void
  onStartOverPress?: () => void
  showActions?: boolean
  style?: any
}

export const ResumeSetupCard: React.FC<ResumeSetupCardProps> = ({
  onResumePress,
  onStartOverPress,
  showActions = true,
  style
}) => {
  const {
    hasIncompleteonboarding,
    isLoading,
    getResumeCardData,
    resumeOnboarding,
    startFreshOnboarding
  } = useOnboardingResume()

  const resumeData = getResumeCardData()

  if (isLoading || !hasIncompleteonboarding || !resumeData) {
    return null
  }

  const handleResumePress = () => {
    if (onResumePress) {
      onResumePress()
    } else {
      resumeOnboarding()
    }
  }

  const handleStartOverPress = () => {
    Alert.alert(
      'Start Over',
      'This will clear your current progress. Are you sure you want to start over?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start Over',
          style: 'destructive',
          onPress: () => {
            if (onStartOverPress) {
              onStartOverPress()
            } else {
              startFreshOnboarding()
            }
          }
        }
      ]
    )
  }

  const formatLastUpdated = (date: Date): string => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffHours / 24)

    if (diffHours < 1) {
      return 'Just now'
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  return (
    <View style={[{ marginHorizontal: 20, marginVertical: 16 }, style]}>
      <LinearGradient
        colors={['#0047AB', '#0066CC']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          borderRadius: 16,
          padding: 20,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 12,
          elevation: 8
        }}
      >
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
          <View style={{
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            borderRadius: 12,
            padding: 8,
            marginRight: 12
          }}>
            <Ionicons name="refresh-circle" size={24} color="#FFFFFF" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{
              color: '#FFFFFF',
              fontSize: 18,
              fontWeight: '700',
              marginBottom: 2
            }}>
              Resume Your Setup
            </Text>
            <Text style={{
              color: 'rgba(255, 255, 255, 0.8)',
              fontSize: 14,
              fontWeight: '400'
            }}>
              {resumeData.completionPercentage}% complete • {formatLastUpdated(resumeData.lastUpdated)}
            </Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={{ marginBottom: 16 }}>
          <View style={{
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            height: 8,
            borderRadius: 4,
            overflow: 'hidden'
          }}>
            <View style={{
              backgroundColor: '#00D4FF',
              height: '100%',
              width: `${resumeData.completionPercentage}%`,
              borderRadius: 4
            }} />
          </View>
        </View>

        {/* Next Step Info */}
        <View style={{
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          borderRadius: 12,
          padding: 16,
          marginBottom: showActions ? 20 : 0
        }}>
          <Text style={{
            color: 'rgba(255, 255, 255, 0.8)',
            fontSize: 12,
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            marginBottom: 4
          }}>
            Next Step
          </Text>
          <Text style={{
            color: '#FFFFFF',
            fontSize: 16,
            fontWeight: '600'
          }}>
            {resumeData.stepTitle}
          </Text>
        </View>

        {/* Action Buttons */}
        {showActions && (
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity
              onPress={handleStartOverPress}
              style={{
                flex: 1,
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                borderRadius: 12,
                paddingVertical: 14,
                paddingHorizontal: 20,
                alignItems: 'center'
              }}
              activeOpacity={0.8}
            >
              <Text style={{
                color: '#FFFFFF',
                fontSize: 16,
                fontWeight: '600'
              }}>
                Start Over
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleResumePress}
              style={{
                flex: 2,
                backgroundColor: '#FFFFFF',
                borderRadius: 12,
                paddingVertical: 14,
                paddingHorizontal: 20,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center'
              }}
              activeOpacity={0.9}
            >
              <Text style={{
                color: '#0047AB',
                fontSize: 16,
                fontWeight: '700',
                marginRight: 8
              }}>
                Continue Setup
              </Text>
              <Ionicons name="arrow-forward" size={18} color="#0047AB" />
            </TouchableOpacity>
          </View>
        )}
      </LinearGradient>
    </View>
  )
}