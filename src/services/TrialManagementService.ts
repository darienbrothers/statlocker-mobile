/**
 * Trial Management Service
 * 
 * Coordinates trial activation between RevenueCat and Firestore,
 * handles trial status tracking and provides unified trial management
 */

import { revenueCatService, TrialActivationResult } from './RevenueCatService'
import { profileService } from './ProfileService'
import { FirestoreTrialInfo } from '../types/firestore'
import { Timestamp } from 'firebase/firestore'

export interface TrialManagementResult {
  success: boolean
  trialActive: boolean
  trialEndDate?: Date
  firestoreTrialInfo?: FirestoreTrialInfo
  revenueCatCustomerInfo?: any
  error?: {
    source: 'revenuecat' | 'firestore' | 'validation'
    message: string
    code?: string
    retryable: boolean
  }
}

export interface TrialStatusInfo {
  isActive: boolean
  endDate?: Date
  daysRemaining: number
  source: 'revenuecat' | 'firestore' | 'both'
  gamesLogged: number
  aiInsightsGenerated: number
  goalsCreated: number
  lastActivityAt?: Date
}

export class TrialManagementService {
  private static instance: TrialManagementService

  private constructor() {}

  static getInstance(): TrialManagementService {
    if (!TrialManagementService.instance) {
      TrialManagementService.instance = new TrialManagementService()
    }
    return TrialManagementService.instance
  }

  /**
   * Activate trial for user (coordinates RevenueCat and Firestore)
   */
  async activateTrial(
    userId: string,
    trialDurationDays = 7
  ): Promise<TrialManagementResult> {
    try {
      console.log('Starting trial activation for user:', userId)

      // Step 1: Initialize RevenueCat for user
      await revenueCatService.initializeForUser(userId)

      // Step 2: Activate trial in RevenueCat
      const revenueCatResult = await revenueCatService.activateTrial(userId)

      if (!revenueCatResult.success) {
        console.error('RevenueCat trial activation failed:', revenueCatResult.error)
        
        // If RevenueCat fails but is retryable, still create Firestore trial
        if (revenueCatResult.error?.retryable) {
          console.log('RevenueCat failed but retryable, creating Firestore trial only')
          
          const firestoreTrialInfo = await profileService.createTrialInfo(userId, trialDurationDays)
          
          return {
            success: true,
            trialActive: true,
            trialEndDate: firestoreTrialInfo.endDate.toDate(),
            firestoreTrialInfo,
            error: {
              source: 'revenuecat',
              message: 'RevenueCat activation failed but trial created in Firestore',
              code: revenueCatResult.error?.code,
              retryable: true
            }
          }
        }

        return {
          success: false,
          trialActive: false,
          error: {
            source: 'revenuecat',
            message: revenueCatResult.error?.message || 'RevenueCat activation failed',
            code: revenueCatResult.error?.code,
            retryable: revenueCatResult.error?.retryable || false
          }
        }
      }

      // Step 3: Create or update Firestore trial info
      let firestoreTrialInfo: FirestoreTrialInfo
      
      try {
        // Calculate trial end date from RevenueCat or use default
        const trialEndDate = revenueCatResult.trialEndDate || 
                            new Date(Date.now() + trialDurationDays * 24 * 60 * 60 * 1000)

        firestoreTrialInfo = await profileService.createTrialInfo(userId, trialDurationDays)
        
        // Update with RevenueCat transaction info if available
        if (revenueCatResult.customerInfo) {
          await profileService.updateTrialStatus(userId, 'active', {
            revenueCatTransactionId: this.extractTransactionId(revenueCatResult.customerInfo)
          })
        }

      } catch (firestoreError) {
        console.error('Firestore trial creation failed:', firestoreError)
        
        // RevenueCat succeeded but Firestore failed
        return {
          success: true,
          trialActive: revenueCatResult.trialActive || false,
          trialEndDate: revenueCatResult.trialEndDate,
          revenueCatCustomerInfo: revenueCatResult.customerInfo,
          error: {
            source: 'firestore',
            message: 'Trial activated in RevenueCat but Firestore update failed',
            retryable: true
          }
        }
      }

      // Step 4: Set user attributes in RevenueCat for analytics
      try {
        await revenueCatService.setUserAttributes({
          'trial_activated_at': new Date().toISOString(),
          'trial_duration_days': trialDurationDays.toString(),
          'activation_source': 'onboarding'
        })
      } catch (attributeError) {
        console.warn('Failed to set RevenueCat user attributes:', attributeError)
        // Non-critical error, don't fail the whole operation
      }

      console.log('Trial activation completed successfully for user:', userId)

      return {
        success: true,
        trialActive: true,
        trialEndDate: revenueCatResult.trialEndDate || firestoreTrialInfo.endDate.toDate(),
        firestoreTrialInfo,
        revenueCatCustomerInfo: revenueCatResult.customerInfo
      }

    } catch (error) {
      console.error('Trial activation failed with unexpected error:', error)
      
      return {
        success: false,
        trialActive: false,
        error: {
          source: 'validation',
          message: error instanceof Error ? error.message : 'Unknown error during trial activation',
          retryable: true
        }
      }
    }
  }

