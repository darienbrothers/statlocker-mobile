import { useState, useEffect } from 'react'
import { GuardianConsentService } from '../../services/GuardianConsentService'
import { useOnboardingStore } from '../../stores/onboardingStore'

export interface GuardianConsentState {
  isLoading: boolean
  consentId?: string
  consentSent: boolean
  consentStatus?: 'pending' | 'approved' | 'declined' | 'expired'
  error?: string
  expirationDate?: Date
}

/**
 * Hook for managing guardian consent workflow
 */
export const useGuardianConsent = () => {
  const { profile, updateProfile } = useOnboardingStore()
  const [state, setState] = useState<GuardianConsentState>({
    isLoading: false,
    consentSent: false
  })

  // Check if guardian consent is required
  const requiresGuardianConsent = (): boolean => {
    if (!profile.dateOfBirth) return false
    
    const age = calculateAge(profile.dateOfBirth)
    return age >= 13 && age <= 15
  }

  // Send guardian consent request
  const sendConsentRequest = async (): Promise<void> => {
    if (!profile.guardianEmail || !profile.dateOfBirth) {
      setState(prev => ({ 
        ...prev, 
        error: 'Guardian email and date of birth are required' 
      }))
      return
    }

    setState(prev => ({ ...prev, isLoading: true, error: undefined }))

    try {
      const childName = getChildName()
      const childAge = calculateAge(profile.dateOfBirth)
      
      const { consentId, expirationDate } = await GuardianConsentService.initiateConsentRequest(
        'temp-user-id', // Will be replaced with actual user ID after account creation
        profile.guardianEmail,
        childName,
        childAge
      )

      setState(prev => ({
        ...prev,
        isLoading: false,
        consentSent: true,
        consentId,
        consentStatus: 'pending',
        expirationDate
      }))

      // Update profile with consent tracking info
      updateProfile({
        consentTimestamp: new Date(),
        ageVerified: true
      })

    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to send consent request'
      }))
    }
  }

  // Check consent status
  const checkConsentStatus = async (userId?: string): Promise<void> => {
    if (!userId) return

    setState(prev => ({ ...prev, isLoading: true }))

    try {
      const status = await GuardianConsentService.getConsentStatus(userId)
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        consentStatus: status.granted ? 'approved' : 
                     status.expired ? 'expired' : 
                     status.pending ? 'pending' : 'declined'
      }))

    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to check consent status'
      }))
    }
  }

  // Resend consent request
  const resendConsentRequest = async (): Promise<void> => {
    setState(prev => ({ ...prev, consentSent: false, consentId: undefined }))
    await sendConsentRequest()
  }

  // Withdraw consent
  const withdrawConsent = async (userId: string, reason?: string): Promise<void> => {
    setState(prev => ({ ...prev, isLoading: true }))

    try {
      await GuardianConsentService.withdrawConsent(userId, reason)
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        consentStatus: 'declined'
      }))

      // Update profile
      updateProfile({
        guardianEmail: undefined,
        consentTimestamp: undefined,
        ageVerified: false
      })

    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to withdraw consent'
      }))
    }
  }

  // Get child name from profile (fallback to "your child")
  const getChildName = (): string => {
    // In a real implementation, this would come from the profile
    // For now, return a placeholder
    return 'your child'
  }

  // Calculate age from date of birth
  const calculateAge = (dateOfBirth: Date): number => {
    const today = new Date()
    const birthDate = new Date(dateOfBirth)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    
    return age
  }

  // Get consent portal URL
  const getConsentPortalUrl = (): string | undefined => {
    if (!state.consentId) return undefined
    return GuardianConsentService.generateConsentPortalUrl(state.consentId)
  }

  // Check if consent is expired
  const isConsentExpired = (): boolean => {
    if (!state.expirationDate) return false
    return new Date() > state.expirationDate
  }

  // Get days until expiration
  const getDaysUntilExpiration = (): number | undefined => {
    if (!state.expirationDate) return undefined
    
    const now = new Date()
    const expiration = new Date(state.expirationDate)
    const diffTime = expiration.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    return Math.max(0, diffDays)
  }

  return {
    // State
    ...state,
    requiresGuardianConsent: requiresGuardianConsent(),
    isConsentExpired: isConsentExpired(),
    daysUntilExpiration: getDaysUntilExpiration(),
    consentPortalUrl: getConsentPortalUrl(),
    
    // Actions
    sendConsentRequest,
    checkConsentStatus,
    resendConsentRequest,
    withdrawConsent,
    
    // Helpers
    clearError: () => setState(prev => ({ ...prev, error: undefined }))
  }
}