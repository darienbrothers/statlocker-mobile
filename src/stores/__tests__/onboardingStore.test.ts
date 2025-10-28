import { renderHook, act } from '@testing-library/react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useOnboardingStore } from '../onboardingStore'
import type { OnboardingProfile } from '@/src/types/onboarding'

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage')
const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>

describe('OnboardingStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useOnboardingStore.getState().resetOnboarding()
    jest.clearAllMocks()
  })

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useOnboardingStore())
      
      expect(result.current.currentStep).toBe(1)
      expect(result.current.totalSteps).toBe(11)
      expect(result.current.isLoading).toBe(false)
      expect(result.current.hasExistingProgress).toBe(false)
      expect(result.current.profile).toEqual({})
      expect(result.current.completedSteps.size).toBe(0)
      expect(result.current.validationErrors).toEqual({})
      expect(result.current.syncStatus).toBe('idle')
    })
  })

  describe('Navigation Actions', () => {
    it('should set step correctly', () => {
      const { result } = renderHook(() => useOnboardingStore())
      
      act(() => {
        result.current.setStep(3)
      })
      
      expect(result.current.currentStep).toBe(3)
    })

    it('should not set invalid step numbers', () => {
      const { result } = renderHook(() => useOnboardingStore())
      
      act(() => {
        result.current.setStep(0) // Invalid
      })
      expect(result.current.currentStep).toBe(1) // Should remain unchanged
      
      act(() => {
        result.current.setStep(15) // Invalid
      })
      expect(result.current.currentStep).toBe(1) // Should remain unchanged
    })

    it('should navigate next when step is valid', () => {
      const { result } = renderHook(() => useOnboardingStore())
      
      // Set up valid profile data for step 1
      act(() => {
        result.current.updateProfile({ role: 'athlete' })
      })
      
      act(() => {
        result.current.navigateNext()
      })
      
      expect(result.current.currentStep).toBe(2)
      expect(result.current.completedSteps.has(1)).toBe(true)
    })

    it('should not navigate next when step is invalid', () => {
      const { result } = renderHook(() => useOnboardingStore())
      
      // Don't set any profile data (step 1 will be invalid)
      act(() => {
        result.current.navigateNext()
      })
      
      expect(result.current.currentStep).toBe(1) // Should remain on step 1
      expect(result.current.completedSteps.has(1)).toBe(false)
    })

    it('should navigate back correctly', () => {
      const { result } = renderHook(() => useOnboardingStore())
      
      act(() => {
        result.current.setStep(3)
        result.current.navigateBack()
      })
      
      expect(result.current.currentStep).toBe(2)
    })

    it('should not navigate back below step 1', () => {
      const { result } = renderHook(() => useOnboardingStore())
      
      act(() => {
        result.current.navigateBack()
      })
      
      expect(result.current.currentStep).toBe(1)
    })
  })

  describe('Data Management', () => {
    it('should update profile data', () => {
      const { result } = renderHook(() => useOnboardingStore())
      
      const profileData: Partial<OnboardingProfile> = {
        role: 'athlete',
        sport: 'lacrosse',
        gender: 'male'
      }
      
      act(() => {
        result.current.updateProfile(profileData)
      })
      
      expect(result.current.profile).toMatchObject(profileData)
      expect(result.current.lastSaved).toBeInstanceOf(Date)
    })

    it('should merge profile data correctly', () => {
      const { result } = renderHook(() => useOnboardingStore())
      
      act(() => {
        result.current.updateProfile({ role: 'athlete' })
        result.current.updateProfile({ sport: 'lacrosse' })
      })
      
      expect(result.current.profile).toMatchObject({
        role: 'athlete',
        sport: 'lacrosse'
      })
    })

    it('should reset profile correctly', () => {
      const { result } = renderHook(() => useOnboardingStore())
      
      // Set some data first
      act(() => {
        result.current.updateProfile({ role: 'athlete' })
        result.current.setStep(3)
      })
      
      act(() => {
        result.current.resetProfile()
      })
      
      expect(result.current.profile).toEqual({})
      expect(result.current.currentStep).toBe(1)
      expect(result.current.completedSteps.size).toBe(0)
      expect(result.current.hasExistingProgress).toBe(false)
    })
  })

  describe('Validation', () => {
    it('should validate step 1 correctly', () => {
      const { result } = renderHook(() => useOnboardingStore())
      
      // Invalid - no role selected
      expect(result.current.validateStep(1)).toBe(false)
      
      // Valid - role selected
      act(() => {
        result.current.updateProfile({ role: 'athlete' })
      })
      expect(result.current.validateStep(1)).toBe(true)
    })

    it('should validate step 2 correctly', () => {
      const { result } = renderHook(() => useOnboardingStore())
      
      // Invalid - missing required fields
      expect(result.current.validateStep(2)).toBe(false)
      
      // Valid - all required fields present
      act(() => {
        result.current.updateProfile({
          sport: 'lacrosse',
          gender: 'male',
          dateOfBirth: new Date('2006-01-01'),
          graduationYear: 2025
        })
      })
      expect(result.current.validateStep(2)).toBe(true)
    })

    it('should validate step 5 goal selection correctly', () => {
      const { result } = renderHook(() => useOnboardingStore())
      
      // Invalid - no goals
      expect(result.current.validateStep(5)).toBe(false)
      
      // Invalid - wrong number of goals
      act(() => {
        result.current.updateProfile({ selectedGoals: ['goal1', 'goal2'] })
      })
      expect(result.current.validateStep(5)).toBe(false)
      
      // Valid - exactly 3 goals
      act(() => {
        result.current.updateProfile({ selectedGoals: ['goal1', 'goal2', 'goal3'] })
      })
      expect(result.current.validateStep(5)).toBe(true)
    })

    it('should set and clear validation errors', () => {
      const { result } = renderHook(() => useOnboardingStore())
      
      const errors = ['Field is required', 'Invalid format']
      
      act(() => {
        result.current.setValidationErrors(1, errors)
      })
      
      expect(result.current.validationErrors[1]).toEqual(errors)
      
      act(() => {
        result.current.clearValidationErrors(1)
      })
      
      expect(result.current.validationErrors[1]).toBeUndefined()
    })
  })

  describe('Progress Persistence', () => {
    it('should save progress to AsyncStorage', async () => {
      const { result } = renderHook(() => useOnboardingStore())
      
      act(() => {
        result.current.updateProfile({ role: 'athlete' })
        result.current.setStep(2)
      })
      
      await act(async () => {
        await result.current.saveProgress()
      })
      
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'onboarding-progress-backup',
        expect.stringContaining('"role":"athlete"')
      )
      expect(result.current.syncStatus).toBe('idle')
    })

    it('should load progress from AsyncStorage', async () => {
      const savedData = {
        profile: { role: 'athlete', sport: 'lacrosse' },
        currentStep: 3,
        completedSteps: [1, 2],
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      }
      
      mockAsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(savedData))
      
      const { result } = renderHook(() => useOnboardingStore())
      
      await act(async () => {
        await result.current.loadProgress()
      })
      
      expect(result.current.profile).toMatchObject(savedData.profile)
      expect(result.current.currentStep).toBe(3)
      expect(result.current.hasExistingProgress).toBe(true)
      expect(result.current.completedSteps.has(1)).toBe(true)
      expect(result.current.completedSteps.has(2)).toBe(true)
    })

    it('should handle missing saved data gracefully', async () => {
      mockAsyncStorage.getItem.mockResolvedValueOnce(null)
      
      const { result } = renderHook(() => useOnboardingStore())
      
      await act(async () => {
        await result.current.loadProgress()
      })
      
      expect(result.current.hasExistingProgress).toBe(false)
      expect(result.current.isLoading).toBe(false)
    })

    it('should handle version mismatch by resetting', async () => {
      const savedData = {
        profile: { role: 'athlete' },
        currentStep: 3,
        completedSteps: [1, 2],
        timestamp: new Date().toISOString(),
        version: '0.9.0' // Old version
      }
      
      mockAsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(savedData))
      
      const { result } = renderHook(() => useOnboardingStore())
      
      await act(async () => {
        await result.current.loadProgress()
      })
      
      expect(result.current.profile).toEqual({})
      expect(result.current.currentStep).toBe(1)
      expect(result.current.hasExistingProgress).toBe(false)
    })
  })

  describe('Navigation Permissions', () => {
    it('should allow navigation to step 1', () => {
      const { result } = renderHook(() => useOnboardingStore())
      
      expect(result.current.canNavigateToStep(1)).toBe(true)
    })

    it('should allow navigation to current step', () => {
      const { result } = renderHook(() => useOnboardingStore())
      
      act(() => {
        result.current.setStep(3)
      })
      
      expect(result.current.canNavigateToStep(3)).toBe(true)
    })

    it('should allow navigation to completed steps', () => {
      const { result } = renderHook(() => useOnboardingStore())
      
      // Complete step 1
      act(() => {
        result.current.updateProfile({ role: 'athlete' })
        result.current.navigateNext()
      })
      
      expect(result.current.canNavigateToStep(1)).toBe(true)
    })

    it('should allow navigation to next step if current is completed', () => {
      const { result } = renderHook(() => useOnboardingStore())
      
      // Complete step 1
      act(() => {
        result.current.updateProfile({ role: 'athlete' })
        result.current.navigateNext()
      })
      
      expect(result.current.canNavigateToStep(2)).toBe(true)
    })

    it('should not allow navigation to future uncompleted steps', () => {
      const { result } = renderHook(() => useOnboardingStore())
      
      expect(result.current.canNavigateToStep(5)).toBe(false)
    })
  })

  describe('Analytics Tracking', () => {
    it('should track events with correct data', () => {
      const { result } = renderHook(() => useOnboardingStore())
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()
      
      const eventData = {
        step: 1,
        duration: 1000,
        attempts: 1,
        validationErrors: []
      }
      
      act(() => {
        result.current.trackEvent('step_completed', eventData)
      })
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'Onboarding Analytics Event:',
        'step_completed',
        eventData
      )
      
      consoleSpy.mockRestore()
    })
  })
})