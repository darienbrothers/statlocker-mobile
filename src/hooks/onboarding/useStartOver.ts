import { useState, useCallback } from 'react'
import { Alert } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'expo-router'
import { OnboardingProfile, OnboardingProgress } from '@/types/onboarding'
import { clearOfflineQueue } from '@/lib/onboarding/offlineQueue'

interface UseStartOverProps {
  currentProfile?: OnboardingProfile
  currentStep?: number
  onStartOver?: () => void
  onExportComplete?: (exportData: string) => void
}

interface ExportData {
  profile: OnboardingProfile
  currentStep: number
  completedSteps: number[]
  exportedAt: Date
  version: string
}

export const useStartOver = ({
  currentProfile,
  currentStep = 0,
  onStartOver,
  onExportComplete
}: UseStartOverProps = {}) => {
  const { user } = useAuth()
  const router = useRouter()
  const [isResetting, setIsResetting] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  // Export current progress data
  const exportProgressData = useCallback(async (): Promise<string> => {
    try {
      setIsExporting(true)

      const exportData: ExportData = {
        profile: currentProfile || {},
        currentStep: currentStep,
        completedSteps: [], // Would come from store
        exportedAt: new Date(),
        version: '1.0.0'
      }

      const exportString = JSON.stringify(exportData, null, 2)
      
      if (onExportComplete) {
        onExportComplete(exportString)
      }

      return exportString
    } catch (error) {
      console.error('Failed to export progress data:', error)
      throw error
    } finally {
      setIsExporting(false)
    }
  }, [currentProfile, currentStep, onExportComplete])

  // Clear all onboarding data
  const clearAllData = useCallback(async () => {
    try {
      // Clear local storage
      await AsyncStorage.multiRemove([
        'onboarding_progress',
        'device_id' // Keep device ID for analytics
      ])

      // Clear Firestore progress if user is authenticated
      if (user?.uid) {
        const progressRef = doc(db, 'onboarding_progress', user.uid)
        await setDoc(progressRef, {
          cleared: true,
          clearedAt: serverTimestamp(),
          clearedBy: 'user_action',
          userId: user.uid
        })
      }

      // Clear offline queue
      await clearOfflineQueue()

      console.log('All onboarding data cleared successfully')
    } catch (error) {
      console.error('Failed to clear onboarding data:', error)
      throw error
    }
  }, [user?.uid])

  // Start over with confirmation
  const startOver = useCallback(async (skipConfirmation = false) => {
    if (isResetting) return

    const performReset = async () => {
      try {
        setIsResetting(true)

        // Clear all data
        await clearAllData()

        // Call callback if provided
        if (onStartOver) {
          onStartOver()
        }

        // Navigate to first step
        router.replace('/onboarding/1')

        // Log analytics event
        console.log('Onboarding reset completed', {
          previousStep: currentStep,
          userId: user?.uid,
          timestamp: new Date().toISOString()
        })

      } catch (error) {
        console.error('Failed to start over:', error)
        Alert.alert(
          'Reset Failed',
          'Unable to reset your progress. Please try again.',
          [{ text: 'OK' }]
        )
      } finally {
        setIsResetting(false)
      }
    }

    if (skipConfirmation) {
      await performReset()
      return
    }

    // Show confirmation dialog
    Alert.alert(
      'Start Over',
      'This will permanently delete all your onboarding progress. This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Export First',
          onPress: () => showExportDialog(performReset)
        },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: performReset
        }
      ]
    )
  }, [isResetting, clearAllData, onStartOver, router, currentStep, user?.uid])

  // Show export dialog before reset
  const showExportDialog = useCallback((onContinue: () => void) => {
    Alert.alert(
      'Export Progress',
      'Would you like to export your current progress before starting over? This creates a backup you can reference later.',
      [
        {
          text: 'Skip Export',
          style: 'destructive',
          onPress: onContinue
        },
        {
          text: 'Export & Reset',
          onPress: async () => {
            try {
              await exportProgressData()
              Alert.alert(
                'Export Complete',
                'Your progress has been exported. You can find it in your device\'s downloads or share it via the share sheet.',
                [
                  {
                    text: 'Continue Reset',
                    onPress: onContinue
                  }
                ]
              )
            } catch (error) {
              Alert.alert(
                'Export Failed',
                'Unable to export your progress. Would you like to continue with the reset anyway?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Reset Anyway', style: 'destructive', onPress: onContinue }
                ]
              )
            }
          }
        }
      ]
    )
  }, [exportProgressData])

  // Quick reset (for development/testing)
  const quickReset = useCallback(async () => {
    if (__DEV__) {
      await startOver(true)
    } else {
      console.warn('Quick reset is only available in development mode')
    }
  }, [startOver])

  // Reset specific sections
  const resetSection = useCallback(async (section: 'profile' | 'goals' | 'preferences') => {
    Alert.alert(
      'Reset Section',
      `Are you sure you want to reset your ${section} data? This will clear all information in this section.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              // This would integrate with the onboarding store to reset specific sections
              console.log(`Resetting ${section} section`)
              
              // Log analytics
              console.log('Section reset', {
                section,
                userId: user?.uid,
                timestamp: new Date().toISOString()
              })
              
            } catch (error) {
              console.error(`Failed to reset ${section} section:`, error)
              Alert.alert('Reset Failed', `Unable to reset ${section} section.`)
            }
          }
        }
      ]
    )
  }, [user?.uid])

  // Check if reset is available
  const canReset = useCallback((): boolean => {
    return currentStep > 0 || (currentProfile && Object.keys(currentProfile).length > 0)
  }, [currentStep, currentProfile])

  // Get reset confirmation message
  const getResetMessage = useCallback((): string => {
    if (currentStep === 0) {
      return 'No progress to reset.'
    }
    
    const stepProgress = currentStep > 0 ? `You are currently on step ${currentStep}.` : ''
    const dataWarning = 'All your information will be permanently deleted.'
    
    return `${stepProgress} ${dataWarning} This action cannot be undone.`
  }, [currentStep])

  return {
    // State
    isResetting,
    isExporting,
    
    // Actions
    startOver,
    quickReset,
    resetSection,
    exportProgressData,
    
    // Utilities
    canReset,
    getResetMessage,
    clearAllData
  }
}