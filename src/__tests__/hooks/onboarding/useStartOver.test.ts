import { renderHook, act } from '@testing-library/react-native'
import { Alert } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useStartOver } from '@/hooks/onboarding/useStartOver'
import { OnboardingProfile } from '@/types/onboarding'

// Mock dependencies
jest.mock('@react-native-async-storage/async-storage')
jest.mock('react-native', () => ({
  Alert: {
    alert: jest.fn()
  }
}))
jest.mock('expo-router', () => ({
  useRouter: () => ({
    replace: jest.fn()
  })
}))
jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { uid: 'test-user-id' } })
}))
jest.mock('@/lib/firebase', () => ({
  db: {}
}))
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  setDoc: jest.fn(),
  serverTimestamp: jest.fn(() => new Date())
}))

const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>
const mockAlert = Alert.alert as jest.MockedFunction<typeof Alert.alert>

describe('useStartOver', () => {
  const mockProfile: OnboardingProfile = {
    role: 'athlete',
    sport: 'lacrosse',
    gender: 'male',
    position: 'midfielder'
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('exportProgressData', () => {
    it('should export progress data as JSON string', async () => {
      const mockOnExportComplete = jest.fn()
      const { result } = renderHook(() =>
        useStartOver({
          currentProfile: mockProfile,
          currentStep: 3,
          onExportComplete: mockOnExportComplete
        })
      )

      const exportString = await act(async () => {
        return await result.current.exportProgressData()
      })

      expect(exportString).toContain('"role":"athlete"')
      expect(exportString).toContain('"currentStep":3')
      expect(mockOnExportComplete).toHaveBeenCalledWith(exportString)
    })

    it('should handle export errors', async () => {
      const mockOnExportComplete = jest.fn().mockImplementation(() => {
        throw new Error('Export failed')
      })

      const { result } = renderHook(() =>
        useStartOver({
          currentProfile: mockProfile,
          onExportComplete: mockOnExportComplete
        })
      )

      await expect(
        act(async () => {
          await result.current.exportProgressData()
        })
      ).rejects.toThrow('Export failed')
    })
  })

  describe('clearAllData', () => {
    it('should clear local storage and Firestore', async () => {
      const { result } = renderHook(() => useStartOver())

      await act(async () => {
        await result.current.clearAllData()
      })

      expect(mockAsyncStorage.multiRemove).toHaveBeenCalledWith([
        'onboarding_progress',
        'device_id'
      ])
    })

    it('should handle clear errors gracefully', async () => {
      mockAsyncStorage.multiRemove.mockRejectedValueOnce(new Error('Storage error'))

      const { result } = renderHook(() => useStartOver())

      await expect(
        act(async () => {
          await result.current.clearAllData()
        })
      ).rejects.toThrow('Storage error')
    })
  })

  describe('startOver', () => {
    it('should show confirmation dialog by default', async () => {
      const { result } = renderHook(() =>
        useStartOver({
          currentProfile: mockProfile,
          currentStep: 3
        })
      )

      await act(async () => {
        await result.current.startOver()
      })

      expect(mockAlert).toHaveBeenCalledWith(
        'Start Over',
        expect.stringContaining('permanently delete'),
        expect.arrayContaining([
          expect.objectContaining({ text: 'Cancel' }),
          expect.objectContaining({ text: 'Export First' }),
          expect.objectContaining({ text: 'Delete All' })
        ])
      )
    })

    it('should skip confirmation when requested', async () => {
      const mockOnStartOver = jest.fn()
      const { result } = renderHook(() =>
        useStartOver({
          currentProfile: mockProfile,
          currentStep: 3,
          onStartOver: mockOnStartOver
        })
      )

      await act(async () => {
        await result.current.startOver(true) // Skip confirmation
      })

      expect(mockAlert).not.toHaveBeenCalled()
      expect(mockOnStartOver).toHaveBeenCalled()
    })

    it('should handle start over errors', async () => {
      mockAsyncStorage.multiRemove.mockRejectedValueOnce(new Error('Storage error'))

      const { result } = renderHook(() =>
        useStartOver({
          currentProfile: mockProfile,
          currentStep: 3
        })
      )

      await act(async () => {
        await result.current.startOver(true)
      })

      expect(mockAlert).toHaveBeenCalledWith(
        'Reset Failed',
        expect.stringContaining('Unable to reset'),
        expect.any(Array)
      )
    })
  })

  describe('resetSection', () => {
    it('should show confirmation for section reset', async () => {
      const { result } = renderHook(() => useStartOver())

      await act(async () => {
        await result.current.resetSection('profile')
      })

      expect(mockAlert).toHaveBeenCalledWith(
        'Reset Section',
        expect.stringContaining('profile data'),
        expect.arrayContaining([
          expect.objectContaining({ text: 'Cancel' }),
          expect.objectContaining({ text: 'Reset', style: 'destructive' })
        ])
      )
    })

    it('should handle different section types', async () => {
      const { result } = renderHook(() => useStartOver())

      await act(async () => {
        await result.current.resetSection('goals')
      })

      expect(mockAlert).toHaveBeenCalledWith(
        'Reset Section',
        expect.stringContaining('goals data'),
        expect.any(Array)
      )
    })
  })

  describe('canReset', () => {
    it('should return true when there is progress to reset', () => {
      const { result } = renderHook(() =>
        useStartOver({
          currentProfile: mockProfile,
          currentStep: 3
        })
      )

      expect(result.current.canReset()).toBe(true)
    })

    it('should return true when there is profile data but no step progress', () => {
      const { result } = renderHook(() =>
        useStartOver({
          currentProfile: mockProfile,
          currentStep: 0
        })
      )

      expect(result.current.canReset()).toBe(true)
    })

    it('should return false when there is no progress', () => {
      const { result } = renderHook(() =>
        useStartOver({
          currentProfile: {},
          currentStep: 0
        })
      )

      expect(result.current.canReset()).toBe(false)
    })
  })

  describe('getResetMessage', () => {
    it('should return appropriate message for current step', () => {
      const { result } = renderHook(() =>
        useStartOver({
          currentProfile: mockProfile,
          currentStep: 3
        })
      )

      const message = result.current.getResetMessage()

      expect(message).toContain('step 3')
      expect(message).toContain('permanently deleted')
    })

    it('should return no progress message for step 0', () => {
      const { result } = renderHook(() =>
        useStartOver({
          currentProfile: {},
          currentStep: 0
        })
      )

      const message = result.current.getResetMessage()

      expect(message).toBe('No progress to reset.')
    })
  })

  describe('quickReset', () => {
    it('should perform quick reset in development mode', async () => {
      // Mock __DEV__ to be true
      ;(global as any).__DEV__ = true

      const mockOnStartOver = jest.fn()
      const { result } = renderHook(() =>
        useStartOver({
          currentProfile: mockProfile,
          currentStep: 3,
          onStartOver: mockOnStartOver
        })
      )

      await act(async () => {
        await result.current.quickReset()
      })

      expect(mockOnStartOver).toHaveBeenCalled()
      expect(mockAlert).not.toHaveBeenCalled() // Should skip confirmation
    })

    it('should warn in production mode', async () => {
      // Mock __DEV__ to be false
      ;(global as any).__DEV__ = false

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()
      const { result } = renderHook(() => useStartOver())

      await act(async () => {
        await result.current.quickReset()
      })

      expect(consoleSpy).toHaveBeenCalledWith(
        'Quick reset is only available in development mode'
      )

      consoleSpy.mockRestore()
    })
  })

  describe('loading states', () => {
    it('should track resetting state', async () => {
      const { result } = renderHook(() =>
        useStartOver({
          currentProfile: mockProfile,
          currentStep: 3
        })
      )

      expect(result.current.isResetting).toBe(false)

      const resetPromise = act(async () => {
        return result.current.startOver(true)
      })

      expect(result.current.isResetting).toBe(true)

      await resetPromise

      expect(result.current.isResetting).toBe(false)
    })

    it('should track exporting state', async () => {
      const { result } = renderHook(() =>
        useStartOver({
          currentProfile: mockProfile,
          currentStep: 3
        })
      )

      expect(result.current.isExporting).toBe(false)

      const exportPromise = act(async () => {
        return result.current.exportProgressData()
      })

      expect(result.current.isExporting).toBe(true)

      await exportPromise

      expect(result.current.isExporting).toBe(false)
    })
  })
})