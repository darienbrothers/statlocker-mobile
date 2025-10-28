import { renderHook, act } from '@testing-library/react-hooks'
import { useProfileValidation } from '../useProfileValidation'
import { useOnboardingStore } from '../../../stores/onboardingStore'
import { profileValidator, errorHandler } from '../../../lib/onboarding/profileValidation'
import type { OnboardingProfile, OnboardingError } from '../../../types/onboarding'

// Mock dependencies
jest.mock('../../../stores/onboardingStore')
jest.mock('../../../lib/onboarding/profileValidation')

const mockUseOnboardingStore = useOnboardingStore as jest.MockedFunction<typeof useOnboardingStore>
const mockProfileValidator = profileValidator as jest.Mocked<typeof profileValidator>
const mockErrorHandler = errorHandler as jest.Mocked<typeof errorHandler>

describe('useProfileValidation', () => {
  const mockSetValidationErrors = jest.fn()
  const mockClearValidationErrors = jest.fn()

  const mockProfile: OnboardingProfile = {
    role: 'athlete',
    sport: 'lacrosse',
    gender: 'male',
    dateOfBirth: new Date('2006-05-15'),
    graduationYear: 2025,
    position: 'midfielder',
    academicLevel: 'varsity',
    teamType: 'high_school',
    school: {
      name: 'Test High School',
      city: 'Test City',
      state: 'CA'
    },
    selectedGoals: ['Goal 1', 'Goal 2', 'Goal 3'],
    dna: {
      motivation: 'intrinsic',
      confidence: 'high',
      focusMode: 'intense',
      competitiveness: 'high',
      coachability: 'high',
      resilience: 'high'
    },
    aiTone: 'hype',
    ageVerified: true,
    tosAccepted: true,
    privacyAccepted: true,
    benchmarkingConsent: false
  }

  beforeEach(() => {
    jest.clearAllMocks()
    
    mockUseOnboardingStore.mockReturnValue({
      profile: mockProfile,
      setValidationErrors: mockSetValidationErrors,
      clearValidationErrors: mockClearValidationErrors,
    } as any)

    mockErrorHandler.retryOperation = jest.fn().mockImplementation((operation) => operation())
  })

  describe('Profile Validation', () => {
    it('should validate complete profile successfully', async () => {
      const mockValidationResult = {
        isValid: true,
        errors: [],
        warnings: []
      }

      mockProfileValidator.validateProfile.mockReturnValue(mockValidationResult)

      const { result } = renderHook(() => useProfileValidation())

      await act(async () => {
        const validationResult = await result.current.validateProfile()
        expect(validationResult).toEqual(mockValidationResult)
      })

      expect(mockProfileValidator.validateProfile).toHaveBeenCalledWith(mockProfile)
      expect(result.current.isValidating).toBe(false)
      expect(result.current.hasErrors).toBe(false)
    })

    it('should handle validation errors', async () => {
      const mockValidationResult = {
        isValid: false,
        errors: [
          {
            field: 'email',
            message: 'Email is required',
            code: 'EMAIL_REQUIRED',
            severity: 'error' as const,
            retryable: true
          }
        ],
        warnings: []
      }

      mockProfileValidator.validateProfile.mockReturnValue(mockValidationResult)

      const { result } = renderHook(() => useProfileValidation())

      await act(async () => {
        await result.current.validateProfile()
      })

      expect(result.current.hasErrors).toBe(true)
      expect(result.current.validationResult?.errors).toHaveLength(1)
      expect(mockSetValidationErrors).toHaveBeenCalled()
    })

    it('should clear validation errors when profile is valid', async () => {
      const mockValidationResult = {
        isValid: true,
        errors: [],
        warnings: []
      }

      mockProfileValidator.validateProfile.mockReturnValue(mockValidationResult)

      const { result } = renderHook(() => useProfileValidation())

      await act(async () => {
        await result.current.validateProfile()
      })

      // Should clear errors for all steps
      expect(mockClearValidationErrors).toHaveBeenCalledTimes(11)
      for (let i = 1; i <= 11; i++) {
        expect(mockClearValidationErrors).toHaveBeenCalledWith(i)
      }
    })

    it('should set loading state during validation', async () => {
      let resolveValidation: (value: any) => void
      const validationPromise = new Promise(resolve => {
        resolveValidation = resolve
      })

      mockErrorHandler.retryOperation = jest.fn().mockReturnValue(validationPromise)

      const { result } = renderHook(() => useProfileValidation())

      act(() => {
        result.current.validateProfile()
      })

      expect(result.current.isValidating).toBe(true)

      await act(async () => {
        resolveValidation!({
          isValid: true,
          errors: [],
          warnings: []
        })
        await validationPromise
      })

      expect(result.current.isValidating).toBe(false)
    })
  })

  describe('Step Validation', () => {
    it('should validate specific step successfully', async () => {
      const mockValidationResult = {
        isValid: true,
        errors: [],
        warnings: []
      }

      mockProfileValidator.validateProfile.mockReturnValue(mockValidationResult)

      const { result } = renderHook(() => useProfileValidation())

      await act(async () => {
        const isValid = await result.current.validateStep(1)
        expect(isValid).toBe(true)
      })

      expect(mockClearValidationErrors).toHaveBeenCalledWith(1)
    })

    it('should handle step validation errors', async () => {
      const mockValidationResult = {
        isValid: false,
        errors: [
          {
            field: 'role',
            message: 'Role is required',
            code: 'ROLE_REQUIRED',
            severity: 'error' as const,
            retryable: true
          }
        ],
        warnings: []
      }

      mockProfileValidator.validateProfile.mockReturnValue(mockValidationResult)

      const { result } = renderHook(() => useProfileValidation())

      await act(async () => {
        const isValid = await result.current.validateStep(1)
        expect(isValid).toBe(false)
      })

      expect(mockSetValidationErrors).toHaveBeenCalledWith(1, ['Role is required'])
    })

    it('should extract correct step data for validation', async () => {
      const mockValidationResult = {
        isValid: true,
        errors: [],
        warnings: []
      }

      mockProfileValidator.validateProfile.mockReturnValue(mockValidationResult)

      const { result } = renderHook(() => useProfileValidation())

      await act(async () => {
        await result.current.validateStep(2) // Demographics step
      })

      // Should validate with only step 2 data
      const expectedStepData = {
        sport: mockProfile.sport,
        gender: mockProfile.gender,
        dateOfBirth: mockProfile.dateOfBirth,
        graduationYear: mockProfile.graduationYear
      }

      expect(mockProfileValidator.validateProfile).toHaveBeenCalledWith(expectedStepData)
    })
  })

  describe('Error Handling', () => {
    it('should handle validation operation failures', async () => {
      const validationError = new Error('Validation failed')
      mockErrorHandler.retryOperation = jest.fn().mockRejectedValue(validationError)

      const { result } = renderHook(() => useProfileValidation())

      await act(async () => {
        try {
          await result.current.validateProfile()
        } catch (error) {
          expect(error).toBeInstanceOf(Error)
        }
      })

      expect(result.current.lastError).toBeDefined()
      expect(result.current.lastError?.type).toBe('validation')
    })

    it('should provide user-friendly error messages', () => {
      const mockError: OnboardingError = {
        type: 'network',
        message: 'Connection failed',
        retryable: true,
        timestamp: new Date()
      }

      mockErrorHandler.createUserFriendlyMessage.mockReturnValue('Connection issue occurred')

      const { result } = renderHook(() => useProfileValidation())

      act(() => {
        // Simulate setting an error
        result.current.lastError = mockError
      })

      const message = result.current.getUserFriendlyMessage()
      expect(mockErrorHandler.createUserFriendlyMessage).toHaveBeenCalledWith(mockError)
      expect(message).toBe('Connection issue occurred')
    })

    it('should provide recovery actions for errors', () => {
      const mockError: OnboardingError = {
        type: 'network',
        message: 'Connection failed',
        retryable: true,
        timestamp: new Date()
      }

      const mockActions = ['Check internet connection', 'Try again']
      mockErrorHandler.getRecoveryActions.mockReturnValue(mockActions)

      const { result } = renderHook(() => useProfileValidation())

      act(() => {
        // Simulate setting an error
        result.current.lastError = mockError
      })

      const actions = result.current.getRecoveryActions()
      expect(mockErrorHandler.getRecoveryActions).toHaveBeenCalledWith(mockError)
      expect(actions).toEqual(mockActions)
    })
  })

  describe('Retry Logic', () => {
    it('should retry failed operations', async () => {
      let lastOperation: (() => Promise<any>) | null = null
      const mockRetryOperation = jest.fn().mockResolvedValue('success')

      const { result } = renderHook(() => useProfileValidation())

      act(() => {
        // Simulate setting a last operation
        result.current.lastOperation = mockRetryOperation
      })

      await act(async () => {
        await result.current.retryLastOperation()
      })

      expect(mockRetryOperation).toHaveBeenCalled()
      expect(result.current.retryCount).toBe(1)
    })

    it('should not retry when no operation is set', async () => {
      const { result } = renderHook(() => useProfileValidation())

      await act(async () => {
        await result.current.retryLastOperation()
      })

      expect(result.current.retryCount).toBe(0)
    })

    it('should limit retry attempts', () => {
      const { result } = renderHook(() => useProfileValidation())

      act(() => {
        // Simulate multiple retry attempts
        result.current.retryCount = 3
      })

      expect(result.current.canRetry).toBe(false)
    })
  })

  describe('Field-Specific Errors', () => {
    it('should get errors for specific fields', () => {
      const mockValidationResult = {
        isValid: false,
        errors: [
          {
            field: 'email',
            message: 'Email is required',
            code: 'EMAIL_REQUIRED',
            severity: 'error' as const,
            retryable: true
          },
          {
            field: 'school.name',
            message: 'School name is required',
            code: 'SCHOOL_NAME_REQUIRED',
            severity: 'error' as const,
            retryable: true
          }
        ],
        warnings: []
      }

      const { result } = renderHook(() => useProfileValidation())

      act(() => {
        result.current.validationResult = mockValidationResult
      })

      const emailErrors = result.current.getErrorsForField('email')
      const schoolErrors = result.current.getErrorsForField('school')

      expect(emailErrors).toHaveLength(1)
      expect(emailErrors[0].field).toBe('email')
      expect(schoolErrors).toHaveLength(1)
      expect(schoolErrors[0].field).toBe('school.name')
    })
  })

  describe('State Management', () => {
    it('should clear all errors and state', () => {
      const { result } = renderHook(() => useProfileValidation())

      act(() => {
        // Set some error state
        result.current.lastError = {
          type: 'validation',
          message: 'Error',
          retryable: true,
          timestamp: new Date()
        }
        result.current.retryCount = 2
      })

      act(() => {
        result.current.clearErrors()
      })

      expect(result.current.lastError).toBeNull()
      expect(result.current.retryCount).toBe(0)
    })

    it('should reset validation state when profile changes', () => {
      const { result, rerender } = renderHook(() => useProfileValidation())

      act(() => {
        result.current.validationResult = {
          isValid: false,
          errors: [
            {
              field: 'email',
              message: 'Email is required',
              code: 'EMAIL_REQUIRED',
              severity: 'error' as const,
              retryable: true
            }
          ],
          warnings: []
        }
      })

      // Change profile
      mockUseOnboardingStore.mockReturnValue({
        profile: { ...mockProfile, role: 'coach' },
        setValidationErrors: mockSetValidationErrors,
        clearValidationErrors: mockClearValidationErrors,
      } as any)

      rerender()

      expect(result.current.validationResult).toBeNull()
      expect(result.current.lastError).toBeNull()
    })
  })

  describe('Critical Errors', () => {
    it('should identify critical errors correctly', () => {
      const mockValidationResult = {
        isValid: false,
        errors: [
          {
            field: 'age',
            message: 'Too young',
            code: 'AGE_TOO_YOUNG',
            severity: 'error' as const,
            retryable: false // Critical error
          },
          {
            field: 'email',
            message: 'Email required',
            code: 'EMAIL_REQUIRED',
            severity: 'error' as const,
            retryable: true // Non-critical error
          }
        ],
        warnings: []
      }

      const { result } = renderHook(() => useProfileValidation())

      act(() => {
        result.current.validationResult = mockValidationResult
      })

      expect(result.current.hasCriticalErrors).toBe(true)
    })

    it('should not show critical errors when all errors are retryable', () => {
      const mockValidationResult = {
        isValid: false,
        errors: [
          {
            field: 'email',
            message: 'Email required',
            code: 'EMAIL_REQUIRED',
            severity: 'error' as const,
            retryable: true
          }
        ],
        warnings: []
      }

      const { result } = renderHook(() => useProfileValidation())

      act(() => {
        result.current.validationResult = mockValidationResult
      })

      expect(result.current.hasCriticalErrors).toBe(false)
    })
  })
})