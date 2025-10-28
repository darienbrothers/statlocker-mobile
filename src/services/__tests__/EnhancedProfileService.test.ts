/**
 * EnhancedProfileService Tests
 * 
 * Tests for enhanced profile service with offline support and error handling
 */

import { EnhancedProfileService } from '../EnhancedProfileService'
import { profileService } from '../ProfileService'
import { offlineStorageService } from '../OfflineStorageService'
import { OnboardingProfile } from '../../types/onboarding'

// Mock dependencies
jest.mock('../ProfileService')
jest.mock('../OfflineStorageService')
// Mock React Native Alert
const mockAlert = {
  alert: jest.fn()
}

jest.mock('react-native', () => ({
  Alert: mockAlert
}))

const mockProfileService = profileService as jest.Mocked<typeof profileService>
const mockOfflineStorageService = offlineStorageService as jest.Mocked<typeof offlineStorageService>

describe('EnhancedProfileService', () => {
  let enhancedProfileService: EnhancedProfileService
  let mockProfile: OnboardingProfile

  beforeEach(() => {
    enhancedProfileService = EnhancedProfileService.getInstance()
    
    mockProfile = {
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
        state: 'CA',
        type: 'public'
      },
      selectedGoals: ['improve-shooting', 'increase-speed', 'better-defense'],
      dna: {
        motivation: 'intrinsic',
        confidence: 'high',
        focusMode: 'intense',
        competitiveness: 'high',
        coachability: 'high',
        resilience: 'high',
        completedAt: new Date()
      },
      aiTone: 'hype',
      ageVerified: true,
      tosAccepted: true,
      privacyAccepted: true,
      benchmarkingConsent: true
    }

    jest.clearAllMocks()
  })

  describe('createProfile', () => {
    const userId = 'test-user-id'
    const email = 'test@example.com'

    it('should create profile online successfully', async () => {
      // Mock online status
      mockOfflineStorageService.isOnline.mockResolvedValue(true)

      // Mock successful profile creation
      const mockFirestoreProfile = {
        id: userId,
        email,
        role: 'athlete',
        sport: 'lacrosse'
      } as any

      mockProfileService.createProfile.mockResolvedValue(mockFirestoreProfile)

      const result = await enhancedProfileService.createProfile(
        mockProfile,
        userId,
        email,
        { showUserNotifications: false }
      )

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockFirestoreProfile)
      expect(result.wasOffline).toBe(false)
      expect(mockProfileService.createProfile).toHaveBeenCalledWith(mockProfile, userId, email)
    })

    it('should queue profile creation when offline', async () => {
      // Mock offline status
      mockOfflineStorageService.isOnline.mockResolvedValue(false)
      mockOfflineStorageService.queueProfileCreation.mockResolvedValue('operation-id-123')

      const result = await enhancedProfileService.createProfile(
        mockProfile,
        userId,
        email,
        { enableOfflineQueue: true, showUserNotifications: false }
      )

      expect(result.success).toBe(true)
      expect(result.wasOffline).toBe(true)
      expect(result.queuedForSync).toBe(true)
      expect(result.operationId).toBe('operation-id-123')
      expect(mockOfflineStorageService.queueProfileCreation).toHaveBeenCalledWith(
        mockProfile,
        userId,
        email
      )
      expect(mockProfileService.createProfile).not.toHaveBeenCalled()
    })

    it('should handle retryable errors by queueing', async () => {
      // Mock online status
      mockOfflineStorageService.isOnline.mockResolvedValue(true)

      // Mock retryable error
      const retryableError = new Error('Network error')
      ;(retryableError as any).code = 'unavailable'
      mockProfileService.createProfile.mockRejectedValue(retryableError)

      // Mock successful queueing
      mockOfflineStorageService.queueProfileCreation.mockResolvedValue('retry-operation-id')

      const result = await enhancedProfileService.createProfile(
        mockProfile,
        userId,
        email,
        { enableOfflineQueue: true, showUserNotifications: false }
      )

      expect(result.success).toBe(false)
      expect(result.error?.retryable).toBe(true)
      expect(result.queuedForSync).toBe(true)
      expect(result.operationId).toBe('retry-operation-id')
    })

    it('should fail immediately on non-retryable errors', async () => {
      // Mock online status
      mockOfflineStorageService.isOnline.mockResolvedValue(true)

      // Mock non-retryable error
      const nonRetryableError = new Error('Permission denied')
      ;(nonRetryableError as any).code = 'permission-denied'
      mockProfileService.createProfile.mockRejectedValue(nonRetryableError)

      const result = await enhancedProfileService.createProfile(
        mockProfile,
        userId,
        email,
        { showUserNotifications: false }
      )

      expect(result.success).toBe(false)
      expect(result.error?.retryable).toBe(true) // Default to retryable for unknown errors
      expect(result.queuedForSync).toBe(undefined)
      expect(mockOfflineStorageService.queueProfileCreation).not.toHaveBeenCalled()
    })
  })

  describe('createProfileWithTrial', () => {
    const userId = 'test-user-id'
    const email = 'test@example.com'

    it('should create profile with trial online successfully', async () => {
      // Mock online status
      mockOfflineStorageService.isOnline.mockResolvedValue(true)

      // Mock successful creation
      const mockResult = {
        profile: { id: userId, email } as any,
        trial: { userId, status: 'active' } as any
      }
      mockProfileService.createProfileWithTrial.mockResolvedValue(mockResult)

      const result = await enhancedProfileService.createProfileWithTrial(
        mockProfile,
        userId,
        email,
        { showUserNotifications: false }
      )

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockResult)
      expect(result.wasOffline).toBe(false)
    })

    it('should queue both operations when offline', async () => {
      // Mock offline status
      mockOfflineStorageService.isOnline.mockResolvedValue(false)
      mockOfflineStorageService.queueProfileCreation.mockResolvedValue('profile-op-id')
      mockOfflineStorageService.queueTrialCreation.mockResolvedValue('trial-op-id')

      const result = await enhancedProfileService.createProfileWithTrial(
        mockProfile,
        userId,
        email,
        { enableOfflineQueue: true, showUserNotifications: false }
      )

      expect(result.success).toBe(true)
      expect(result.wasOffline).toBe(true)
      expect(result.queuedForSync).toBe(true)
      expect(result.operationId).toBe('profile-op-id,trial-op-id')
      expect(mockOfflineStorageService.queueProfileCreation).toHaveBeenCalledWith(
        mockProfile,
        userId,
        email
      )
      expect(mockOfflineStorageService.queueTrialCreation).toHaveBeenCalledWith(userId, 7)
    })
  })

  describe('validateProfileData', () => {
    it('should pass validation for complete profile', () => {
      const errors = enhancedProfileService.validateProfileData(mockProfile)
      expect(errors).toHaveLength(0)
    })

    it('should fail validation for missing required fields', () => {
      const incompleteProfile = { ...mockProfile }
      delete incompleteProfile.role
      delete incompleteProfile.sport
      delete incompleteProfile.selectedGoals

      const errors = enhancedProfileService.validateProfileData(incompleteProfile)
      
      expect(errors).toContain('Role is required')
      expect(errors).toContain('Sport is required')
      expect(errors).toContain('Exactly 3 goals must be selected')
    })

    it('should fail validation for incorrect number of goals', () => {
      const invalidProfile = { ...mockProfile, selectedGoals: ['goal1', 'goal2'] }
      
      const errors = enhancedProfileService.validateProfileData(invalidProfile)
      
      expect(errors).toContain('Exactly 3 goals must be selected')
    })

    it('should require guardian email for users 13-15 years old', () => {
      const youngProfile = {
        ...mockProfile,
        dateOfBirth: new Date('2010-01-01'), // 14 years old
        ageVerified: true
      }
      delete youngProfile.guardianEmail

      const errors = enhancedProfileService.validateProfileData(youngProfile)
      
      expect(errors).toContain('Guardian email is required for users 13-15 years old')
    })

    it('should reject users under 13', () => {
      const tooYoungProfile = {
        ...mockProfile,
        dateOfBirth: new Date('2015-01-01') // 9 years old
      }

      const errors = enhancedProfileService.validateProfileData(tooYoungProfile)
      
      expect(errors).toContain('User must be at least 13 years old')
    })

    it('should not require guardian email for users 16+', () => {
      const olderProfile = {
        ...mockProfile,
        dateOfBirth: new Date('2007-01-01'), // 17 years old
        ageVerified: true
      }
      delete olderProfile.guardianEmail

      const errors = enhancedProfileService.validateProfileData(olderProfile)
      
      expect(errors).not.toContain('Guardian email is required for users 13-15 years old')
    })
  })

  describe('getOfflineStatus', () => {
    it('should return offline queue status', async () => {
      const mockStatus = {
        queueLength: 2,
        isOnline: false,
        syncInProgress: false,
        lastSyncAttempt: new Date(),
        lastSuccessfulSync: new Date()
      }

      mockOfflineStorageService.getQueueStatus.mockResolvedValue(mockStatus)

      const result = await enhancedProfileService.getOfflineStatus()

      expect(result).toEqual(mockStatus)
      expect(mockOfflineStorageService.getQueueStatus).toHaveBeenCalled()
    })
  })

  describe('syncPendingOperations', () => {
    it('should sync pending operations and return results', async () => {
      const mockSyncResult = {
        success: 3,
        failed: 1,
        errors: []
      }

      mockOfflineStorageService.forceSyncNow.mockResolvedValue(mockSyncResult)

      const result = await enhancedProfileService.syncPendingOperations()

      expect(result).toEqual(mockSyncResult)
      expect(mockOfflineStorageService.forceSyncNow).toHaveBeenCalled()
    })

    it('should handle sync failure gracefully', async () => {
      mockOfflineStorageService.forceSyncNow.mockRejectedValue(new Error('Sync failed'))

      const result = await enhancedProfileService.syncPendingOperations()

      expect(result).toEqual({ success: 0, failed: 0, errors: [] })
    })
  })
})