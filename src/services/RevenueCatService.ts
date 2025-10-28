/**
 * RevenueCat Service
 * 
 * Handles RevenueCat integration for trial activation, subscription management,
 * and purchase tracking with proper error handling and offline support
 */

import Purchases, {
  PurchasesOffering,
  PurchasesPackage,
  CustomerInfo,
  PurchasesError,
  LOG_LEVEL,
  PURCHASE_TYPE,
  ENTITLEMENT_VERIFICATION_MODE
} from 'react-native-purchases'
import { Platform } from 'react-native'
import Constants from 'expo-constants'

export interface TrialActivationResult {
  success: boolean
  customerInfo?: CustomerInfo
  trialActive?: boolean
  trialEndDate?: Date
  error?: RevenueCatError
  entitlements?: string[]
}

export interface SubscriptionStatus {
  isActive: boolean
  isTrialActive: boolean
  trialEndDate?: Date
  subscriptionEndDate?: Date
  productId?: string
  entitlements: string[]
  willRenew: boolean
}

export interface RevenueCatError {
  code: string
  message: string
  underlyingErrorMessage?: string
  retryable: boolean
}

export interface RevenueCatConfig {
  apiKey: string
  userId?: string
  enableDebugLogs?: boolean
  observerMode?: boolean
  entitlementVerificationMode?: ENTITLEMENT_VERIFICATION_MODE
}

export class RevenueCatService {
  private static instance: RevenueCatService
  private isConfigured = false
  private currentUserId?: string

  // Product IDs for different subscription tiers
  private readonly PRODUCT_IDS = {
    PRO_MONTHLY: 'statlocker_pro_monthly',
    PRO_ANNUAL: 'statlocker_pro_annual',
    ELITE_MONTHLY: 'statlocker_elite_monthly',
    ELITE_ANNUAL: 'statlocker_elite_annual'
  }

  // Entitlement IDs
  private readonly ENTITLEMENTS = {
    PRO: 'pro_features',
    ELITE: 'elite_features',
    TRIAL: 'trial_access'
  }

  private constructor() {}

  static getInstance(): RevenueCatService {
    if (!RevenueCatService.instance) {
      RevenueCatService.instance = new RevenueCatService()
    }
    return RevenueCatService.instance
  }

  /**
   * Configure RevenueCat with API keys and settings
   */
  async configure(config: RevenueCatConfig): Promise<void> {
    try {
      // Set log level for debugging
      if (config.enableDebugLogs) {
        Purchases.setLogLevel(LOG_LEVEL.DEBUG)
      } else {
        Purchases.setLogLevel(LOG_LEVEL.INFO)
      }

      // Configure RevenueCat
      await Purchases.configure({
        apiKey: config.apiKey,
        appUserID: config.userId,
        observerMode: config.observerMode || false,
        entitlementVerificationMode: config.entitlementVerificationMode || ENTITLEMENT_VERIFICATION_MODE.INFORMATIONAL
      })

      this.currentUserId = config.userId
      this.isConfigured = true

      console.log('RevenueCat configured successfully')
    } catch (error) {
      console.error('Failed to configure RevenueCat:', error)
      throw this.createRevenueCatError(error, 'configure')
    }
  }

  /**
   * Get RevenueCat configuration based on environment
   */
  private getRevenueCatConfig(): RevenueCatConfig {
    const env = Constants.expoConfig?.extra?.environment || 'development'
    
    // Get API key based on platform and environment
    let apiKey: string
    
    if (Platform.OS === 'ios') {
      switch (env) {
        case 'production':
          apiKey = process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY_PROD!
          break
        case 'staging':
          apiKey = process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY_STAGING!
          break
        default:
          apiKey = process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY_DEV!
      }
    } else {
      switch (env) {
        case 'production':
          apiKey = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY_PROD!
          break
        case 'staging':
          apiKey = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY_STAGING!
          break
        default:
          apiKey = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY_DEV!
      }
    }

    if (!apiKey) {
      throw new Error(`RevenueCat API key not found for ${Platform.OS} ${env}`)
    }

    return {
      apiKey,
      enableDebugLogs: env !== 'production',
      entitlementVerificationMode: env === 'production' 
        ? ENTITLEMENT_VERIFICATION_MODE.ENFORCED 
        : ENTITLEMENT_VERIFICATION_MODE.INFORMATIONAL
    }
  }

  /**
   * Initialize RevenueCat for a specific user
   */
  async initializeForUser(userId: string): Promise<void> {
    try {
      if (!this.isConfigured) {
        const config = this.getRevenueCatConfig()
        config.userId = userId
        await this.configure(config)
      } else if (this.currentUserId !== userId) {
        // Switch to new user
        await Purchases.logIn(userId)
        this.currentUserId = userId
      }

      console.log('RevenueCat initialized for user:', userId)
    } catch (error) {
      console.error('Failed to initialize RevenueCat for user:', error)
      throw this.createRevenueCatError(error, 'initializeForUser')
    }
  }