  /**
   * Get comprehensive trial status from both RevenueCat and Firestore
   */
  async getTrialStatus(userId: string): Promise<TrialStatusInfo> {
    try {
      // Get status from both sources
      const [revenueCatStatus, firestoreTrialInfo] = await Promise.allSettled([
        revenueCatService.getSubscriptionStatus(userId),
        profileService.getTrialInfo(userId)
      ])

      let isActive = false
      let endDate: Date | undefined
      let daysRemaining = 0
      let source: TrialStatusInfo['source'] = 'firestore'
      let gamesLogged = 0
      let aiInsightsGenerated = 0
      let goalsCreated = 0
      let lastActivityAt: Date | undefined

      // Process Firestore data
      if (firestoreTrialInfo.status === 'fulfilled' && firestoreTrialInfo.value) {
        const trialInfo = firestoreTrialInfo.value
        isActive = trialInfo.status === 'active'
        endDate = trialInfo.endDate.toDate()
        gamesLogged = trialInfo.gamesLogged
        aiInsightsGenerated = trialInfo.aiInsightsGenerated
        goalsCreated = trialInfo.goalsCreated
        lastActivityAt = trialInfo.lastActivityAt.toDate()
      }

      // Process RevenueCat data (takes precedence for subscription status)
      if (revenueCatStatus.status === 'fulfilled') {
        const rcStatus = revenueCatStatus.value
        
        if (rcStatus.isTrialActive || rcStatus.isActive) {
          isActive = true
          source = firestoreTrialInfo.status === 'fulfilled' ? 'both' : 'revenuecat'
          
          // Use RevenueCat end date if available
          if (rcStatus.trialEndDate) {
            endDate = rcStatus.trialEndDate
          } else if (rcStatus.subscriptionEndDate) {
            endDate = rcStatus.subscriptionEndDate
          }
        }
      }

      // Calculate days remaining
      if (endDate) {
        const now = new Date()
        const diffTime = endDate.getTime() - now.getTime()
        daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)))
        
