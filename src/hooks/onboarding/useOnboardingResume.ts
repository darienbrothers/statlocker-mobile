import { useEffect, useState, useCallback } from 'react'
import { Alert } from 'react-native'
import { useRouter } from 'expo-router'
import { OnboardingProgress, OnboardingProfile } from '@/types/onboarding'
import { useProgressPersistence } from './useProgressPersistence'
import { calculateCompletionPercentage, getNextRequiredStep } from '@/lib/onboarding/progressValidation'

interface UseOnboardingResumeProps {
  onProgressRestored?: (progress: OnboardingProgress) => void
  onResumeDeclined?: () => void
  autoResume?: boolean
}

interface ResumeState {
  hasIncompleteonboarding: boolean
  savedProgress: OnboardingProgress | null
  completionPercentage: number
  nextStep: number
  showResumePrompt: boolean
  isLoading: boolean
}

export const useOnboardingResume = ({
  onProgressRestored,
  onResumeDeclined,
  autoResume = false
}: UseOnboardingResumeProps = {}) => {
  const router = useRouter()
  const [resumeState, setResumeState] = useState<ResumeState>({
    hasIncompleteonboarding: false,
    savedProgress: null,
    completionPercentage: 0,
    nextStep: 1,
    showResumePrompt: false,
    isLoading: true
  })

  const { loadProgress, clearProgress, validateProgress } = useProgressPersistence({
    profile: {} as OnboardingProfile,
    currentStep: 0,
    completedSteps: new Set(),
    onProgressRestored
  })

  // Check for incomplete onboarding on mount
  useEffect(() => {
    checkForIncompleteOnboarding()
  }, [])

  const checkForIncompleteOnboarding = useCallback(async () => {
    try {
      setResumeState(prev => ({ ...prev, isLoading: true }))
      
      const savedProgress = await loadProgress()
      
      if (savedProgress && validateProgress(savedProgress)) {
        const isComplete = savedProgress.profile.onboardingCompleted !== undefined
        
        if (!isComplete) {
          const completionPercentage = calculateCompletionPercentage(
            savedProgress.profile,
            savedProgress.completedSteps
          )
          
          const nextStep = getNextRequiredStep(
            savedProgress.profile,
            savedProgress.completedSteps
          )

          setResumeState({
            hasIncompleteonboarding: true,
            savedProgress,
            completionPercentage,
            nextStep,
            showResumePrompt: !autoResume,
            isLoading: false
          })

          if (autoResume) {
            await resumeOnboarding(savedProgress)
          }
        } else {
          setResumeState(prev => ({
            ...prev,
            hasIncompleteonboarding: false,
            isLoading: false
          }))
        }
      } else {
        setResumeState(prev => ({
          ...prev,
          hasIncompleteonboarding: false,
          isLoading: false
        }))
      }
    } catch (error) {
      console.error('Failed to check for incomplete onboarding:', error)
      setResumeState(prev => ({
        ...prev,
        hasIncompleteonboarding: false,
        isLoading: false
      }))
    }
  }, [loadProgress, validateProgress, autoResume])

  // Resume onboarding from saved progress
  const resumeOnboarding = useCallback(async (progress?: OnboardingProgress) => {
    try {
      const progressToResume = progress || resumeState.savedProgress
      
      if (!progressToResume) {
        throw new Error('No saved progress to resume')
      }

      // Restore progress through callback
      if (onProgressRestored) {
        onProgressRestored(progressToResume)
      }

      // Navigate to the appropriate step
      const nextStep = getNextRequiredStep(
        progressToResume.profile,
        progressToResume.completedSteps
      )

      router.push(`/onboarding/${nextStep}`)

      // Hide resume prompt
      setResumeState(prev => ({
        ...prev,
        showResumePrompt: false
      }))

      // Log analytics event
      // TODO: Add analytics tracking
      console.log('Onboarding resumed', {
        fromStep: nextStep,
        completionPercentage: calculateCompletionPercentage(
          progressToResume.profile,
          progressToResume.completedSteps
        )
      })

    } catch (error) {
      console.error('Failed to resume onboarding:', error)
      Alert.alert(
        'Resume Failed',
        'Unable to resume your previous session. Would you like to start over?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Start Over', onPress: startFreshOnboarding }
        ]
      )
    }
  }, [resumeState.savedProgress, onProgressRestored, router])

  // Start fresh onboarding (clear saved progress)
  const startFreshOnboarding = useCallback(async () => {
    try {
      await clearProgress()
      
      setResumeState({
        hasIncompleteonboarding: false,
        savedProgress: null,
        completionPercentage: 0,
        nextStep: 1,
        showResumePrompt: false,
        isLoading: false
      })

      if (onResumeDeclined) {
        onResumeDeclined()
      }

      router.push('/onboarding/1')

      // Log analytics event
      console.log('Fresh onboarding started')

    } catch (error) {
      console.error('Failed to start fresh onboarding:', error)
      Alert.alert(
        'Error',
        'Unable to clear previous session. Please try again.',
        [{ text: 'OK' }]
      )
    }
  }, [clearProgress, onResumeDeclined, router])

  // Show resume prompt dialog
  const showResumePrompt = useCallback(() => {
    if (!resumeState.savedProgress) return

    const { completionPercentage } = resumeState

    Alert.alert(
      'Resume Setup',
      `You have an incomplete setup that's ${completionPercentage}% complete. Would you like to continue where you left off?`,
      [
        {
          text: 'Start Over',
          style: 'destructive',
          onPress: startFreshOnboarding
        },
        {
          text: 'Resume',
          style: 'default',
          onPress: () => resumeOnboarding()
        }
      ],
      { cancelable: false }
    )
  }, [resumeState.savedProgress, resumeState.completionPercentage, resumeOnboarding, startFreshOnboarding])

  // Dismiss resume prompt
  const dismissResumePrompt = useCallback(() => {
    setResumeState(prev => ({
      ...prev,
      showResumePrompt: false
    }))
  }, [])

  // Get resume card data for UI
  const getResumeCardData = useCallback(() => {
    if (!resumeState.savedProgress) return null

    const { savedProgress, completionPercentage, nextStep } = resumeState
    const lastUpdated = savedProgress.lastUpdated
    const daysSinceUpdate = Math.floor(
      (Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24)
    )

    return {
      completionPercentage,
      nextStep,
      lastUpdated,
      daysSinceUpdate,
      stepTitle: getStepTitle(nextStep),
      canResume: true
    }
  }, [resumeState])

  // Get step title for display
  const getStepTitle = (step: number): string => {
    const stepTitles: Record<number, string> = {
      1: 'Choose Your Role',
      2: 'Sport & Demographics',
      3: 'Position & Level',
      4: 'Team Details',
      5: 'Select Goals',
      6: 'AthleteDNA Quiz',
      7: 'AI Tone Preference',
      8: 'Age Verification',
      9: 'Legal Consent',
      10: 'Review Profile',
      11: 'Create Account'
    }
    return stepTitles[step] || 'Continue Setup'
  }

  // Force refresh resume state
  const refreshResumeState = useCallback(() => {
    checkForIncompleteOnboarding()
  }, [checkForIncompleteOnboarding])

  return {
    // State
    ...resumeState,
    
    // Actions
    resumeOnboarding,
    startFreshOnboarding,
    showResumePrompt,
    dismissResumePrompt,
    refreshResumeState,
    
    // Utilities
    getResumeCardData,
    getStepTitle
  }
}