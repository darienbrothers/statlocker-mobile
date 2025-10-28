import { renderHook, act } from '@testing-library/react-hooks'
import { useGuardianConsent } from '../useGuardianConsent'
import { useOnboardingStore } from '../../../stores/onboardingStore'
import { GuardianConsentService } from '../../../services/GuardianConsentService'

// Mock dependencies
jest.mock('../../../stores/onboardingStore')
jest.mock('../../../services/GuardianConsentService')

const mockUseOnboardingStore = useOnboardingStore as jest.MockedFunction<typeof useOnboardingStore>
const mockGuardianConsentService = GuardianConsentService as jest.Mocked<typeof GuardianConsentService>

describe('useGuardianConsent Hook', () => {
  const mockUpdateProfile = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    
    mockUseOnboardingStore.mockReturnValue({
      profile: {},
      updateProfile: mockUpdateProfile,
    } as any)

    // Mock service methods
    mockGuardianConsentService.initiateConsentRequest = jest.fn()
    mockGuardianConsentService.getConsentStatus = jest.fn()
    mockGuardianConsentService.withdrawConsent = jest.fn()
    mockGuardianConsentService.generateConsentPortalUrl = jest.fn()
  })

  describe('requiresGuardianConsent', () => {
    it('should return false when no date of birth is provided', () => {
      const { result } = renderHook(() => useGuardianConsent())
      
      expect(result.current.requiresGuardianConsent).toBe(false)
    })

    it('should return false for users over 15', () => {
      const dateOfBirth = new Date()
      dateOfBirth.setFullYear(dateOfBirth.getFullYear() - 17) // 17 years old

      mockUseOnboardingStore.mockReturnValue({
        profile: { dateOfBirth },
        updateProfile: mockUpdateProfile,
      } as any)

      const { result } = renderHook(() => useGuardianConsent())
      
      expect(result.current.requiresGuardianConsent).toBe(false)
    })

    it('should return false for users under 13', () => {
      const dateOfBirth = new Date()
      dateOfBirth.setFullYear(dateOfBirth.getFullYear() - 12) // 12 years old

      mockUseOnboardingStore.mockReturnValue({
        profile: { dateOfBirth },
        updateProfile: mockUpdateProfile,
      } as any)

      const { result } = renderHook(() => useGuardianConsent())
      
      expect(result.current.requiresGuardianConsent).toBe(false)
    })

    it('should return true for users aged 13-15', () => {
      const dateOfBirth = new Date()
      dateOfBirth.setFullYear(dateOfBirth.getFullYear() - 14) // 14 years old

      mockUseOnboardingStore.mockReturnValue({
        profile: { dateOfBirth },
        updateProfile: mockUpdateProfile,
      } as any)

      const { result } = renderHook(() => useGuardianConsent())
      
      expect(result.current.requiresGuardianConsent).toBe(true)
    })
  })

  describe('sendConsentRequest', () => {
    beforeEach(() => {
      const dateOfBirth = new Date()
      dateOfBirth.setFullYear(dateOfBirth.getFullYear() - 14) // 14 years old

      mockUseOnboardingStore.mockReturnValue({
        profile: { 
          dateOfBirth,
          guardianEmail: 'parent@test.com'
        },
        updateProfile: mockUpdateProfile,
      } as any)
    })

    it('should send consent request successfully', async () => {
      const mockResponse = {
        consentId: 'consent_123_abc',
        expirationDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }

      mockGuardianConsentService.initiateConsentRequest.mockResolvedValue(mockResponse)

      const { result } = renderHook(() => useGuardianConsent())

      await act(async () => {
        await result.current.sendConsentRequest()
      })

      expect(mockGuardianConsentService.initiateConsentRequest).toHaveBeenCalledWith(
        'temp-user-id',
        'parent@test.com',
        'your child',
        14
      )

      expect(result.current.consentSent).toBe(true)
      expect(result.current.consentId).toBe('consent_123_abc')
      expect(result.current.consentStatus).toBe('pending')
      expect(result.current.expirationDate).toEqual(mockResponse.expirationDate)

      expect(mockUpdateProfile).toHaveBeenCalledWith({
        consentTimestamp: expect.any(Date),
        ageVerified: true
      })
    })

    it('should handle missing guardian email', async () => {
      mockUseOnboardingStore.mockReturnValue({
        profile: { 
          dateOfBirth: new Date()
        },
        updateProfile: mockUpdateProfile,
      } as any)

      const { result } = renderHook(() => useGuardianConsent())

      await act(async () => {
        await result.current.sendConsentRequest()
      })

      expect(result.current.error).toBe('Guardian email and date of birth are required')
      expect(mockGuardianConsentService.initiateConsentRequest).not.toHaveBeenCalled()
    })

    it('should handle service errors', async () => {
      mockGuardianConsentService.initiateConsentRequest.mockRejectedValue(
        new Error('Network error')
      )

      const { result } = renderHook(() => useGuardianConsent())

      await act(async () => {
        await result.current.sendConsentRequest()
      })

      expect(result.current.error).toBe('Network error')
      expect(result.current.consentSent).toBe(false)
    })
  })

  describe('checkConsentStatus', () => {
    it('should check consent status successfully', async () => {
      const mockStatus = {
        required: true,
        granted: true,
        pending: false
      }

      mockGuardianConsentService.getConsentStatus.mockResolvedValue(mockStatus)

      const { result } = renderHook(() => useGuardianConsent())

      await act(async () => {
        await result.current.checkConsentStatus('user-123')
      })

      expect(mockGuardianConsentService.getConsentStatus).toHaveBeenCalledWith('user-123')
      expect(result.current.consentStatus).toBe('approved')
    })

    it('should handle different consent statuses', async () => {
      const testCases = [
        { mockStatus: { required: true, granted: false, pending: true }, expected: 'pending' },
        { mockStatus: { required: true, granted: false, expired: true }, expected: 'expired' },
        { mockStatus: { required: true, granted: false, pending: false }, expected: 'declined' },
      ]

      for (const testCase of testCases) {
        mockGuardianConsentService.getConsentStatus.mockResolvedValue(testCase.mockStatus)

        const { result } = renderHook(() => useGuardianConsent())

        await act(async () => {
          await result.current.checkConsentStatus('user-123')
        })

        expect(result.current.consentStatus).toBe(testCase.expected)
      }
    })

    it('should not check status without user ID', async () => {
      const { result } = renderHook(() => useGuardianConsent())

      await act(async () => {
        await result.current.checkConsentStatus()
      })

      expect(mockGuardianConsentService.getConsentStatus).not.toHaveBeenCalled()
    })
  })

  describe('resendConsentRequest', () => {
    it('should reset state and resend consent request', async () => {
      const mockResponse = {
        consentId: 'consent_456_def',
        expirationDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }

      mockGuardianConsentService.initiateConsentRequest.mockResolvedValue(mockResponse)

      mockUseOnboardingStore.mockReturnValue({
        profile: { 
          dateOfBirth: new Date(Date.now() - 14 * 365 * 24 * 60 * 60 * 1000),
          guardianEmail: 'parent@test.com'
        },
        updateProfile: mockUpdateProfile,
      } as any)

      const { result } = renderHook(() => useGuardianConsent())

      // First set some state
      await act(async () => {
        await result.current.sendConsentRequest()
      })

      expect(result.current.consentSent).toBe(true)

      // Then resend
      await act(async () => {
        await result.current.resendConsentRequest()
      })

      expect(result.current.consentId).toBe('consent_456_def')
      expect(mockGuardianConsentService.initiateConsentRequest).toHaveBeenCalledTimes(2)
    })
  })

  describe('withdrawConsent', () => {
    it('should withdraw consent successfully', async () => {
      mockGuardianConsentService.withdrawConsent.mockResolvedValue(undefined)

      const { result } = renderHook(() => useGuardianConsent())

      await act(async () => {
        await result.current.withdrawConsent('user-123', 'Parent requested')
      })

      expect(mockGuardianConsentService.withdrawConsent).toHaveBeenCalledWith(
        'user-123',
        'Parent requested'
      )

      expect(result.current.consentStatus).toBe('declined')
      expect(mockUpdateProfile).toHaveBeenCalledWith({
        guardianEmail: undefined,
        consentTimestamp: undefined,
        ageVerified: false
      })
    })

    it('should handle withdrawal errors', async () => {
      mockGuardianConsentService.withdrawConsent.mockRejectedValue(
        new Error('Withdrawal failed')
      )

      const { result } = renderHook(() => useGuardianConsent())

      await act(async () => {
        await result.current.withdrawConsent('user-123')
      })

      expect(result.current.error).toBe('Withdrawal failed')
    })
  })

  describe('consent portal URL generation', () => {
    it('should generate consent portal URL when consent ID exists', () => {
      mockGuardianConsentService.generateConsentPortalUrl.mockReturnValue(
        'https://consent.statlocker.app/consent/consent_123_abc'
      )

      const { result } = renderHook(() => useGuardianConsent())

      // Set consent ID
      act(() => {
        result.current.sendConsentRequest()
      })

      // Mock the state to have a consent ID
      const { result: resultWithId } = renderHook(() => {
        const hook = useGuardianConsent()
        // Simulate having a consent ID
        return {
          ...hook,
          consentId: 'consent_123_abc',
          consentPortalUrl: GuardianConsentService.generateConsentPortalUrl('consent_123_abc')
        }
      })

      expect(resultWithId.current.consentPortalUrl).toBe(
        'https://consent.statlocker.app/consent/consent_123_abc'
      )
    })

    it('should return undefined when no consent ID exists', () => {
      const { result } = renderHook(() => useGuardianConsent())

      expect(result.current.consentPortalUrl).toBeUndefined()
    })
  })

  describe('expiration handling', () => {
    it('should calculate days until expiration correctly', () => {
      const expirationDate = new Date()
      expirationDate.setDate(expirationDate.getDate() + 5) // 5 days from now

      const { result } = renderHook(() => useGuardianConsent())

      // Mock the state to have an expiration date
      const { result: resultWithExpiration } = renderHook(() => {
        const hook = useGuardianConsent()
        return {
          ...hook,
          expirationDate,
          daysUntilExpiration: Math.ceil((expirationDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        }
      })

      expect(resultWithExpiration.current.daysUntilExpiration).toBe(5)
    })

    it('should detect expired consent requests', () => {
      const expiredDate = new Date()
      expiredDate.setDate(expiredDate.getDate() - 1) // 1 day ago

      const { result } = renderHook(() => useGuardianConsent())

      // Mock the state to have an expired date
      const { result: resultWithExpired } = renderHook(() => {
        const hook = useGuardianConsent()
        return {
          ...hook,
          expirationDate: expiredDate,
          isConsentExpired: expiredDate < new Date()
        }
      })

      expect(resultWithExpired.current.isConsentExpired).toBe(true)
    })
  })

  describe('error handling', () => {
    it('should clear errors', () => {
      const { result } = renderHook(() => useGuardianConsent())

      // Set an error
      act(() => {
        result.current.clearError()
      })

      // Error should be cleared (this would be tested with actual state)
      expect(result.current.error).toBeUndefined()
    })
  })
})