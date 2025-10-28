import { renderHook, act } from '@testing-library/react-native'
import { Alert } from 'react-native'
import { useOnboardingResume } from '@/hooks/onboarding/useOnboardingResume'
import { OnboardingProgress } from '@/types/onboarding'

// Mock dependencies
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn()
  })
}))

jest.mock('@/hooks/onboarding/useProgressPersistence', () => ({
  useProgressPersistence: () => ({
    loadProgress: jest.fn(),
    clearProgress: jest.fn(),
    validateProgress: jest.fn()
  })
}))

jest.mock('react-native', () => ({
  Alert: {
    alert: jest.fn()
  }
}))

const mockAlert = Alert.alert as jest.MockedFunction<typeof Alert.alert>

describe('useOnboardingResume', () => {
  const mockProgress: OnboardingProgress = {
    profile: {
      role: 'athlete',
      sport: 'lacrosse',
      gender: 'male'
    },
    currentStep: 3,
    completedSteps: [1, 2],
    lastUpdated: new Date(),
    deviceId: 'device_123',
    version: '1.0.0'
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('initialization', () => {
    it('should start in loading state', () => {
      const { result } = renderHook(() => useOnboardingResume())

      expect(result.current.isLoading).toBe(true)
      expect(result.current.hasIncompleteonboarding).toBe(false)
    })

    it('should detect incomplete onboarding', async () => {
      const mockLoadProgress = jest.fn().mockResolvedValue(mockProgress)
      const mockValidateProgress = jest.fn().mockReturnValue(true)

      jest.doMock('@/hooks/onboarding/useProgressPersistence', () => ({
        useProgressPersistence: () => ({
          loadProgress: mockLoadProgress,
          validateProgress: mockValidateProgress,
          clearProgress: jest.fn()
        })
      }))

      const { result } = renderHook(() => useOnboardingResume())

      await act(async () => {
        // Wait for initialization to complete
        await new Promise(resolve => setTimeout(resolve, 100))
      })

      expect(result.current.hasIncompleteonboarding).toBe(true)
      expect(result.current.savedProgress).toEqual(mockProgress)
    })
  })

  describe('resumeOnboarding', () => {
    it('should resume onboarding from saved progress', async () => {
      const mockOnProgressRestored = jest.fn()
      const { result } = renderHook(() =>
        useOnboardingResume({ onProgressRestored: mockOnProgressRestored })
      )

      // Set up state with saved progress
      act(() => {
        result.current.savedProgress = mockProgress
      })

      await act(async () => {
        await result.current.resumeOnboarding()
      })

      expect(mockOnProgressRestored).toHaveBeenCalledWith(mockProgress)
    })

    it('should handle resume errors gracefully', async () => {
      const mockOnProgressRestored = jest.fn().mockRejectedValue(new Error('Resume failed'))
      const { result } = renderHook(() =>
        useOnboardingResume({ onProgressRestored: mockOnProgressRestored })
      )

      act(() => {
        result.current.savedProgress = mockProgress
      })

      await act(async () => {
        await result.current.resumeOnboarding()
      })

      expect(mockAlert).toHaveBeenCalledWith(
        'Resume Failed',
        expect.stringContaining('Unable to resume'),
        expect.any(Array)
      )
    })
  })

  describe('startFreshOnboarding', () => {
    it('should clear progress and start fresh', async () => {
      const mockClearProgress = jest.fn()
      const mockOnResumeDeclined = jest.fn()

      jest.doMock('@/hooks/onboarding/useProgressPersistence', () => ({
        useProgressPersistence: () => ({
          loadProgress: jest.fn(),
          clearProgress: mockClearProgress,
          validateProgress: jest.fn()
        })
      }))

      const { result } = renderHook(() =>
        useOnboardingResume({ onResumeDeclined: mockOnResumeDeclined })
      )

      await act(async () => {
        await result.current.startFreshOnboarding()
      })

      expect(mockClearProgress).toHaveBeenCalled()
      expect(mockOnResumeDeclined).toHaveBeenCalled()
    })
  })

  describe('showResumePrompt', () => {
    it('should show resume prompt with correct completion percentage', () => {
      const { result } = renderHook(() => useOnboardingResume())

      act(() => {
        result.current.savedProgress = mockProgress
        result.current.completionPercentage = 33
      })

      result.current.showResumePrompt()

      expect(mockAlert).toHaveBeenCalledWith(
        'Resume Setup',
        expect.stringContaining('33% complete'),
        expect.arrayContaining([
          expect.objectContaining({ text: 'Start Over' }),
          expect.objectContaining({ text: 'Resume' })
        ]),
        { cancelable: false }
      )
    })

    it('should not show prompt when no saved progress exists', () => {
      const { result } = renderHook(() => useOnboardingResume())

      result.current.showResumePrompt()

      expect(mockAlert).not.toHaveBeenCalled()
    })
  })

  describe('getResumeCardData', () => {
    it('should return correct resume card data', () => {
      const { result } = renderHook(() => useOnboardingResume())

      act(() => {
        result.current.savedProgress = mockProgress
        result.current.completionPercentage = 33
        result.current.nextStep = 4
      })

      const cardData = result.current.getResumeCardData()

      expect(cardData).toEqual({
        completionPercentage: 33,
        nextStep: 4,
        lastUpdated: mockProgress.lastUpdated,
        daysSinceUpdate: expect.any(Number),
        stepTitle: expect.any(String),
        canResume: true
      })
    })

    it('should return null when no saved progress', () => {
      const { result } = renderHook(() => useOnboardingResume())

      const cardData = result.current.getResumeCardData()

      expect(cardData).toBeNull()
    })
  })

  describe('getStepTitle', () => {
    it('should return correct step titles', () => {
      const { result } = renderHook(() => useOnboardingResume())

      expect(result.current.getStepTitle(1)).toBe('Choose Your Role')
      expect(result.current.getStepTitle(2)).toBe('Sport & Demographics')
      expect(result.current.getStepTitle(5)).toBe('Select Goals')
      expect(result.current.getStepTitle(99)).toBe('Continue Setup')
    })
  })

  describe('auto-resume functionality', () => {
    it('should auto-resume when autoResume is true', async () => {
      const mockOnProgressRestored = jest.fn()
      const mockLoadProgress = jest.fn().mockResolvedValue(mockProgress)
      const mockValidateProgress = jest.fn().mockReturnValue(true)

      jest.doMock('@/hooks/onboarding/useProgressPersistence', () => ({
        useProgressPersistence: () => ({
          loadProgress: mockLoadProgress,
          validateProgress: mockValidateProgress,
          clearProgress: jest.fn()
        })
      }))

      renderHook(() =>
        useOnboardingResume({
          onProgressRestored: mockOnProgressRestored,
          autoResume: true
        })
      )

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100))
      })

      expect(mockOnProgressRestored).toHaveBeenCalledWith(mockProgress)
    })

    it('should not auto-resume when autoResume is false', async () => {
      const mockOnProgressRestored = jest.fn()
      const mockLoadProgress = jest.fn().mockResolvedValue(mockProgress)
      const mockValidateProgress = jest.fn().mockReturnValue(true)

      jest.doMock('@/hooks/onboarding/useProgressPersistence', () => ({
        useProgressPersistence: () => ({
          loadProgress: mockLoadProgress,
          validateProgress: mockValidateProgress,
          clearProgress: jest.fn()
        })
      }))

      const { result } = renderHook(() =>
        useOnboardingResume({
          onProgressRestored: mockOnProgressRestored,
          autoResume: false
        })
      )

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100))
      })

      expect(result.current.showResumePrompt).toBe(true)
      expect(mockOnProgressRestored).not.toHaveBeenCalled()
    })
  })
})