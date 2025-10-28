import React, { useState } from 'react'
import { View, Text, TouchableOpacity, Alert, Share } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useStartOver } from '@/hooks/onboarding/useStartOver'
import { OnboardingProfile } from '@/types/onboarding'

interface StartOverButtonProps {
  currentProfile?: OnboardingProfile
  currentStep?: number
  variant?: 'primary' | 'secondary' | 'text'
  size?: 'small' | 'medium' | 'large'
  showIcon?: boolean
  onStartOver?: () => void
  style?: any
}

export const StartOverButton: React.FC<StartOverButtonProps> = ({
  currentProfile,
  currentStep = 0,
  variant = 'secondary',
  size = 'medium',
  showIcon = true,
  onStartOver,
  style
}) => {
  const [showExportOptions, setShowExportOptions] = useState(false)

  const {
    startOver,
    isResetting,
    exportProgressData,
    isExporting,
    canReset,
    getResetMessage
  } = useStartOver({
    currentProfile,
    currentStep,
    onStartOver,
    onExportComplete: (exportData) => {
      // Handle export completion
      handleExportComplete(exportData)
    }
  })

  const handleExportComplete = async (exportData: string) => {
    try {
      await Share.share({
        message: 'StatLocker Onboarding Progress Export',
        title: 'Onboarding Progress',
        url: `data:application/json;base64,${btoa(exportData)}`
      })
    } catch (error) {
      console.error('Failed to share export data:', error)
    }
  }

  const handlePress = () => {
    if (!canReset()) {
      Alert.alert(
        'Nothing to Reset',
        'You haven\'t started the onboarding process yet.',
        [{ text: 'OK' }]
      )
      return
    }

    Alert.alert(
      'Start Over',
      getResetMessage(),
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Export First',
          onPress: () => setShowExportOptions(true)
        },
        {
          text: 'Reset Now',
          style: 'destructive',
          onPress: () => startOver()
        }
      ]
    )
  }

  const handleExportAndReset = async () => {
    try {
      await exportProgressData()
      setShowExportOptions(false)
      
      Alert.alert(
        'Export Complete',
        'Your progress has been exported. Ready to start over?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Start Over', style: 'destructive', onPress: () => startOver() }
        ]
      )
    } catch (error) {
      Alert.alert(
        'Export Failed',
        'Unable to export your progress. Continue with reset anyway?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Reset Anyway', style: 'destructive', onPress: () => startOver() }
        ]
      )
    }
  }

  // Style configurations
  const getButtonStyles = () => {
    const baseStyles = {
      borderRadius: size === 'small' ? 8 : size === 'medium' ? 12 : 16,
      paddingVertical: size === 'small' ? 8 : size === 'medium' ? 12 : 16,
      paddingHorizontal: size === 'small' ? 12 : size === 'medium' ? 16 : 24,
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const
    }

    switch (variant) {
      case 'primary':
        return {
          ...baseStyles,
          backgroundColor: '#EF4444',
          shadowColor: '#EF4444',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.2,
          shadowRadius: 4,
          elevation: 3
        }
      case 'secondary':
        return {
          ...baseStyles,
          backgroundColor: '#F3F4F6',
          borderWidth: 1,
          borderColor: '#D1D5DB'
        }
      case 'text':
        return {
          ...baseStyles,
          backgroundColor: 'transparent'
        }
      default:
        return baseStyles
    }
  }

  const getTextStyles = () => {
    const baseStyles = {
      fontSize: size === 'small' ? 14 : size === 'medium' ? 16 : 18,
      fontWeight: '600' as const,
      marginLeft: showIcon ? 8 : 0
    }

    switch (variant) {
      case 'primary':
        return { ...baseStyles, color: '#FFFFFF' }
      case 'secondary':
        return { ...baseStyles, color: '#6B7280' }
      case 'text':
        return { ...baseStyles, color: '#EF4444' }
      default:
        return baseStyles
    }
  }

  const getIconColor = () => {
    switch (variant) {
      case 'primary':
        return '#FFFFFF'
      case 'secondary':
        return '#6B7280'
      case 'text':
        return '#EF4444'
      default:
        return '#6B7280'
    }
  }

  const getIconSize = () => {
    return size === 'small' ? 16 : size === 'medium' ? 18 : 20
  }

  if (showExportOptions) {
    return (
      <View style={[{ padding: 16, backgroundColor: '#FEF3C7', borderRadius: 12 }, style]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
          <Ionicons name="download" size={20} color="#F59E0B" />
          <Text style={{
            fontSize: 16,
            fontWeight: '600',
            color: '#92400E',
            marginLeft: 8
          }}>
            Export Progress
          </Text>
        </View>
        
        <Text style={{
          fontSize: 14,
          color: '#92400E',
          marginBottom: 16,
          lineHeight: 20
        }}>
          Save your current progress before starting over. This creates a backup you can reference later.
        </Text>

        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity
            onPress={() => setShowExportOptions(false)}
            style={{
              flex: 1,
              backgroundColor: '#FFFFFF',
              borderRadius: 8,
              paddingVertical: 10,
              alignItems: 'center'
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#6B7280' }}>
              Cancel
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => startOver()}
            style={{
              flex: 1,
              backgroundColor: '#EF4444',
              borderRadius: 8,
              paddingVertical: 10,
              alignItems: 'center'
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#FFFFFF' }}>
              Skip Export
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleExportAndReset}
            disabled={isExporting}
            style={{
              flex: 1,
              backgroundColor: '#F59E0B',
              borderRadius: 8,
              paddingVertical: 10,
              alignItems: 'center'
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#FFFFFF' }}>
              {isExporting ? 'Exporting...' : 'Export & Reset'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={isResetting || !canReset()}
      style={[
        getButtonStyles(),
        { opacity: (isResetting || !canReset()) ? 0.5 : 1 },
        style
      ]}
      activeOpacity={0.8}
    >
      {showIcon && (
        <Ionicons 
          name={isResetting ? "sync" : "refresh"} 
          size={getIconSize()} 
          color={getIconColor()} 
        />
      )}
      <Text style={getTextStyles()}>
        {isResetting ? 'Resetting...' : 'Start Over'}
      </Text>
    </TouchableOpacity>
  )
}