  /**
   * Activate 7-day trial for new user
   */
  async activateTrial(userId: string): Promise<TrialActivationResult> {
    try {
      // Initialize RevenueCat for user
      await this.initializeForUser(userId)

      // Get current customer info to check if trial is already active
      const customerInfo = await Purchases.getCustomerInfo()
      
      // Check if user already has active entitlements
      const hasActiveEntitlements = Object.keys(customerInfo.entitlements.active).length > 0
      
      if (hasActiveEntitlements) {
        console.log('User already has active entitlements')
        return {
          success: true,
          customerInfo,
          trialActive: this.isTrialActive(customerInfo),
          trialEndDate: this.getTrialEndDate(customerInfo),
          entitlements: Object.keys(customerInfo.entitlements.active)
        }
      }

      // Get available offerings
      const offerings = await Purchases.getOfferings()
      const currentOffering = offerings.current
      
      if (!currentOffering) {
        throw new Error('No current offering available')
      }

      // Look for trial package (usually the first package in the offering)
      const trialPackage = currentOffering.availablePackages.find(pkg => 
        pkg.packageType === PURCHASE_TYPE.UNKNOWN || 
        pkg.storeProduct.introPrice !== null
      ) || currentOffering.availablePackages[0]

      if (!trialPackage) {
        throw new Error('No trial package available')
      }

      // Purchase the trial package
      const { customerInfo: updatedCustomerInfo } = await Purchases.purchasePackage(trialPackage)

      const trialActive = this.isTrialActive(updatedCustomerInfo)
      const trialEndDate = this.getTrialEndDate(updatedCustomerInfo)

      console.log('Trial activated successfully for user:', userId)

      return {
        success: true,
        customerInfo: updatedCustomerInfo,
        trialActive,
        trialEndDate,
        entitlements: Object.keys(updatedCustomerInfo.entitlements.active)
      }

    } catch (error) {
      console.error('Failed to activate trial:', error)
      
      const revenueCatError = this.createRevenueCatError(error, 'activateTrial')
      
      return {
        success: false,
        error: revenueCatError
      }
    }
  }

  /**
   * Get current subscription status for user
   */
  async getSubscriptionStatus(userId?: string): Promise<SubscriptionStatus> {
    try {
      if (userId && userId !== this.currentUserId) {
        await this.initializeForUser(userId)
      }

      const customerInfo = await Purchases.getCustomerInfo()
      
      const activeEntitlements = Object.keys(customerInfo.entitlements.active)
      const isActive = activeEntitlements.length > 0
      const isTrialActive = this.isTrialActive(customerInfo)
      
      let subscriptionEndDate: Date | undefined
      let productId: string | undefined
      let willRenew = false

      // Get subscription details from active entitlements
      if (isActive) {
        const activeEntitlement = Object.values(customerInfo.entitlements.active)[0]
        if (activeEntitlement) {
          subscriptionEndDate = new Date(activeEntitlement.expirationDate!)
          productId = activeEntitlement.productIdentifier
          willRenew = activeEntitlement.willRenew
        }
      }

      return {
        isActive,
        isTrialActive,
        trialEndDate: this.getTrialEndDate(customerInfo),
        subscriptionEndDate,
        productId,
        entitlements: activeEntitlements,
        willRenew
      }

    } catch (error) {
      console.error('Failed to get subscription status:', error)
      
      // Return default status on error
      return {
        isActive: false,
        isTrialActive: false,
        entitlements: [],
        willRenew: false
      }
    }
  }

  /**
   * Check if trial is currently active
   */
  private isTrialActive(customerInfo: CustomerInfo): boolean {
    const trialEntitlement = customerInfo.entitlements.active[this.ENTITLEMENTS.TRIAL] ||
                            customerInfo.entitlements.active[this.ENTITLEMENTS.PRO]
    
    if (!trialEntitlement) return false
    
    // Check if it's actually a trial (not a paid subscription)
    return trialEntitlement.periodType === 'trial' || 
           (trialEntitlement.isActive && !trialEntitlement.willRenew)
  }

  /**
   * Get trial end date from customer info
   */
  private getTrialEndDate(customerInfo: CustomerInfo): Date | undefined {
    const trialEntitlement = customerInfo.entitlements.active[this.ENTITLEMENTS.TRIAL] ||
                            customerInfo.entitlements.active[this.ENTITLEMENTS.PRO]
    
    if (trialEntitlement && trialEntitlement.expirationDate) {
      return new Date(trialEntitlement.expirationDate)
    }
    
    return undefined
  }

