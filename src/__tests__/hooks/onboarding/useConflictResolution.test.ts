import { renderHook, act } from '@testing-library/react-native'
import { useConflictResolution } from '@/hooks/onboarding/useConflictResolution'
import { OnboardingProgress } from '@/types/onboarding'

describe('useConflictResolution', () => {
  const baseProgress: OnboardingProgress = {
    profile: {
      role: 'athlete',
      sport: 'lacrosse',
      gender: 'male'
    },
    currentStep: 3,
    completedSteps: [1, 2],
    lastUpdated: new Date('2024-01-01T10:00:00Z'),
    deviceId: 'device_123',
    version: '1.0.0'
  }

  const conflictingProgress: OnboardingProgress = {
    ...baseProgress,
    currentStep: 4,
    completedSteps: [1, 2, 3],
    lastUpdated: new Date('2024-01-01T11:00:00Z'),
    deviceId: 'device_456',
    profile: {
      ...baseProgress.profile,
      position: 'midfielder'
    }
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('analyzeConflict', () => {
    it('should detect conflicts between progress objects', () => {
      const { result } = renderHook(() => useConflictResolution())

      const analysis = result.current.analyzeConflict(baseProgress, conflictingProgress)

      expect(analysis.hasConflict).toBe(true)
      expect(analysis.conflictFields).toContain('currentStep')
      expect(analysis.conflictFields).toContain('completedSteps')
      expect(analysis.conflictFields).toContain('deviceId')
      expect(analysis.remoteNewer).toBe(true)
      expect(analysis.localNewer).toBe(false)
    })

    it('should not detect conflicts for identical progress', () => {
      const { result } = renderHook(() => useConflictResolution())

      const analysis = result.current.analyzeConflict(baseProgress, baseProgress)

      expect(analysis.hasConflict).toBe(false)
      expect(analysis.conflictFields).toHaveLength(0)
    })

    it('should recommend automatic resolution for simple cases', () => {
      const { result } = renderHook(() => useConflictResolution()

      const slightlyNewer = {
        ...baseProgress,
        lastUpdated: new Date('2024-01-01T10:01:00Z') // 1 minute newer
      }

      const analysis = result.current.analyzeConflict(baseProgress, slightlyNewer)

      expect(analysis.recommendedResolution).toBe('remote')
    })

    it('should recommend user choice for significant conflicts', () => {
      const { result } = renderHook(() => useConflictResolution())

      const analysis = result.current.analyzeConflict(baseProgress, conflictingProgress)

      expect(analysis.significantDifference).toBe(true)
      expect(analysis.recommendedResolution).toBe('user_choice')
    })
  })

  describe('detectConflict', () => {
    it('should return newer progress when no conflict exists', async () => {
      const { result } = renderHook(() => useConflictResolution())

      const newerProgress = {
        ...baseProgress,
        lastUpdated: new Date('2024-01-01T10:01:00Z')
      }

      const resolved = await act(async () => {
        return await result.current.detectConflict(baseProgress, newerProgress)
      })

      expect(resolved).toEqual(newerProgress)
    })

    it('should trigger conflict resolution UI for complex conflicts', async () => {
      const { result } = renderHook(() => useConflictResolution())

      const resolved = await act(async () => {
        return await result.current.detectConflict(baseProgress, conflictingProgress)
      })

      expect(resolved).toBeNull() // Should trigger UI
      expect(result.current.conflictState).toBeTruthy()
      expect(result.current.conflictState?.showDialog).toBe(true)
    })

    it('should handle invalid progress gracefully', async () => {
      const { result } = renderHook(() => useConflictResolution())

      const invalidProgress = {
        ...baseProgress,
        currentStep: -1 // Invalid
      }

      const resolved = await act(async () => {
        return await result.current.detectConflict(invalidProgress, baseProgress)
      })

      expect(resolved).toEqual(baseProgress) // Should return valid progress
    })
  })

  describe('mergeProgress', () => {
    it('should merge progress objects intelligently', () => {
      const { result } = renderHook(() => useConflictResolution())

      const merged = result.current.mergeProgress(baseProgress, conflictingProgress)

      expect(merged.currentStep).toBe(4) // Higher step number
      expect(merged.completedSteps).toEqual([1, 2, 3]) // Union of completed steps
      expect(merged.profile.position).toBe('midfielder') // Non-empty value from other
      expect(merged.profile.role).toBe('athlete') // Preserved from base
    })

    it('should preserve non-empty values during merge', () => {
      const { result } = renderHook(() => useConflictResolution())

      const progressWithEmptyFields = {
        ...baseProgress,
        profile: {
          ...baseProgress.profile,
          position: undefined
        }
      }

      const progressWithValues = {
        ...conflictingProgress,
        profile: {
          ...conflictingProgress.profile,
          position: 'midfielder',
          graduationYear: 2025
        }
      }

      const merged = result.current.mergeProgress(progressWithEmptyFields, progressWithValues)

      expect(merged.profile.position).toBe('midfielder')
      expect(merged.profile.graduationYear).toBe(2025)
      expect(merged.profile.role).toBe('athlete') // Preserved from base
    })
  })

  describe('resolveConflict', () => {
    it('should resolve conflict with local choice', async () => {
      const mockOnConflictResolved = jest.fn()
      const { result } = renderHook(() =>
        useConflictResolution({ onConflictResolved: mockOnConflictResolved })
      )

      // Set up conflict state
      act(() => {
        result.current.conflictState = {
          localProgress: baseProgress,
          remoteProgress: conflictingProgress,
          conflictFields: ['currentStep'],
          showDialog: true
        }
      })

      await act(async () => {
        await result.current.resolveConflict('local')
      })

      expect(mockOnConflictResolved).toHaveBeenCalledWith(baseProgress)
      expect(result.current.conflictState).toBeNull()
    })

    it('should resolve conflict with remote choice', async () => {
      const mockOnConflictResolved = jest.fn()
      const { result } = renderHook(() =>
        useConflictResolution({ onConflictResolved: mockOnConflictResolved })
      )

      act(() => {
        result.current.conflictState = {
          localProgress: baseProgress,
          remoteProgress: conflictingProgress,
          conflictFields: ['currentStep'],
          showDialog: true
        }
      })

      await act(async () => {
        await result.current.resolveConflict('remote')
      })

      expect(mockOnConflictResolved).toHaveBeenCalledWith(conflictingProgress)
    })

    it('should resolve conflict with merge choice', async () => {
      const mockOnConflictResolved = jest.fn()
      const { result } = renderHook(() =>
        useConflictResolution({ onConflictResolved: mockOnConflictResolved })
      )

      act(() => {
        result.current.conflictState = {
          localProgress: baseProgress,
          remoteProgress: conflictingProgress,
          conflictFields: ['currentStep'],
          showDialog: true
        }
      })

      await act(async () => {
        await result.current.resolveConflict('merge')
      })

      expect(mockOnConflictResolved).toHaveBeenCalledWith(
        expect.objectContaining({
          currentStep: 4, // Should use higher step
          completedSteps: [1, 2, 3] // Should merge completed steps
        })
      )
    })

    it('should handle resolution errors', async () => {
      const { result } = renderHook(() => useConflictResolution())

      await expect(
        act(async () => {
          await result.current.resolveConflict('local')
        })
      ).rejects.toThrow('No conflict to resolve')
    })
  })

  describe('profile field comparison', () => {
    it('should detect nested profile conflicts', () => {
      const { result } = renderHook(() => useConflictResolution())

      const progressWithNestedData = {
        ...baseProgress,
        profile: {
          ...baseProgress.profile,
          school: {
            name: 'School A',
            city: 'City A'
          }
        }
      }

      const conflictingNestedData = {
        ...baseProgress,
        profile: {
          ...baseProgress.profile,
          school: {
            name: 'School B',
            city: 'City A'
          }
        }
      }

      const analysis = result.current.analyzeConflict(progressWithNestedData, conflictingNestedData)

      expect(analysis.conflictFields).toContain('school.name')
      expect(analysis.conflictFields).not.toContain('school.city')
    })
  })
})