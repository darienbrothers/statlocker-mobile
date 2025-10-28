/**
 * Profile validation hook for onboarding
 * Integrates comprehensive validation with the onboarding store
 */

import { useState, useEffect, useCallback } from 'react'
import { useOnboardingStore } from '../../stores/onboardingStore'
import { 
  profileValidator, 
  errorHandler,
  type ValidationResult,
  type ValidationError,
  type RetryConfig
} from '../../lib/onboarding/profileValidation'
import type { OnboardingProfile, OnboardingError } from '../../types/onboarding'

export interface UseProfileValidationReturn {
  // Validation state
  isValidating: boolean
  validationResult: ValidationResult | null
  hasErrors: boolean
  hasCriticalErrors: boolean
  
  // Error handling
  lastError: OnboardingError | null
  retryCount: number
  canRetry: boolean
  
  // Actions
  validateProfile: () => Promise<ValidationResult>
  validateStep: (stepNumber: number) => Promise<boolean>
  retryLastOperation: () => Promise<void>
  clearErrors: () => void
  
  // Helpers
  getErrorsForField: (field: string) => ValidationError[]
  getRecoveryActions: () => string[]
  getUserFriendlyMessage: () => string | null
}

/**
 * Hook for comprehensive profile validation and error handling
 */
export function useProfileValidation(): UseProfileValidationReturn {
  const { profile, setValidationErrors, clearValidationErrors } = useOnboardingStore()
  
  const [isValidating, setIsValidating] = useState(false)
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null)
  const [lastError, setLastError] = useState<OnboardingError | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const [lastOperation, setLastOperation] = useState<(() => Promise<any>) | null>(null)

  // Clear validation state when profile changes
  useEffect(() => {
    setValidationResult(null)
    setLastError(null)
  }, [profile])

  /**
   * Validate complete profile
   */
  const validateProfile = useCallback(async (): Promise<ValidationResult> => {
    setIsValidating(true)
    setLastError(null)

    try {
      const result = await errorHandler.retryOperation(
        () => Promise.resolve(profileValidator.validateProfile(profile)),
        { maxAttempts: 2, backoffMs: 500, exponentialBackoff: false }
      )

      setValidationResult(result)
      
      // Update store with validation errors
      if (result.errors.length > 0) {
        const errorsByStep = groupErrorsByStep(result.errors)
        Object.entries(errorsByStep).forEach(([step, errors]) => {
          setValidationErrors(parseInt(step), errors.map(e => e.message))
        })
      } else {
        // Clear all validation errors if profile is valid
        for (let i = 1; i <= 11; i++) {
          clearValidationErrors(i)
        }
      }

      setIsValidating(false)
      return result
      
    } catch (error) {
      const onboardingError: OnboardingError = {
        type: 'validation',
        message: (error as Error).message,
        retryable: true,
        timestamp: new Date()
      }
      
      setLastError(onboardingError)
      setIsValidating(false)
      throw onboardingError
    }
  }, [profile, setValidationErrors, clearValidationErrors])

  /**
   * Validate specific step
   */
  const validateStep = useCallback(async (stepNumber: number): Promise<boolean> => {
    setIsValidating(true)
    setLastError(null)

    try {
      const stepProfile = extractStepData(profile, stepNumber)
      const result = await errorHandler.retryOperation(
        () => Promise.resolve(profileValidator.validateProfile(stepProfile)),
        { maxAttempts: 2, backoffMs: 300, exponentialBackoff: false }
      )

      const stepErrors = result.errors.filter(error => 
        isErrorForStep(error, stepNumber)
      )

      if (stepErrors.length > 0) {
        setValidationErrors(stepNumber, stepErrors.map(e => e.message))
      } else {
        clearValidationErrors(stepNumber)
      }

      setIsValidating(false)
      return stepErrors.length === 0
      
    } catch (error) {
      const onboardingError: OnboardingError = {
        type: 'validation',
        message: (error as Error).message,
        step: stepNumber,
        retryable: true,
        timestamp: new Date()
      }
      
      setLastError(onboardingError)
      setIsValidating(false)
      return false
    }
  }, [profile, setValidationErrors, clearValidationErrors])

  /**
   * Retry last failed operation
   */
  const retryLastOperation = useCallback(async (): Promise<void> => {
    if (!lastOperation || !canRetry) {
      return
    }

    setRetryCount(prev => prev + 1)
    setLastError(null)

    try {
      await lastOperation()
      setLastOperation(null)
      setRetryCount(0)
    } catch (error) {
      const onboardingError: OnboardingError = {
        type: 'unknown',
        message: (error as Error).message,
        retryable: retryCount < 2,
        timestamp: new Date()
      }
      
      setLastError(onboardingError)
    }
  }, [lastOperation, retryCount])

  /**
   * Clear all errors
   */
  const clearErrors = useCallback(() => {
    setLastError(null)
    setValidationResult(null)
    setRetryCount(0)
    setLastOperation(null)
  }, [])

  /**
   * Get validation errors for specific field
   */
  const getErrorsForField = useCallback((field: string): ValidationError[] => {
    if (!validationResult) return []
    
    return validationResult.errors.filter(error => 
      error.field === field || error.field.startsWith(`${field}.`)
    )
  }, [validationResult])

  /**
   * Get recovery actions for current error
   */
  const getRecoveryActions = useCallback((): string[] => {
    if (!lastError) return []
    
    return errorHandler.getRecoveryActions(lastError)
  }, [lastError])

  /**
   * Get user-friendly error message
   */
  const getUserFriendlyMessage = useCallback((): string | null => {
    if (!lastError) return null
    
    return errorHandler.createUserFriendlyMessage(lastError)
  }, [lastError])

  // Computed properties
  const hasErrors = validationResult ? validationResult.errors.length > 0 : false
  const hasCriticalErrors = validationResult 
    ? validationResult.errors.some(e => !e.retryable) 
    : false
  const canRetry = lastError?.retryable && retryCount < 3

  return {
    // Validation state
    isValidating,
    validationResult,
    hasErrors,
    hasCriticalErrors,
    
    // Error handling
    lastError,
    retryCount,
    canRetry,
    
    // Actions
    validateProfile,
    validateStep,
    retryLastOperation,
    clearErrors,
    
    // Helpers
    getErrorsForField,
    getRecoveryActions,
    getUserFriendlyMessage
  }
}

