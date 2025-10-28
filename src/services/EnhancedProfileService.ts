/**
 * Enhanced Profile Service
 * 
 * Combines ProfileService with offline storage, error recovery,
 * and user notification systems for robust profile management
 */

import { OnboardingProfile } from '../types/onboarding'
import { FirestoreUserProfile, FirestoreTrialInfo, FirestoreError } from '../types/firestore'
import { profileService } from './ProfileService'
import { offlineStorageService } from './OfflineStorageService'
import { Alert } from 'react-native'

export interface ProfileOperationResult<T = any> {
  success: boolean
  data?: T
  error?: FirestoreError
  wasOffline?: boolean
  queuedForSync?: boolean
  operationId?: string
}

export interface ProfileCreationOptions {
  enableOfflineQueue?: boolean
  showUserNotifications?: boolean
  autoRetry?: boolean
  trialDurationDays?: number
}

export class EnhancedProfileService {
  private static instance: EnhancedProfileService

  private constructor() {}

  static getInstance(): EnhancedProfileService {
    if (!EnhancedProfileService.instance) {
      EnhancedProfileService.instance = new EnhancedProfileService()
    }
    return EnhancedProfileService.instance
  }

  /**
   * Create user profile with enhanced error handling and offline support
   */
  async createProfile(
    profile: OnboardingProfile,
    userId: string,
    email: string,
    options: ProfileCreationOptions = {}
  ): Promise<ProfileOperationResult<FirestoreUserProfile>> {
    const {
      enableOfflineQueue = true,
      showUserNotifications = true,
      autoRetry = true,
      trialDurationDays = 7
    } = options

    try {
      // Check if online
      const isOnline = await offlineStorageService.isOnline()
      
      if (!isOnline && enableOfflineQueue) {
        // Queue for offline sync
        const operationId = await offlineStorageService.queueProfileCreation(
          profile,
          userId,
          email
        )
        
        if (showUserNotifications) {
          this.showOfflineNotification('Profile creation queued for when you\'re back online')
        }
        
        return {
          success: true,
          wasOffline: true,
          queuedForSync: true,
          operationId
        }
      }

      // Attempt online creation
      const firestoreProfile = await profileService.createProfile(profile, userId, email)
      
      if (showUserNotifications) {
        this.showSuccessNotification('Profile created successfully!')
      }
      
      return {
        success: true,
        data: firestoreProfile,
        wasOffline: false
      }
      
    } catch (error) {
      console.error('Profile creation failed:', error)
      
      const firestoreError = this.createErrorFromException(error, 'createProfile')
      
      // If retryable and offline queue enabled, queue the operation
      if (firestoreError.retryable && enableOfflineQueue) {
        try {
          const operationId = await offlineStorageService.queueProfileCreation(
            profile,
            userId,
            email
          )
          
          if (showUserNotifications) {
            this.showRetryNotification('Profile creation failed, queued for retry')
          }
          
          return {
            success: false,
            error: firestoreError,
            queuedForSync: true,
            operationId
          }
        } catch (queueError) {
          console.error('Failed to queue profile creation:', queueError)
        }
      }
      
      if (showUserNotifications) {
        this.showErrorNotification('Failed to create profile. Please try again.')
      }
      
      return {
        success: false,
        error: firestoreError
      }
    }
  }