        // If days remaining is 0 but we thought it was active, mark as inactive
        if (daysRemaining === 0 && isActive) {
          isActive = false
        }
      }

      return {
        isActive,
        endDate,
        daysRemaining,
        source,
        gamesLogged,
        aiInsightsGenerated,
        goalsCreated,
        lastActivityAt
      }

    } catch (error) {
      console.error('Failed to get trial status:', error)
      
      // Return safe defaults
      return {
        isActive: false,
        endDate: undefined,
        daysRemaining: 0,
        source: 'firestore',
        gamesLogged: 0,
        aiInsightsGenerated: 0,
        goalsCreated: 0
      }
    }
  }

  /**
   * Update trial usage statistics
   */
  async updateTrialUsage(
    userId: string,
    updates: {
      gamesLogged?: number
      aiInsightsGenerated?: number
      goalsCreated?: number
    }
  ): Promise<boolean> {
    try {
      await profileService.updateTrialStatus(userId, 'active', {
        ...updates,
        lastActivityAt: Timestamp.now()
      })
      
      console.log('Trial usage updated for user:', userId, updates)
      return true
    } catch (error) {
      console.error('Failed to update trial usage:', error)
      return false
    }
  }

  /**
   * Cancel trial (mark as cancelled but don't revoke access until expiration)
   */
  async cancelTrial(userId: string, reason?: string): Promise<boolean> {
    try {
      // Update Firestore status
      await profileService.updateTrialStatus(userId, 'cancelled', {
        cancellationDate: Timestamp.now(),
        cancellationReason: reason
      })

      // Set RevenueCat attribute for analytics
      try {
        await revenueCatService.setUserAttributes({
          'trial_cancelled_at': new Date().toISOString(),
          'cancellation_reason': reason || 'user_initiated'
        })
      } catch (attributeError) {
        console.warn('Failed to set cancellation attributes in RevenueCat:', attributeError)
      }

      console.log('Trial cancelled for user:', userId, 'Reason:', reason)
      return true
    } catch (error) {
      console.error('Failed to cancel trial:', error)
      return false
    }
  }

  /**
   * Convert trial to paid subscription
   */
  async convertTrialToSubscription(
    userId: string,
    subscriptionProductId: string
  ): Promise<TrialManagementResult> {
    try {
      // Get available offerings
      const offerings = await revenueCatService.getOfferings()
      const currentOffering = offerings.find(o => o.identifier === 'current') || offerings[0]
      
      if (!currentOffering) {
        throw new Error('No offerings available for subscription')
      }

      // Find the package for the requested product
      const packageToPurchase = currentOffering.availablePackages.find(
        pkg => pkg.storeProduct.identifier === subscriptionProductId
      )

      if (!packageToPurchase) {
        throw new Error(`Package not found for product: ${subscriptionProductId}`)
      }

      // Purchase the subscription
      const purchaseResult = await revenueCatService.purchasePackage(packageToPurchase)

      if (!purchaseResult.success) {
        return {
          success: false,
          trialActive: false,
          error: {
            source: 'revenuecat',
            message: purchaseResult.error?.message || 'Subscription purchase failed',
            code: purchaseResult.error?.code,
            retryable: purchaseResult.error?.retryable || false
          }
        }
      }

      // Update Firestore trial status to converted
      await profileService.updateTrialStatus(userId, 'converted', {
        conversionDate: Timestamp.now()
      })

      console.log('Trial converted to subscription for user:', userId)

      return {
        success: true,
        trialActive: false, // No longer a trial
        revenueCatCustomerInfo: purchaseResult.customerInfo
      }

    } catch (error) {
      console.error('Failed to convert trial to subscription:', error)
      
      return {
        success: false,
        trialActive: false,
        error: {
          source: 'validation',
          message: error instanceof Error ? error.message : 'Unknown conversion error',
          retryable: true
        }
      }
    }
  }

  /**
   * Check if user is eligible for trial
   */
  async isEligibleForTrial(userId: string): Promise<boolean> {
    try {
      // Check Firestore for existing trial
      const firestoreTrialInfo = await profileService.getTrialInfo(userId)
      if (firestoreTrialInfo) {
        console.log('User already has trial record in Firestore')
        return false
      }

      // Check RevenueCat for existing subscriptions
      const revenueCatStatus = await revenueCatService.getSubscriptionStatus(userId)
      if (revenueCatStatus.isActive || revenueCatStatus.entitlements.length > 0) {
        console.log('User already has active RevenueCat entitlements')
        return false
      }

      return true
    } catch (error) {
      console.error('Failed to check trial eligibility:', error)
      // Default to eligible if we can't determine status
      return true
    }
  }

  /**
   * Extract transaction ID from RevenueCat customer info
   */
  private extractTransactionId(customerInfo: any): string | undefined {
    try {
      // Get the most recent transaction
      const transactions = customerInfo.nonSubscriptionTransactions || []
      if (transactions.length > 0) {
        return transactions[0].transactionIdentifier
      }

      // Check active entitlements for transaction info
      const activeEntitlements = Object.values(customerInfo.entitlements.active || {})
      if (activeEntitlements.length > 0) {
        const entitlement = activeEntitlements[0] as any
        return entitlement.latestPurchaseDate || entitlement.originalPurchaseDate
      }

      return undefined
    } catch (error) {
      console.warn('Failed to extract transaction ID:', error)
      return undefined
    }
  }

  /**
   * Sync trial status between RevenueCat and Firestore
   */
  async syncTrialStatus(userId: string): Promise<boolean> {
    try {
      const trialStatus = await this.getTrialStatus(userId)
      
      // Update Firestore with current status
      const firestoreStatus = trialStatus.isActive ? 'active' : 'expired'
      await profileService.updateTrialStatus(userId, firestoreStatus)
      
      console.log('Trial status synced for user:', userId, 'Status:', firestoreStatus)
      return true
    } catch (error) {
      console.error('Failed to sync trial status:', error)
      return false
    }
  }
}

// Export singleton instance
export const trialManagementService = TrialManagementService.getInstance()