/**
 * Group validation errors by step number
 */
function groupErrorsByStep(errors: ValidationError[]): Record<string, ValidationError[]> {
  const errorsByStep: Record<string, ValidationError[]> = {}
  
  errors.forEach(error => {
    const step = getStepForField(error.field)
    if (!errorsByStep[step]) {
      errorsByStep[step] = []
    }
    errorsByStep[step].push(error)
  })
  
  return errorsByStep
}

/**
 * Determine which step a field belongs to
 */
function getStepForField(field: string): string {
  const fieldToStepMap: Record<string, number> = {
    'role': 1,
    'sport': 2,
    'gender': 2,
    'dateOfBirth': 2,
    'graduationYear': 2,
    'position': 3,
    'academicLevel': 3,
    'teamType': 4,
    'school': 4,
    'club': 4,
    'selectedGoals': 5,
    'dna': 6,
    'aiTone': 7,
    'ageVerified': 8,
    'guardianEmail': 8,
    'tosAccepted': 9,
    'privacyAccepted': 9,
    'benchmarkingConsent': 9
  }
  
  // Handle nested fields like 'school.name'
  const baseField = field.split('.')[0]
  return (fieldToStepMap[baseField] || 10).toString()
}

/**
 * Check if error belongs to specific step
 */
function isErrorForStep(error: ValidationError, stepNumber: number): boolean {
  const errorStep = parseInt(getStepForField(error.field))
  return errorStep === stepNumber
}

/**
 * Extract profile data relevant to specific step
 */
function extractStepData(profile: OnboardingProfile, stepNumber: number): OnboardingProfile {
  switch (stepNumber) {
    case 1:
      return { role: profile.role }
    case 2:
      return {
        sport: profile.sport,
        gender: profile.gender,
        dateOfBirth: profile.dateOfBirth,
        graduationYear: profile.graduationYear
      }
    case 3:
      return {
        position: profile.position,
        academicLevel: profile.academicLevel
      }
    case 4:
      return {
        teamType: profile.teamType,
        school: profile.school,
        club: profile.club
      }
    case 5:
      return { selectedGoals: profile.selectedGoals }
    case 6:
      return { dna: profile.dna }
    case 7:
      return { aiTone: profile.aiTone }
    case 8:
      return {
        dateOfBirth: profile.dateOfBirth,
        ageVerified: profile.ageVerified,
        guardianEmail: profile.guardianEmail
      }
    case 9:
      return {
        tosAccepted: profile.tosAccepted,
        privacyAccepted: profile.privacyAccepted,
        benchmarkingConsent: profile.benchmarkingConsent
      }
    default:
      return profile
  }
}