  /**
   * Create profile with trial activation in a single transaction
   */
  async createProfileWithTrial(
    profile: OnboardingProfile,
    userId: string,
    email: string,
    options: ProfileCreationOptions = {}
  ): Promise<ProfileOperationResult<{ profile: FirestoreUserProfile; trial: FirestoreTrialInfo }>> {
    const {
      enableOfflineQueue = true,
      showUserNotifications = true,
      trialDurationDays = 7
    } = options

    try {
      // Check if online
      const isOnline = await offlineStorageService.isOnline()
      
      if (!isOnline && enableOfflineQueue) {
        // Queue both operations
        const profileOpId = await offlineStorageService.queueProfileCreation(
          profile,
          userId,
          email
        )
        
        const trialOpId = await offlineStorageService.queueTrialCreation(
          userId,
          trialDurationDays
        )
        
        if (showUserNotifications) {
          this.showOfflineNotification('Account setup queued for when you\'re back online')
        }
        
        return {
          success: true,
          wasOffline: true,
          queuedForSync: true,
          operationId: `${profileOpId},${trialOpId}`
        }
      }

      // Attempt online creation with trial
      const result = await profileService.createProfileWithTrial(
        profile,
        userId,
        email,
        trialDurationDays
      )
      
      if (showUserNotifications) {
        this.showSuccessNotification('Account created! Your 7-day trial is now active.')
      }
      
      return {
        success: true,
        data: result,
        wasOffline: false
      }
      
    } catch (error) {
      console.error('Profile with trial creation failed:', error)
      
      const firestoreError = this.createErrorFromException(error, 'createProfileWithTrial')
      
      // If retryable and offline queue enabled, queue the operations
      if (firestoreError.retryable && enableOfflineQueue) {
        try {
          const profileOpId = await offlineStorageService.queueProfileCreation(
            profile,
            userId,
            email
          )
          
          const trialOpId = await offlineStorageService.queueTrialCreation(
            userId,
            trialDurationDays
          )
          
          if (showUserNotifications) {
            this.showRetryNotification('Account setup failed, queued for retry')
          }
          
          return {
            success: false,
            error: firestoreError,
            queuedForSync: true,
            operationId: `${profileOpId},${trialOpId}`
          }
        } catch (queueError) {
          console.error('Failed to queue profile with trial creation:', queueError)
        }
      }
      
      if (showUserNotifications) {
        this.showErrorNotification('Failed to create account. Please try again.')
      }
      
      return {
        success: false,
        error: firestoreError
      }
    }
  }

  /**
   * Update profile with error handling and offline support
   */
  async updateProfile(
    userId: string,
    updates: Partial<FirestoreUserProfile>,
    options: ProfileCreationOptions = {}
  ): Promise<ProfileOperationResult<void>> {
    const {
      enableOfflineQueue = true,
      showUserNotifications = true
    } = options

    try {
      // Check if online
      const isOnline = await offlineStorageService.isOnline()
      
      if (!isOnline && enableOfflineQueue) {
        // Queue for offline sync
        const operationId = await offlineStorageService.queueProfileUpdate(userId, updates)
        
        if (showUserNotifications) {
          this.showOfflineNotification('Profile update queued for when you\'re back online')
        }
        
        return {
          success: true,
          wasOffline: true,
          queuedForSync: true,
          operationId
        }
      }

      // Attempt online update
      await profileService.updateProfile(userId, updates)
      
      if (showUserNotifications) {
        this.showSuccessNotification('Profile updated successfully!')
      }
      
      return {
        success: true,
        wasOffline: false
      }
      
    } catch (error) {
      console.error('Profile update failed:', error)
      
      const firestoreError = this.createErrorFromException(error, 'updateProfile')
      
      // If retryable and offline queue enabled, queue the operation
      if (firestoreError.retryable && enableOfflineQueue) {
        try {
          const operationId = await offlineStorageService.queueProfileUpdate(userId, updates)
          
          if (showUserNotifications) {
            this.showRetryNotification('Profile update failed, queued for retry')
          }
          
          return {
            success: false,
            error: firestoreError,
            queuedForSync: true,
            operationId
          }
        } catch (queueError) {
          console.error('Failed to queue profile update:', queueError)
        }
      }
      
      if (showUserNotifications) {
        this.showErrorNotification('Failed to update profile. Please try again.')
      }
      
      return {
        success: false,
        error: firestoreError
      }
    }
  }

  /**
   * Get profile with error handling
   */
  async getProfile(
    userId: string,
    options: { showUserNotifications?: boolean } = {}
  ): Promise<ProfileOperationResult<FirestoreUserProfile | null>> {
    const { showUserNotifications = false } = options

    try {
      const profile = await profileService.getProfile(userId)
      
      return {
        success: true,
        data: profile
      }
      
    } catch (error) {
      console.error('Failed to get profile:', error)
      
      const firestoreError = this.createErrorFromException(error, 'getProfile')
      
      if (showUserNotifications) {
        this.showErrorNotification('Failed to load profile. Please try again.')
      }
      
      return {
        success: false,
        error: firestoreError
      }
    }
  }

  /**
   * Get trial information with error handling
   */
  async getTrialInfo(
    userId: string,
    options: { showUserNotifications?: boolean } = {}
  ): Promise<ProfileOperationResult<FirestoreTrialInfo | null>> {
    const { showUserNotifications = false } = options

    try {
      const trialInfo = await profileService.getTrialInfo(userId)
      
      return {
        success: true,
        data: trialInfo
      }
      
    } catch (error) {
      console.error('Failed to get trial info:', error)
      
      const firestoreError = this.createErrorFromException(error, 'getTrialInfo')
      
      if (showUserNotifications) {
        this.showErrorNotification('Failed to load trial information.')
      }
      
      return {
        success: false,
        error: firestoreError
      }
    }
  }

