import { useEffect } from 'react'
import { router } from 'expo-router'
import { useOnboardingStore } from '../../../src/stores/onboardingStore'

/**
 * Onboarding entry point - determines where to start based on existing progress
 */
export default function OnboardingIndex() {
  const { currentStep, hasExistingProgress, loadProgress } = useOnboardingStore()

  useEffect(() => {
    const initializeOnboarding = async () => {
      // Load any existing progress from storage
      await loadProgress()
      
      // Determine starting step based on progress
      const startStep = hasExistingProgress ? currentStep : 1
      
      // Navigate to the appropriate step
      router.replace(`/onboarding/${startStep}`)
    }

    initializeOnboarding()
  }, [])

  // Show loading while determining where to start
  return null
}