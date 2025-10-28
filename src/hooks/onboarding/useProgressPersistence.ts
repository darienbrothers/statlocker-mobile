import { useEffect, useCallback } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/hooks/useAuth'
import { OnboardingProfile, OnboardingProgress } from '@/types/onboarding'
import { addProgressToOfflineQueue, getOfflineQueueStatus } from '@/lib/onboarding/offlineQueue'
import { validateProgressIntegrity } from '@/lib/onboarding/progressValidation'
import { useConflictResolution } from './useConflictResolution'

const ONBOARDING_STORAGE_KEY = 'onboarding_progress'
const SYNC_DEBOUNCE_MS = 1000

interface UseProgressPersistenceProps {
  profile: OnboardingProfile
  currentStep: number
  completedSteps: Set<number>
  onProgressRestored?: (progress: OnboardingProgress) => void
}

interface OnboardingProgress {
  profile: OnboardingProfile
  currentStep: number
  completedSteps: number[]
  lastUpdated: Date
  deviceId: string
  version: string
}

export const useProgressPersistence = ({
  profile,
  currentStep,
  completedSteps,
  onProgressRestored
}: UseProgressPersistenceProps) => {
  const { user } = useAuth()
  const { detectConflict, conflictState } = useConflictResolution({
    onConflictResolved: onProgressRestored
  })

  // Generate device ID for conflict resolution
  const getDeviceId = useCallback(async (): Promise<string> => {
    let deviceId = await AsyncStorage.getItem('device_id')
    if (!deviceId) {
      deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      await AsyncStorage.setItem('device_id', deviceId)
    }
    return deviceId
  }, [])

  // Save progress to local storage
  const saveToLocalStorage = useCallback(async (progressData: OnboardingProgress) => {
    try {
      await AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(progressData))
    } catch (error) {
      console.error('Failed to save onboarding progress to local storage:', error)
    }
  }, [])

  // Load progress from local storage
  const loadFromLocalStorage = useCallback(async (): Promise<OnboardingProgress | null> => {
    try {
      const stored = await AsyncStorage.getItem(ONBOARDING_STORAGE_KEY)
      if (stored) {
        const progress = JSON.parse(stored)
        return {
          ...progress,
          lastUpdated: new Date(progress.lastUpdated)
        }
      }
    } catch (error) {
      console.error('Failed to load onboarding progress from local storage:', error)
    }
    return null
  }, [])

  // Save progress to Firestore (for cross-device sync)
  const saveToFirestore = useCallback(async (progressData: OnboardingProgress) => {
    if (!user?.uid) return

    try {
      const progressRef = doc(db, 'onboarding_progress', user.uid)
      await setDoc(progressRef, {
        ...progressData,
        lastUpdated: serverTimestamp(),
        userId: user.uid
      }, { merge: true })
    } catch (error) {
      console.error('Failed to save onboarding progress to Firestore:', error)
      // Add to offline queue for retry when network is available
      await addProgressToOfflineQueue('save_progress', progressData)
      throw error
    }
  }, [user?.uid])

  // Load progress from Firestore
  const loadFromFirestore = useCallback(async (): Promise<OnboardingProgress | null> => {
    if (!user?.uid) return null

    try {
      const progressRef = doc(db, 'onboarding_progress', user.uid)
      const progressSnap = await getDoc(progressRef)
      
      if (progressSnap.exists()) {
        const data = progressSnap.data()
        return {
          ...data,
          lastUpdated: data.lastUpdated?.toDate() || new Date()
        } as OnboardingProgress
      }
    } catch (error) {
      console.error('Failed to load onboarding progress from Firestore:', error)
    }
    return null
  }, [user?.uid])

  // Create progress data object
  const createProgressData = useCallback(async (): Promise<OnboardingProgress> => {
    const deviceId = await getDeviceId()
    return {
      profile,
      currentStep,
      completedSteps: Array.from(completedSteps),
      lastUpdated: new Date(),
      deviceId,
      version: '1.0.0' // App version for compatibility
    }
  }, [profile, currentStep, completedSteps, getDeviceId])

  // Save progress (both local and Firestore)
  const saveProgress = useCallback(async () => {
    try {
      const progressData = await createProgressData()
      
      // Save to local storage immediately
      await saveToLocalStorage(progressData)
      
      // Save to Firestore for cross-device sync
      await saveToFirestore(progressData)
      
      return progressData
    } catch (error) {
      console.error('Failed to save onboarding progress:', error)
      throw error
    }
  }, [createProgressData, saveToLocalStorage, saveToFirestore])

  // Load and restore progress with conflict detection
  const loadProgress = useCallback(async (): Promise<OnboardingProgress | null> => {
    try {
      // Try to load from Firestore first (most up-to-date)
      let firestoreProgress: OnboardingProgress | null = null
      if (user?.uid) {
        firestoreProgress = await loadFromFirestore()
      }

      // Load from local storage as fallback
      const localProgress = await loadFromLocalStorage()

      // Handle different scenarios
      if (!firestoreProgress && !localProgress) {
        return null
      }

      if (!firestoreProgress) {
        return localProgress
      }

      if (!localProgress) {
        return firestoreProgress
      }

      // Both exist - check for conflicts
      const resolvedProgress = await detectConflict(localProgress, firestoreProgress)
      
      // If conflict detected, resolvedProgress will be null and conflict UI will show
      // Otherwise, return the resolved progress
      return resolvedProgress
    } catch (error) {
      console.error('Failed to load onboarding progress:', error)
      return null
    }
  }, [user?.uid, loadFromFirestore, loadFromLocalStorage, detectConflict])

  // Clear progress (for "Start Over" functionality)
  const clearProgress = useCallback(async () => {
    try {
      // Clear local storage
      await AsyncStorage.removeItem(ONBOARDING_STORAGE_KEY)
      
      // Clear Firestore if user is authenticated
      if (user?.uid) {
        const progressRef = doc(db, 'onboarding_progress', user.uid)
        await setDoc(progressRef, { cleared: true, clearedAt: serverTimestamp() })
      }
    } catch (error) {
      console.error('Failed to clear onboarding progress:', error)
      throw error
    }
  }, [user?.uid])

  // Validate progress data integrity
  const validateProgress = useCallback((progress: OnboardingProgress): boolean => {
    const validation = validateProgressIntegrity(progress)
    
    if (!validation.isValid) {
      console.error('Progress validation failed:', validation.errors)
      return false
    }
    
    if (validation.warnings.length > 0) {
      console.warn('Progress validation warnings:', validation.warnings)
    }
    
    return true
  }, [])

  // Auto-save progress when data changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      saveProgress().catch(console.error)
    }, SYNC_DEBOUNCE_MS)

    return () => clearTimeout(timeoutId)
  }, [profile, currentStep, completedSteps, saveProgress])

  // Load progress on mount
  useEffect(() => {
    const initializeProgress = async () => {
      try {
        const savedProgress = await loadProgress()
        if (savedProgress && validateProgress(savedProgress) && onProgressRestored) {
          onProgressRestored(savedProgress)
        }
      } catch (error) {
        console.error('Failed to initialize progress:', error)
      }
    }

    initializeProgress()
  }, [loadProgress, validateProgress, onProgressRestored])

  // Get offline queue status
  const getQueueStatus = useCallback(() => {
    return getOfflineQueueStatus()
  }, [])

  return {
    saveProgress,
    loadProgress,
    clearProgress,
    validateProgress,
    getQueueStatus,
    conflictState
  }
}