  /**
   * Force sync all pending operations
   */
  async syncPendingOperations(): Promise<{
    success: number
    failed: number
    errors: FirestoreError[]
  }> {
    try {
      const result = await offlineStorageService.forceSyncNow()
      
      if (result.success > 0) {
        this.showSuccessNotification(`${result.success} operations synced successfully`)
      }
      
      if (result.failed > 0) {
        this.showErrorNotification(`${result.failed} operations failed to sync`)
      }
      
      return result
    } catch (error) {
      console.error('Failed to sync pending operations:', error)
      return { success: 0, failed: 0, errors: [] }
    }
  }

  /**
   * Get offline queue status
   */
  async getOfflineStatus(): Promise<{
    queueLength: number
    isOnline: boolean
    syncInProgress: boolean
    lastSyncAttempt?: Date
    lastSuccessfulSync?: Date
  }> {
    return offlineStorageService.getQueueStatus()
  }

  /**
   * Create FirestoreError from exception
   */
  private createErrorFromException(error: any, operation: string): FirestoreError {
    return {
      code: error?.code || 'unknown',
      message: error?.message || 'Unknown error occurred',
      operation: operation as any,
      collection: 'users',
      retryable: this.isRetryableError(error),
      timestamp: new Date() as any
    }
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: any): boolean {
    if (error?.code) {
      const retryableCodes = [
        'unavailable',
        'deadline-exceeded',
        'resource-exhausted',
        'aborted',
        'internal',
        'unknown',
        'network-request-failed'
      ]
      return retryableCodes.includes(error.code)
    }
    return true // Default to retryable for unknown errors
  }

  /**
   * Show success notification to user
   */
  private showSuccessNotification(message: string): void {
    // In a real app, you might use a toast library or custom notification component
    console.log('SUCCESS:', message)
  }

  /**
   * Show error notification to user
   */
  private showErrorNotification(message: string): void {
    Alert.alert('Error', message, [{ text: 'OK' }])
  }

  /**
   * Show offline notification to user
   */
  private showOfflineNotification(message: string): void {
    Alert.alert('Offline Mode', message, [{ text: 'OK' }])
  }

  /**
   * Show retry notification to user
   */
  private showRetryNotification(message: string): void {
    Alert.alert('Retry Queued', message, [{ text: 'OK' }])
  }

  /**
   * Validate profile data before operations
   */
  validateProfileData(profile: OnboardingProfile): string[] {
    const errors: string[] = []
    
    // Required fields validation
    if (!profile.role) errors.push('Role is required')
    if (!profile.sport) errors.push('Sport is required')
    if (!profile.gender) errors.push('Gender is required')
    if (!profile.dateOfBirth) errors.push('Date of birth is required')
    if (!profile.graduationYear) errors.push('Graduation year is required')
    if (!profile.position) errors.push('Position is required')
    if (!profile.academicLevel) errors.push('Academic level is required')
    if (!profile.teamType) errors.push('Team type is required')
    if (!profile.school) errors.push('School information is required')
    if (!profile.selectedGoals || profile.selectedGoals.length !== 3) {
      errors.push('Exactly 3 goals must be selected')
    }
    if (!profile.dna) errors.push('AthleteDNA assessment is required')
    if (!profile.aiTone) errors.push('AI tone preference is required')
    if (profile.ageVerified === undefined) errors.push('Age verification is required')
    if (!profile.tosAccepted) errors.push('Terms of Service acceptance is required')
    if (!profile.privacyAccepted) errors.push('Privacy Policy acceptance is required')
    
    // Age-specific validation
    if (profile.dateOfBirth) {
      const age = this.calculateAge(profile.dateOfBirth)
      if (age < 13) {
        errors.push('User must be at least 13 years old')
      }
      if (age >= 13 && age <= 15 && !profile.guardianEmail) {
        errors.push('Guardian email is required for users 13-15 years old')
      }
    }
    
    return errors
  }

  /**
   * Calculate age from date of birth
   */
  private calculateAge(dateOfBirth: Date): number {
    const today = new Date()
    const birthDate = new Date(dateOfBirth)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    
    return age
  }
}

// Export singleton instance
export const enhancedProfileService = EnhancedProfileService.getInstance()