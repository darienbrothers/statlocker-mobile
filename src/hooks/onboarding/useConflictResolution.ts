import { useState, useCallback } from 'react'
import { Alert } from 'react-native'
import { OnboardingProgress, ConflictResolution } from '@/types/onboarding'
import { validateProgressIntegrity } from '@/lib/onboarding/progressValidation'

interface UseConflictResolutionProps {
  onConflictResolved?: (resolvedProgress: OnboardingProgress) => void
  onConflictCanceled?: () => void
}

interface ConflictAnalysis {
  hasConflict: boolean
  conflictFields: string[]
  localNewer: boolean
  remoteNewer: boolean
  significantDifference: boolean
  recommendedResolution: 'local' | 'remote' | 'merge' | 'user_choice'
}

export const useConflictResolution = ({
  onConflictResolved,
  onConflictCanceled
}: UseConflictResolutionProps = {}) => {
  const [conflictState, setConflictState] = useState<ConflictResolution | null>(null)
  const [isResolving, setIsResolving] = useState(false)

  // Analyze conflicts between local and remote progress
  const analyzeConflict = useCallback((
    localProgress: OnboardingProgress,
    remoteProgress: OnboardingProgress
  ): ConflictAnalysis => {
    const conflictFields: string[] = []
    
    // Compare timestamps
    const localTime = localProgress.lastUpdated.getTime()
    const remoteTime = remoteProgress.lastUpdated.getTime()
    const timeDiffMs = Math.abs(localTime - remoteTime)
    const timeDiffMinutes = timeDiffMs / (1000 * 60)
    
    const localNewer = localTime > remoteTime
    const remoteNewer = remoteTime > localTime
    const significantTimeDiff = timeDiffMinutes > 5 // 5 minutes threshold

    // Compare current steps
    if (localProgress.currentStep !== remoteProgress.currentStep) {
      conflictFields.push('currentStep')
    }

    // Compare completed steps
    const localSteps = new Set(localProgress.completedSteps)
    const remoteSteps = new Set(remoteProgress.completedSteps)
    const stepsDiffer = localSteps.size !== remoteSteps.size || 
      ![...localSteps].every(step => remoteSteps.has(step))
    
    if (stepsDiffer) {
      conflictFields.push('completedSteps')
    }

    // Compare profile fields
    const profileConflicts = compareProfileFields(localProgress.profile, remoteProgress.profile)
    conflictFields.push(...profileConflicts)

    // Compare device IDs
    if (localProgress.deviceId !== remoteProgress.deviceId) {
      conflictFields.push('deviceId')
    }

    const hasConflict = conflictFields.length > 0 && significantTimeDiff
    const significantDifference = conflictFields.length > 2 || 
      conflictFields.includes('currentStep') ||
      Math.abs(localProgress.currentStep - remoteProgress.currentStep) > 1

    // Determine recommended resolution
    let recommendedResolution: 'local' | 'remote' | 'merge' | 'user_choice' = 'user_choice'
    
    if (!hasConflict) {
      recommendedResolution = localNewer ? 'local' : 'remote'
    } else if (!significantDifference && timeDiffMinutes < 30) {
      recommendedResolution = 'merge'
    } else if (localNewer && localProgress.currentStep >= remoteProgress.currentStep) {
      recommendedResolution = 'local'
    } else if (remoteNewer && remoteProgress.currentStep >= localProgress.currentStep) {
      recommendedResolution = 'remote'
    }

    return {
      hasConflict,
      conflictFields,
      localNewer,
      remoteNewer,
      significantDifference,
      recommendedResolution
    }
  }, [])

  // Compare profile fields for conflicts
  const compareProfileFields = useCallback((
    localProfile: any,
    remoteProfile: any,
    prefix = ''
  ): string[] => {
    const conflicts: string[] = []
    
    const allKeys = new Set([
      ...Object.keys(localProfile || {}),
      ...Object.keys(remoteProfile || {})
    ])

    for (const key of allKeys) {
      const fieldPath = prefix ? `${prefix}.${key}` : key
      const localValue = localProfile?.[key]
      const remoteValue = remoteProfile?.[key]

      if (localValue !== remoteValue) {
        if (typeof localValue === 'object' && typeof remoteValue === 'object' && 
            localValue !== null && remoteValue !== null) {
          // Recursively compare nested objects
          const nestedConflicts = compareProfileFields(localValue, remoteValue, fieldPath)
          conflicts.push(...nestedConflicts)
        } else {
          conflicts.push(fieldPath)
        }
      }
    }

    return conflicts
  }, [])

  // Detect and handle conflicts
  const detectConflict = useCallback(async (
    localProgress: OnboardingProgress,
    remoteProgress: OnboardingProgress
  ): Promise<OnboardingProgress | null> => {
    try {
      // Validate both progress objects
      const localValid = validateProgressIntegrity(localProgress)
      const remoteValid = validateProgressIntegrity(remoteProgress)

      if (!localValid.isValid && !remoteValid.isValid) {
        throw new Error('Both local and remote progress are invalid')
      }

      if (!localValid.isValid) {
        return remoteProgress
      }

      if (!remoteValid.isValid) {
        return localProgress
      }

      const analysis = analyzeConflict(localProgress, remoteProgress)

      if (!analysis.hasConflict) {
        // No conflict, return the newer one
        return analysis.localNewer ? localProgress : remoteProgress
      }

      // Handle automatic resolution for simple cases
      if (analysis.recommendedResolution !== 'user_choice') {
        return await resolveConflictAutomatically(
          localProgress,
          remoteProgress,
          analysis.recommendedResolution
        )
      }

      // Show conflict resolution UI for complex cases
      setConflictState({
        localProgress,
        remoteProgress,
        conflictFields: analysis.conflictFields,
        showDialog: true
      })

      return null // Will be resolved through UI
    } catch (error) {
      console.error('Error detecting conflict:', error)
      throw error
    }
  }, [analyzeConflict])

  // Resolve conflict automatically
  const resolveConflictAutomatically = useCallback(async (
    localProgress: OnboardingProgress,
    remoteProgress: OnboardingProgress,
    resolution: 'local' | 'remote' | 'merge'
  ): Promise<OnboardingProgress> => {
    switch (resolution) {
      case 'local':
        return localProgress

      case 'remote':
        return remoteProgress

      case 'merge':
        return mergeProgress(localProgress, remoteProgress)

      default:
        throw new Error(`Invalid resolution type: ${resolution}`)
    }
  }, [])

  // Merge two progress objects intelligently
  const mergeProgress = useCallback((
    localProgress: OnboardingProgress,
    remoteProgress: OnboardingProgress
  ): OnboardingProgress => {
    // Use the progress with higher step number as base
    const baseProgress = localProgress.currentStep >= remoteProgress.currentStep 
      ? localProgress 
      : remoteProgress
    const otherProgress = baseProgress === localProgress ? remoteProgress : localProgress

    // Merge completed steps (union)
    const mergedCompletedSteps = Array.from(new Set([
      ...baseProgress.completedSteps,
      ...otherProgress.completedSteps
    ])).sort((a, b) => a - b)

    // Merge profile data (prefer non-empty values)
    const mergedProfile = mergeProfileData(baseProgress.profile, otherProgress.profile)

    return {
      ...baseProgress,
      profile: mergedProfile,
      completedSteps: mergedCompletedSteps,
      lastUpdated: new Date(), // Update timestamp
      deviceId: baseProgress.deviceId // Keep base device ID
    }
  }, [])

  // Merge profile data objects
  const mergeProfileData = useCallback((baseProfile: any, otherProfile: any): any => {
    const merged = { ...baseProfile }

    for (const [key, value] of Object.entries(otherProfile || {})) {
      if (value !== undefined && value !== null && value !== '') {
        if (merged[key] === undefined || merged[key] === null || merged[key] === '') {
          merged[key] = value
        } else if (typeof value === 'object' && typeof merged[key] === 'object') {
          merged[key] = mergeProfileData(merged[key], value)
        }
        // For non-empty conflicts, keep the base value
      }
    }

    return merged
  }, [])

  // Resolve conflict through user choice
  const resolveConflict = useCallback(async (
    resolution: 'local' | 'remote' | 'merge'
  ) => {
    if (!conflictState) {
      throw new Error('No conflict to resolve')
    }

    setIsResolving(true)

    try {
      const resolvedProgress = await resolveConflictAutomatically(
        conflictState.localProgress,
        conflictState.remoteProgress,
        resolution
      )

      setConflictState(null)

      if (onConflictResolved) {
        onConflictResolved(resolvedProgress)
      }

      return resolvedProgress
    } catch (error) {
      console.error('Error resolving conflict:', error)
      throw error
    } finally {
      setIsResolving(false)
    }
  }, [conflictState, resolveConflictAutomatically, onConflictResolved])

  // Cancel conflict resolution
  const cancelConflictResolution = useCallback(() => {
    setConflictState(null)
    if (onConflictCanceled) {
      onConflictCanceled()
    }
  }, [onConflictCanceled])

  // Show conflict resolution dialog
  const showConflictDialog = useCallback(() => {
    if (!conflictState) return

    const { localProgress, remoteProgress, conflictFields } = conflictState

    const localTime = localProgress.lastUpdated.toLocaleString()
    const remoteTime = remoteProgress.lastUpdated.toLocaleString()
    const localDevice = localProgress.deviceId.split('_')[1] || 'Unknown'
    const remoteDevice = remoteProgress.deviceId.split('_')[1] || 'Unknown'

    Alert.alert(
      'Sync Conflict Detected',
      `Your onboarding progress differs between devices.\n\nLocal (${localDevice}): Updated ${localTime}\nRemote (${remoteDevice}): Updated ${remoteTime}\n\nConflicting fields: ${conflictFields.join(', ')}`,
      [
        {
          text: 'Use Local',
          onPress: () => resolveConflict('local')
        },
        {
          text: 'Use Remote',
          onPress: () => resolveConflict('remote')
        },
        {
          text: 'Merge Both',
          onPress: () => resolveConflict('merge')
        },
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: cancelConflictResolution
        }
      ]
    )
  }, [conflictState, resolveConflict, cancelConflictResolution])

  return {
    // State
    conflictState,
    isResolving,
    
    // Actions
    detectConflict,
    resolveConflict,
    cancelConflictResolution,
    showConflictDialog,
    
    // Utilities
    analyzeConflict,
    mergeProgress
  }
}