  /**
   * Get available offerings and packages
   */
  async getOfferings(): Promise<PurchasesOffering[]> {
    try {
      const offerings = await Purchases.getOfferings()
      return Object.values(offerings.all)
    } catch (error) {
      console.error('Failed to get offerings:', error)
      throw this.createRevenueCatError(error, 'getOfferings')
    }
  }

  /**
   * Purchase a specific package
   */
  async purchasePackage(packageToPurchase: PurchasesPackage): Promise<{
    customerInfo: CustomerInfo
    success: boolean
    error?: RevenueCatError
  }> {
    try {
      const { customerInfo } = await Purchases.purchasePackage(packageToPurchase)
      
      console.log('Package purchased successfully:', packageToPurchase.identifier)
      
      return {
        customerInfo,
        success: true
      }
    } catch (error) {
      console.error('Failed to purchase package:', error)
      
      return {
        customerInfo: await Purchases.getCustomerInfo(),
        success: false,
        error: this.createRevenueCatError(error, 'purchasePackage')
      }
    }
  }

  /**
   * Restore purchases for current user
   */
  async restorePurchases(): Promise<{
    customerInfo: CustomerInfo
    success: boolean
    error?: RevenueCatError
  }> {
    try {
      const customerInfo = await Purchases.restorePurchases()
      
      console.log('Purchases restored successfully')
      
      return {
        customerInfo,
        success: true
      }
    } catch (error) {
      console.error('Failed to restore purchases:', error)
      
      return {
        customerInfo: await Purchases.getCustomerInfo(),
        success: false,
        error: this.createRevenueCatError(error, 'restorePurchases')
      }
    }
  }

  /**
   * Log out current user
   */
  async logOut(): Promise<void> {
    try {
      await Purchases.logOut()
      this.currentUserId = undefined
      console.log('RevenueCat user logged out')
    } catch (error) {
      console.error('Failed to log out RevenueCat user:', error)
      throw this.createRevenueCatError(error, 'logOut')
    }
  }

  /**
   * Set user attributes for analytics and targeting
   */
  async setUserAttributes(attributes: Record<string, string | null>): Promise<void> {
    try {
      await Purchases.setAttributes(attributes)
      console.log('User attributes set successfully')
    } catch (error) {
      console.error('Failed to set user attributes:', error)
      throw this.createRevenueCatError(error, 'setUserAttributes')
    }
  }

  /**
   * Create standardized RevenueCat error
   */
  private createRevenueCatError(error: any, operation: string): RevenueCatError {
    const purchasesError = error as PurchasesError
    
    return {
      code: purchasesError?.code || 'unknown',
      message: purchasesError?.message || 'Unknown RevenueCat error',
      underlyingErrorMessage: purchasesError?.underlyingErrorMessage,
      retryable: this.isRetryableError(purchasesError)
    }
  }

  /**
   * Check if RevenueCat error is retryable
   */
  private isRetryableError(error: PurchasesError): boolean {
    if (!error?.code) return false
    
    const retryableCodes = [
      'NETWORK_ERROR',
      'UNKNOWN_ERROR',
      'STORE_PROBLEM',
      'CONFIGURATION_ERROR'
    ]
    
    return retryableCodes.includes(error.code)
  }

  /**
   * Get product IDs for different subscription tiers
   */
  getProductIds() {
    return this.PRODUCT_IDS
  }

  /**
   * Get entitlement IDs
   */
  getEntitlements() {
    return this.ENTITLEMENTS
  }

  /**
   * Check if user has specific entitlement
   */
  async hasEntitlement(entitlementId: string, userId?: string): Promise<boolean> {
    try {
      if (userId && userId !== this.currentUserId) {
        await this.initializeForUser(userId)
      }

      const customerInfo = await Purchases.getCustomerInfo()
      return customerInfo.entitlements.active[entitlementId]?.isActive || false
    } catch (error) {
      console.error('Failed to check entitlement:', error)
      return false
    }
  }

  /**
   * Get days remaining in trial
   */
  async getTrialDaysRemaining(userId?: string): Promise<number> {
    try {
      const status = await this.getSubscriptionStatus(userId)
      
      if (!status.isTrialActive || !status.trialEndDate) {
        return 0
      }

      const now = new Date()
      const endDate = status.trialEndDate
      const diffTime = endDate.getTime() - now.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      
      return Math.max(0, diffDays)
    } catch (error) {
      console.error('Failed to get trial days remaining:', error)
      return 0
    }
  }
}

// Export singleton instance
export const revenueCatService = RevenueCatService.getInstance()