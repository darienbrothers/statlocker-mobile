/**
 * TrialManagementService Tests
 * 
 * Tests for trial activation, status tracking, and RevenueCat integration
 */

import { TrialManagementService } from '../TrialManagementService'
import { revenueCatService } from '../RevenueCatService'
import { profileService } from '../ProfileService'

// Mock dependencies
jest.mock('../RevenueCatService')
jest.mock('../ProfileService')

// Mock Firebase Firestore Timestamp
jest.mock('firebase/firestore', () => ({
  Timestamp: {
    now: jest.fn(() => ({ seconds: Date.now() / 1000, nanoseconds: 0 })),
    fromDate: jest.fn((date: Date) => ({ seconds: date.getTime() / 1000, nanoseconds: 0 }))
  }
}))

const mockRevenueCatService = revenueCatService as jest.Mocked<typeof revenueCatService>
const mockProfileService = profileService as jest.Mocked<typeof profileService>

describe('TrialManagementService', () => {
  let trialManagementService: TrialManagementService

  beforeEach(() => {
    trialManagementService = TrialManagementService.getInstance()
    jest.clearAllMocks()
  })

  describe('activateTrial', () => {
    const userId = 'test-user-id'
    const trialDurationDays = 7

    it('should successfully activate trial with both RevenueCat and Firestore', async () => {
      // Mock successful RevenueCat activation
      mockRevenueCatService.initializeForUser.mockResolvedValue()
      mockRevenueCatService.activateTrial.mockResolvedValue({
        success: true,
        trialActive: true,
        trialEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        customerInfo: { entitlements: { active: {} } } as any
      })

      // Mock successful Firestore creation
      mockProfileService.createTrialInfo.mockResolvedValue({
        userId,
        status: 'active',
        startDate: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
        endDate: { seconds: (Date.now() + 7 * 24 * 60 * 60 * 1000) / 1000, nanoseconds: 0 } as any,
        activatedAt: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
        gamesLogged: 0,
        aiInsightsGenerated: 0,
        goalsCreated: 0,
        lastActivityAt: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
        createdAt: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
        updatedAt: { seconds: Date.now() / 1000, nanoseconds: 0 } as any
      })

      mockProfileService.updateTrialStatus.mockResolvedValue()
      mockRevenueCatService.setUserAttributes.mockResolvedValue()

      const result = await trialManagementService.activateTrial(userId, trialDurationDays)

      expect(result.success).toBe(true)
      expect(result.trialActive).toBe(true)
      expect(result.trialEndDate).toBeDefined()
      expect(result.firestoreTrialInfo).toBeDefined()
      expect(result.revenueCatCustomerInfo).toBeDefined()

      expect(mockRevenueCatService.initializeForUser).toHaveBeenCalledWith(userId)
      expect(mockRevenueCatService.activateTrial).toHaveBeenCalledWith(userId)
      expect(mockProfileService.createTrialInfo).toHaveBeenCalledWith(userId, trialDurationDays)
    })

    it('should handle RevenueCat failure but continue with Firestore if retryable', async () => {
      // Mock RevenueCat failure (retryable)
      mockRevenueCatService.initializeForUser.mockResolvedValue()
      mockRevenueCatService.activateTrial.mockResolvedValue({
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Network error',
          retryable: true
        }
      })

      // Mock successful Firestore creation
      mockProfileService.createTrialInfo.mockResolvedValue({
        userId,
        status: 'active',
        startDate: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
        endDate: { seconds: (Date.now() + 7 * 24 * 60 * 60 * 1000) / 1000, nanoseconds: 0 } as any,
        activatedAt: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
        gamesLogged: 0,
        aiInsightsGenerated: 0,
        goalsCreated: 0,
        lastActivityAt: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
        createdAt: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
        updatedAt: { seconds: Date.now() / 1000, nanoseconds: 0 } as any
      })

      const result = await trialManagementService.activateTrial(userId, trialDurationDays)

      expect(result.success).toBe(true)
      expect(result.trialActive).toBe(true)
      expect(result.error?.source).toBe('revenuecat')
      expect(result.error?.retryable).toBe(true)
      expect(result.firestoreTrialInfo).toBeDefined()
    })

    it('should fail completely on non-retryable RevenueCat error', async () => {
      // Mock RevenueCat failure (non-retryable)
      mockRevenueCatService.initializeForUser.mockResolvedValue()
      mockRevenueCatService.activateTrial.mockResolvedValue({
        success: false,
        error: {
          code: 'PERMISSION_DENIED',
          message: 'Permission denied',
          retryable: false
        }
      })

      const result = await trialManagementService.activateTrial(userId, trialDurationDays)

      expect(result.success).toBe(false)
      expect(result.trialActive).toBe(false)
      expect(result.error?.source).toBe('revenuecat')
      expect(result.error?.retryable).toBe(false)

      // Should not attempt Firestore creation
      expect(mockProfileService.createTrialInfo).not.toHaveBeenCalled()
    })

    it('should handle Firestore failure after successful RevenueCat activation', async () => {
      // Mock successful RevenueCat activation
      mockRevenueCatService.initializeForUser.mockResolvedValue()
      mockRevenueCatService.activateTrial.mockResolvedValue({
        success: true,
        trialActive: true,
        trialEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        customerInfo: { entitlements: { active: {} } } as any
      })

      // Mock Firestore failure
      mockProfileService.createTrialInfo.mockRejectedValue(new Error('Firestore error'))

      const result = await trialManagementService.activateTrial(userId, trialDurationDays)

      expect(result.success).toBe(true)
      expect(result.trialActive).toBe(true)
      expect(result.error?.source).toBe('firestore')
      expect(result.error?.retryable).toBe(true)
      expect(result.revenueCatCustomerInfo).toBeDefined()
    })
  })

  describe('getTrialStatus', () => {
    const userId = 'test-user-id'

    it('should return combined status from both sources', async () => {
      // Mock RevenueCat status
      mockRevenueCatService.getSubscriptionStatus.mockResolvedValue({
        isActive: true,
        isTrialActive: true,
        trialEndDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        entitlements: ['pro_features'],
        willRenew: false
      })

      // Mock Firestore trial info
      mockProfileService.getTrialInfo.mockResolvedValue({
        userId,
        status: 'active',
        startDate: { seconds: (Date.now() - 2 * 24 * 60 * 60 * 1000) / 1000, nanoseconds: 0 } as any,
        endDate: { seconds: (Date.now() + 5 * 24 * 60 * 60 * 1000) / 1000, nanoseconds: 0 } as any,
        activatedAt: { seconds: (Date.now() - 2 * 24 * 60 * 60 * 1000) / 1000, nanoseconds: 0 } as any,
        gamesLogged: 3,
        aiInsightsGenerated: 2,
        goalsCreated: 3,
        lastActivityAt: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
        createdAt: { seconds: (Date.now() - 2 * 24 * 60 * 60 * 1000) / 1000, nanoseconds: 0 } as any,
        updatedAt: { seconds: Date.now() / 1000, nanoseconds: 0 } as any
      })

      const result = await trialManagementService.getTrialStatus(userId)

      expect(result.isActive).toBe(true)
      expect(result.daysRemaining).toBe(5)
      expect(result.source).toBe('both')
      expect(result.gamesLogged).toBe(3)
      expect(result.aiInsightsGenerated).toBe(2)
      expect(result.goalsCreated).toBe(3)
    })

    it('should handle RevenueCat failure gracefully', async () => {
      // Mock RevenueCat failure
      mockRevenueCatService.getSubscriptionStatus.mockRejectedValue(new Error('RevenueCat error'))

      // Mock successful Firestore
      mockProfileService.getTrialInfo.mockResolvedValue({
        userId,
        status: 'active',
        startDate: { seconds: (Date.now() - 2 * 24 * 60 * 60 * 1000) / 1000, nanoseconds: 0 } as any,
        endDate: { seconds: (Date.now() + 5 * 24 * 60 * 60 * 1000) / 1000, nanoseconds: 0 } as any,
        activatedAt: { seconds: (Date.now() - 2 * 24 * 60 * 60 * 1000) / 1000, nanoseconds: 0 } as any,
        gamesLogged: 1,
        aiInsightsGenerated: 0,
        goalsCreated: 3,
        lastActivityAt: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
        createdAt: { seconds: (Date.now() - 2 * 24 * 60 * 60 * 1000) / 1000, nanoseconds: 0 } as any,
        updatedAt: { seconds: Date.now() / 1000, nanoseconds: 0 } as any
      })

      const result = await trialManagementService.getTrialStatus(userId)

      expect(result.isActive).toBe(true)
      expect(result.source).toBe('firestore')
      expect(result.gamesLogged).toBe(1)
    })

    it('should return safe defaults on complete failure', async () => {
      // Mock both services failing
      mockRevenueCatService.getSubscriptionStatus.mockRejectedValue(new Error('RevenueCat error'))
      mockProfileService.getTrialInfo.mockRejectedValue(new Error('Firestore error'))

      const result = await trialManagementService.getTrialStatus(userId)

      expect(result.isActive).toBe(false)
      expect(result.daysRemaining).toBe(0)
      expect(result.source).toBe('firestore')
      expect(result.gamesLogged).toBe(0)
    })

    it('should calculate days remaining correctly', async () => {
      const endDate = new Date(Date.now() + 3.5 * 24 * 60 * 60 * 1000) // 3.5 days from now

      mockRevenueCatService.getSubscriptionStatus.mockResolvedValue({
        isActive: true,
        isTrialActive: true,
        trialEndDate: endDate,
        entitlements: ['pro_features'],
        willRenew: false
      })

      mockProfileService.getTrialInfo.mockResolvedValue({
        userId,
        status: 'active',
        startDate: { seconds: (Date.now() - 3.5 * 24 * 60 * 60 * 1000) / 1000, nanoseconds: 0 } as any,
        endDate: { seconds: endDate.getTime() / 1000, nanoseconds: 0 } as any,
        activatedAt: { seconds: (Date.now() - 3.5 * 24 * 60 * 60 * 1000) / 1000, nanoseconds: 0 } as any,
        gamesLogged: 0,
        aiInsightsGenerated: 0,
        goalsCreated: 0,
        lastActivityAt: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
        createdAt: { seconds: (Date.now() - 3.5 * 24 * 60 * 60 * 1000) / 1000, nanoseconds: 0 } as any,
        updatedAt: { seconds: Date.now() / 1000, nanoseconds: 0 } as any
      })

      const result = await trialManagementService.getTrialStatus(userId)

      expect(result.daysRemaining).toBe(4) // Should round up 3.5 to 4
    })

    it('should mark as inactive when days remaining is 0', async () => {
      const pastDate = new Date(Date.now() - 1000) // 1 second ago

      mockRevenueCatService.getSubscriptionStatus.mockResolvedValue({
        isActive: true,
        isTrialActive: true,
        trialEndDate: pastDate,
        entitlements: ['pro_features'],
        willRenew: false
      })

      mockProfileService.getTrialInfo.mockResolvedValue({
        userId,
        status: 'active',
        startDate: { seconds: (Date.now() - 7 * 24 * 60 * 60 * 1000) / 1000, nanoseconds: 0 } as any,
        endDate: { seconds: pastDate.getTime() / 1000, nanoseconds: 0 } as any,
        activatedAt: { seconds: (Date.now() - 7 * 24 * 60 * 60 * 1000) / 1000, nanoseconds: 0 } as any,
        gamesLogged: 5,
        aiInsightsGenerated: 3,
        goalsCreated: 3,
        lastActivityAt: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
        createdAt: { seconds: (Date.now() - 7 * 24 * 60 * 60 * 1000) / 1000, nanoseconds: 0 } as any,
        updatedAt: { seconds: Date.now() / 1000, nanoseconds: 0 } as any
      })

      const result = await trialManagementService.getTrialStatus(userId)

      expect(result.isActive).toBe(false)
      expect(result.daysRemaining).toBe(0)
    })
  })

  describe('updateTrialUsage', () => {
    it('should update trial usage statistics', async () => {
      const userId = 'test-user-id'
      const updates = {
        gamesLogged: 5,
        aiInsightsGenerated: 3,
        goalsCreated: 3
      }

      mockProfileService.updateTrialStatus.mockResolvedValue()

      const result = await trialManagementService.updateTrialUsage(userId, updates)

      expect(result).toBe(true)
      expect(mockProfileService.updateTrialStatus).toHaveBeenCalledWith(
        userId,
        'active',
        expect.objectContaining({
          ...updates,
          lastActivityAt: expect.anything()
        })
      )
    })

    it('should handle update failure gracefully', async () => {
      const userId = 'test-user-id'
      const updates = { gamesLogged: 1 }

      mockProfileService.updateTrialStatus.mockRejectedValue(new Error('Update failed'))

      const result = await trialManagementService.updateTrialUsage(userId, updates)

      expect(result).toBe(false)
    })
  })

  describe('isEligibleForTrial', () => {
    const userId = 'test-user-id'

    it('should return true for eligible user', async () => {
      // No existing trial in Firestore
      mockProfileService.getTrialInfo.mockResolvedValue(null)

      // No active subscriptions in RevenueCat
      mockRevenueCatService.getSubscriptionStatus.mockResolvedValue({
        isActive: false,
        isTrialActive: false,
        entitlements: [],
        willRenew: false
      })

      const result = await trialManagementService.isEligibleForTrial(userId)

      expect(result).toBe(true)
    })

    it('should return false if user has existing trial in Firestore', async () => {
      // Existing trial in Firestore
      mockProfileService.getTrialInfo.mockResolvedValue({
        userId,
        status: 'expired',
        startDate: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
        endDate: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
        activatedAt: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
        gamesLogged: 0,
        aiInsightsGenerated: 0,
        goalsCreated: 0,
        lastActivityAt: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
        createdAt: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
        updatedAt: { seconds: Date.now() / 1000, nanoseconds: 0 } as any
      })

      const result = await trialManagementService.isEligibleForTrial(userId)

      expect(result).toBe(false)
    })

    it('should return false if user has active RevenueCat entitlements', async () => {
      // No trial in Firestore
      mockProfileService.getTrialInfo.mockResolvedValue(null)

      // Active subscription in RevenueCat
      mockRevenueCatService.getSubscriptionStatus.mockResolvedValue({
        isActive: true,
        isTrialActive: false,
        entitlements: ['pro_features'],
        willRenew: true
      })

      const result = await trialManagementService.isEligibleForTrial(userId)

      expect(result).toBe(false)
    })

    it('should default to eligible on error', async () => {
      // Both services fail
      mockProfileService.getTrialInfo.mockRejectedValue(new Error('Firestore error'))
      mockRevenueCatService.getSubscriptionStatus.mockRejectedValue(new Error('RevenueCat error'))

      const result = await trialManagementService.isEligibleForTrial(userId)

      expect(result).toBe(true)
    })
  })
})