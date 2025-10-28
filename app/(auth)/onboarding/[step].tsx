import { useLocalSearchParams, router } from 'expo-router'
import { useEffect, useState } from 'react'
import { View, Text } from 'react-native'
import { useOnboardingStore } from '../../../src/stores/onboardingStore'
import { StepWrapper } from '../../../src/components/onboarding/StepWrapper'

// Import actual step components
import { RoleSelection } from '../../../src/components/onboarding/steps/RoleSelection'
import { SportGender } from '../../../src/components/onboarding/steps/SportGender'
import { PositionLevel } from '../../../src/components/onboarding/steps/PositionLevel'
import { TeamDetails } from '../../../src/components/onboarding/steps/TeamDetails'
import { GoalSelection } from '../../../src/components/onboarding/steps/GoalSelection'
import { AthleteDNA } from '../../../src/components/onboarding/steps/AthleteDNA'
import { TonePreference } from '../../../src/components/onboarding/steps/TonePreference'
import { AgeVerification } from '../../../src/components/onboarding/steps/AgeVerification'
import { LegalConsent } from '../../../src/components/onboarding/steps/LegalConsent'
import { ReviewProfile } from '../../../src/components/onboarding/steps/ReviewProfile'
import { AccountCreation } from '../../../src/components/onboarding/steps/AccountCreation'

const stepComponents = {
  1: RoleSelection,
  2: SportGender,
  3: PositionLevel,
  4: TeamDetails,
  5: GoalSelection,
  6: AthleteDNA,
  7: TonePreference,
  8: AgeVerification,
  9: LegalConsent,
  10: ReviewProfile,
  11: AccountCreation,
}

/**
 * Dynamic step router for onboarding flow
 */
export default function OnboardingStep() {
  const { step } = useLocalSearchParams<{ step: string }>()
  const stepNumber = parseInt(step || '1', 10)
  
  const { 
    currentStep, 
    totalSteps, 
    setStep, 
    canNavigateToStep,
    navigateNext,
    navigateBack
  } = useOnboardingStore()

  const [isValidStep, setIsValidStep] = useState(false)

  useEffect(() => {
    // Validate step number and navigation permissions
    if (stepNumber >= 1 && stepNumber <= totalSteps && canNavigateToStep(stepNumber)) {
      setStep(stepNumber)
      setIsValidStep(true)
    } else {
      // Redirect to valid step if invalid step requested
      router.replace(`/onboarding/${currentStep}`)
    }
  }, [stepNumber, currentStep, totalSteps])

  const handleNext = () => {
    if (stepNumber < totalSteps) {
      navigateNext()
      router.push(`/onboarding/${stepNumber + 1}`)
    }
  }

  const handleBack = () => {
    if (stepNumber > 1) {
      navigateBack()
      router.back()
    }
  }

  if (!isValidStep) {
    return (
      <View className="flex-1 bg-gray-900 justify-center items-center">
        <Text className="text-white">Loading...</Text>
      </View>
    )
  }

  const StepComponent = stepComponents[stepNumber as keyof typeof stepComponents]

  if (!StepComponent) {
    return (
      <View className="flex-1 bg-gray-900 justify-center items-center">
        <Text className="text-white">Step not found</Text>
      </View>
    )
  }

  return (
    <StepWrapper
      stepNumber={stepNumber}
      title={`Step ${stepNumber}`}
      onNext={handleNext}
      onBack={handleBack}
      nextDisabled={false} // Will be controlled by step validation
    >
      <StepComponent />
    </StepWrapper>
  )
}