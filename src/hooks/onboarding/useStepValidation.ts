import { useMemo } from 'react'
import { useOnboardingStore } from '../../stores/onboardingStore'
import type { OnboardingProfile, ValidationRule } from '../../types/onboarding'

/**
 * Hook for validating onboarding steps
 */
export function useStepValidation(stepNumber: number) {
  const { profile, validationErrors } = useOnboardingStore()

  const stepValidations = useMemo(() => {
    const validations: Record<number, ValidationRule[]> = {
      1: [{ field: 'role', required: true }],
      2: [
        { field: 'sport', required: true },
        { field: 'gender', required: true },
        { field: 'dateOfBirth', required: true },
        { field: 'graduationYear', required: true }
      ],
      3: [
        { field: 'position', required: true },
        { field: 'academicLevel', required: true }
      ],
      4: [
        { field: 'teamType', required: true },
        { field: 'school.name', required: true },
        { field: 'school.city', required: true },
        { field: 'school.state', required: true }
      ],
      5: [
        { 
          field: 'selectedGoals', 
          required: true,
          custom: (goals: string[]) => 
            goals?.length === 3 ? null : 'Please select exactly 3 goals'
        }
      ],
      6: [
        { field: 'dna.motivation', required: true },
        { field: 'dna.confidence', required: true },
        { field: 'dna.focusMode', required: true },
        { field: 'dna.competitiveness', required: true },
        { field: 'dna.coachability', required: true },
        { field: 'dna.resilience', required: true }
      ],
      7: [{ field: 'aiTone', required: true }],
      8: [{ field: 'ageVerified', required: true }],
      9: [
        { field: 'tosAccepted', required: true },
        { field: 'privacyAccepted', required: true }
      ]
    }
    
    return validations[stepNumber] || []
  }, [stepNumber])

  const validateStep = useMemo(() => {
    return (data: Partial<OnboardingProfile>) => {
      const errors: string[] = []

      stepValidations.forEach(rule => {
        const value = getNestedValue(data, rule.field)
        
        if (rule.required && (value === undefined || value === null || value === '')) {
          errors.push(`${rule.field} is required`)
        }
        
        if (rule.custom && value !== undefined) {
          const customError = rule.custom(value)
          if (customError) {
            errors.push(customError)
          }
        }
      })

      return errors
    }
  }, [stepValidations])

  const isStepValid = useMemo(() => {
    const errors = validateStep(profile)
    return errors.length === 0
  }, [profile, validateStep])

  const stepErrors = validationErrors[stepNumber] || []

  return {
    isStepValid,
    stepErrors,
    validateStep
  }
}

/**
 * Helper function to get nested object values by dot notation
 */
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj)
}