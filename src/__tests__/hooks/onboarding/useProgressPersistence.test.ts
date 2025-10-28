import { renderHook, act } from '@testing-library/react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useProgressPersistence } from '@/hooks/onboarding/useProgressPersistence'
import { OnboardingProfile, OnboardingProgress } from '@/types/onboarding'

// Mock dependencies
jest.mock('@react-native-async-storage/async-storage')
jest.mock('@/lib/firebase', () => ({
  db: {}
}))
jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { uid: 'test-user-id' } })
}))
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  setDoc: jest.fn(),
  getDoc: jest.fn(),
  serverTimestamp: jest.fn(() => new Date())
}))

const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>

describe('useProgressPersistence', () => {
  const mockProfile: OnboardingProfile = {
    role: 'athlete',
    sport: 'lacrosse',
    gender: 'male',
    position: 'midfielder'
  }

  const mockProgress: OnboardingProgress = {
    profile: mockProfile,
    currentStep: 3,
    completedSteps: [1, 2],
    lastUpdated: new Date(),
    deviceId: 'device_123',
    version: '1.0.0'
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('saveProgress', () => {
    it('should save progress to local storage', async () => {
      const { result } = renderHook(() =>
        useProgressPersistence({
          profile: mockProfile,
          currentStep: 3,
          completedSteps: new Set([1, 2])
        })
      )

      await act(async () => {
        await result.current.saveProgress()
      })

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'onboarding_progress',
        expect.stringContaining('"currentStep":3')
      )
    })

    it('should handle save errors gracefully', async () => {
      mockAsyncStorage.setItem.mockRejectedValueOnce(new Error('Storage error'))

      const { result } = renderHook(() =>
        useProgressPersistence({
          profile: mockProfile,
          currentStep: 3,
          completedSteps: new Set([1, 2])
        })
      )

      await expect(result.current.saveProgress()).rejects.toThrow('Storage error')
    })
  })

  describe('loadProgress', () => {
    it('should load progress from local storage', async () => {
      const storedProgress = JSON.stringify(mockProgress)
      mockAsyncStorage.getItem.mockResolvedValueOnce(storedProgress)

      const { result } = renderHook(() =>
        useProgressPersistence({
          profile: {},
          currentStep: 0,
          completedSteps: new Set()
        })
      )

      const progress = await act(async () => {
        return await result.current.loadProgress()
      })

      expect(progress).toBeTruthy()
      expect(progress?.currentStep).toBe(3)
      expect(progress?.profile.role).toBe('athlete')
    })

    it('should return null when no progress is stored', async () => {
      mockAsyncStorage.getItem.mockResolvedValueOnce(null)

      const { result } = renderHook(() =>
        useProgressPersistence({
          profile: {},
          currentStep: 0,
          completedSteps: new Set()
        })
      )

      const progress = await act(async () => {
        return await result.current.loadProgress()
      })

      expect(progress).toBeNull()
    })

    it('should handle corrupted storage data', async () => {
      mockAsyncStorage.getItem.mockResolvedValueOnce('invalid json')

      const { result } = renderHook(() =>
        useProgressPersistence({
          profile: {},
          currentStep: 0,
          completedSteps: new Set()
        })
      )

      const progress = await act(async () => {
        return await result.current.loadProgress()
      })

      expect(progress).toBeNull()
    })
  })

  describe('clearProgress', () => {
    it('should clear local storage', async () => {
      const { result } = renderHook(() =>
        useProgressPersistence({
          profile: mockProfile,
          currentStep: 3,
          completedSteps: new Set([1, 2])
        })
      )

      await act(async () => {
        await result.current.clearProgress()
      })

      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('onboarding_progress')
    })
  })

  describe('validateProgress', () => {
    it('should validate correct progress data', () => {
      const { result } = renderHook(() =>
        useProgressPersistence({
          profile: mockProfile,
          currentStep: 3,
          completedSteps: new Set([1, 2])
        })
      )

      const isValid = result.current.validateProgress(mockProgress)
      expect(isValid).toBe(true)
    })

    it('should reject invalid progress data', () => {
      const invalidProgress = {
        ...mockProgress,
        currentStep: -1 // Invalid step
      }

      const { result } = renderHook(() =>
        useProgressPersistence({
          profile: mockProfile,
          currentStep: 3,
          completedSteps: new Set([1, 2])
        })
      )

      const isValid = result.current.validateProgress(invalidProgress)
      expect(isValid).toBe(false)
    })

    it('should reject progress with missing required fields', () => {
      const invalidProgress = {
        ...mockProgress,
        profile: null // Missing profile
      } as any

      const { result } = renderHook(() =>
        useProgressPersistence({
          profile: mockProfile,
          currentStep: 3,
          completedSteps: new Set([1, 2])
        })
      )

      const isValid = result.current.validateProgress(invalidProgress)
      expect(isValid).toBe(false)
    })
  })

  describe('auto-save functionality', () => {
    it('should auto-save when profile changes', async () => {
      jest.useFakeTimers()

      const { result, rerender } = renderHook(
        ({ profile }) =>
          useProgressPersistence({
            profile,
            currentStep: 3,
            completedSteps: new Set([1, 2])
          }),
        {
          initialProps: { profile: mockProfile }
        }
      )

      // Change profile
      const updatedProfile = { ...mockProfile, sport: 'basketball' }
      rerender({ profile: updatedProfile })

      // Fast-forward timers to trigger auto-save
      act(() => {
        jest.advanceTimersByTime(1100) // SYNC_DEBOUNCE_MS + buffer
      })

      expect(mockAsyncStorage.setItem).toHaveBeenCalled()

      jest.useRealTimers()
    })
  })

  describe('offline queue integration', () => {
    it('should add failed saves to offline queue', async () => {
      // Mock Firestore failure
      const { setDoc } = require('firebase/firestore')
      setDoc.mockRejectedValueOnce(new Error('Network error'))

      const { result } = renderHook(() =>
        useProgressPersistence({
          profile: mockProfile,
          currentStep: 3,
          completedSteps: new Set([1, 2])
        })
      )

      await act(async () => {
        try {
          await result.current.saveProgress()
        } catch (error) {
          // Expected to fail and add to queue
        }
      })

      // Verify local storage still works
      expect(mockAsyncStorage.setItem).toHaveBeenCalled()
    })
  })
})