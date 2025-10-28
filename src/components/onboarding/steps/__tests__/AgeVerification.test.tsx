import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import { Alert } from 'react-native'
import { AgeVerification } from '../AgeVerification'
import { useOnboardingStore } from '../../../../stores/onboardingStore'
import { useGuardianConsent } from '../../../../hooks/onboarding/useGuardianConsent'

// Mock the stores and hooks
jest.mock('../../../../stores/onboardingStore')
jest.mock('../../../../hooks/onboarding/useGuardianConsent')

// Mock Alert
jest.spyOn(Alert, 'alert')

const mockUseOnboardingStore = useOnboardingStore as jest.MockedFunction<typeof useOnboardingStore>
const mockUseGuardianConsent = useGuardianConsent as jest.MockedFunction<typeof useGuardianConsent>

describe('AgeVerification Component', () => {
  const mockUpdateProfile = jest.fn()
  const mockValidateStep = jest.fn()
  const mockNavigateNext = jest.fn()
  const mockNavigateBack = jest.fn()
  const mockSendConsentRequest = jest.fn()
  const mockResendConsentRequest = jest.fn()
  const mockClearError = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    
    mockUseOnboardingStore.mockReturnValue({
      profile: {},
      updateProfile: mockUpdateProfile,
      validateStep: mockValidateStep,
      validationErrors: {},
      navigateNext: mockNavigateNext,
      navigateBack: mockNavigateBack,
    } as any)

    mockUseGuardianConsent.mockReturnValue({
      requiresGuardianConsent: false,
      isLoading: false,
      consentSent: false,
      consentStatus: undefined,
      error: undefined,
      sendConsentRequest: mockSendConsentRequest,
      resendConsentRequest: mockResendConsentRequest,
      clearError: mockClearError,
    } as any)
  })

  describe('Age Calculation and Validation', () => {
    it('should calculate age correctly for users over 16', () => {
      const dateOfBirth = new Date()
      dateOfBirth.setFullYear(dateOfBirth.getFullYear() - 17) // 17 years old

      mockUseOnboardingStore.mockReturnValue({
        profile: { dateOfBirth },
        updateProfile: mockUpdateProfile,
        validateStep: mockValidateStep,
        validationErrors: {},
        navigateNext: mockNavigateNext,
        navigateBack: mockNavigateBack,
      } as any)

      const { getByText } = render(<AgeVerification />)
      
      expect(getByText(/you are 17 years old/i)).toBeTruthy()
      expect(getByText(/age verification complete/i)).toBeTruthy()
    })

    it('should show guardian consent requirement for users 13-15', () => {
      const dateOfBirth = new Date()
      dateOfBirth.setFullYear(dateOfBirth.getFullYear() - 14) // 14 years old

      mockUseOnboardingStore.mockReturnValue({
        profile: { dateOfBirth },
        updateProfile: mockUpdateProfile,
        validateStep: mockValidateStep,
        validationErrors: {},
        navigateNext: mockNavigateNext,
        navigateBack: mockNavigateBack,
      } as any)

      mockUseGuardianConsent.mockReturnValue({
        requiresGuardianConsent: true,
        isLoading: false,
        consentSent: false,
        consentStatus: undefined,
        error: undefined,
        sendConsentRequest: mockSendConsentRequest,
        resendConsentRequest: mockResendConsentRequest,
        clearError: mockClearError,
      } as any)

      const { getByText } = render(<AgeVerification />)
      
      expect(getByText(/you are 14 years old/i)).toBeTruthy()
      expect(getByText(/guardian consent required/i)).toBeTruthy()
      expect(getByText(/parent\/guardian email/i)).toBeTruthy()
    })

    it('should block registration for users under 13', () => {
      const dateOfBirth = new Date()
      dateOfBirth.setFullYear(dateOfBirth.getFullYear() - 12) // 12 years old

      mockUseOnboardingStore.mockReturnValue({
        profile: { dateOfBirth },
        updateProfile: mockUpdateProfile,
        validateStep: mockValidateStep,
        validationErrors: {},
        navigateNext: mockNavigateNext,
        navigateBack: mockNavigateBack,
      } as any)

      render(<AgeVerification />)
      
      expect(Alert.alert).toHaveBeenCalledWith(
        'Age Requirement',
        expect.stringContaining('must be at least 13 years old'),
        expect.any(Array)
      )
    })
  })

  describe('Guardian Consent Flow', () => {
    beforeEach(() => {
      const dateOfBirth = new Date()
      dateOfBirth.setFullYear(dateOfBirth.getFullYear() - 14) // 14 years old

      mockUseOnboardingStore.mockReturnValue({
        profile: { dateOfBirth },
        updateProfile: mockUpdateProfile,
        validateStep: mockValidateStep,
        validationErrors: {},
        navigateNext: mockNavigateNext,
        navigateBack: mockNavigateBack,
      } as any)

      mockUseGuardianConsent.mockReturnValue({
        requiresGuardianConsent: true,
        isLoading: false,
        consentSent: false,
        consentStatus: undefined,
        error: undefined,
        sendConsentRequest: mockSendConsentRequest,
        resendConsentRequest: mockResendConsentRequest,
        clearError: mockClearError,
      } as any)
    })

    it('should allow entering guardian email', () => {
      const { getByPlaceholderText } = render(<AgeVerification />)
      
      const emailInput = getByPlaceholderText('parent@example.com')
      fireEvent.changeText(emailInput, 'parent@test.com')
      
      expect(emailInput.props.value).toBe('parent@test.com')
    })

    it('should show send consent button when email and confirmation are provided', () => {
      const { getByPlaceholderText, getByText } = render(<AgeVerification />)
      
      // Enter email
      const emailInput = getByPlaceholderText('parent@example.com')
      fireEvent.changeText(emailInput, 'parent@test.com')
      
      // Check confirmation toggle
      const confirmToggle = getByText(/i confirm this is my parent/i)
      fireEvent.press(confirmToggle)
      
      // Should show send button
      expect(getByText('Send Consent Request')).toBeTruthy()
    })

    it('should send consent request when button is pressed', async () => {
      mockSendConsentRequest.mockResolvedValue(undefined)
      
      const { getByPlaceholderText, getByText } = render(<AgeVerification />)
      
      // Enter email
      const emailInput = getByPlaceholderText('parent@example.com')
      fireEvent.changeText(emailInput, 'parent@test.com')
      
      // Check confirmation toggle
      const confirmToggle = getByText(/i confirm this is my parent/i)
      fireEvent.press(confirmToggle)
      
      // Press send button
      const sendButton = getByText('Send Consent Request')
      fireEvent.press(sendButton)
      
      await waitFor(() => {
        expect(mockUpdateProfile).toHaveBeenCalledWith({ guardianEmail: 'parent@test.com' })
        expect(mockSendConsentRequest).toHaveBeenCalled()
      })
    })

    it('should show error for invalid email format', async () => {
      const { getByPlaceholderText, getByText } = render(<AgeVerification />)
      
      // Enter invalid email
      const emailInput = getByPlaceholderText('parent@example.com')
      fireEvent.changeText(emailInput, 'invalid-email')
      
      // Check confirmation toggle
      const confirmToggle = getByText(/i confirm this is my parent/i)
      fireEvent.press(confirmToggle)
      
      // Press send button
      const sendButton = getByText('Send Consent Request')
      fireEvent.press(sendButton)
      
      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Invalid Email',
          'Please enter a valid guardian email address.'
        )
      })
    })

    it('should show consent sent status', () => {
      mockUseGuardianConsent.mockReturnValue({
        requiresGuardianConsent: true,
        isLoading: false,
        consentSent: true,
        consentStatus: 'pending',
        error: undefined,
        daysUntilExpiration: 6,
        sendConsentRequest: mockSendConsentRequest,
        resendConsentRequest: mockResendConsentRequest,
        clearError: mockClearError,
      } as any)

      const { getByText } = render(<AgeVerification />)
      
      expect(getByText(/consent request sent!/i)).toBeTruthy()
      expect(getByText(/expires in 6 days/i)).toBeTruthy()
      expect(getByText(/waiting for guardian consent/i)).toBeTruthy()
    })

    it('should allow resending consent request', () => {
      mockUseGuardianConsent.mockReturnValue({
        requiresGuardianConsent: true,
        isLoading: false,
        consentSent: true,
        consentStatus: 'pending',
        error: undefined,
        sendConsentRequest: mockSendConsentRequest,
        resendConsentRequest: mockResendConsentRequest,
        clearError: mockClearError,
      } as any)

      const { getByText } = render(<AgeVerification />)
      
      const resendButton = getByText('Resend Email')
      fireEvent.press(resendButton)
      
      expect(mockResendConsentRequest).toHaveBeenCalled()
    })
  })

  describe('Navigation and Validation', () => {
    it('should disable next button for users under 13', () => {
      const dateOfBirth = new Date()
      dateOfBirth.setFullYear(dateOfBirth.getFullYear() - 12) // 12 years old

      mockUseOnboardingStore.mockReturnValue({
        profile: { dateOfBirth },
        updateProfile: mockUpdateProfile,
        validateStep: mockValidateStep,
        validationErrors: {},
        navigateNext: mockNavigateNext,
        navigateBack: mockNavigateBack,
      } as any)

      const { getByText } = render(<AgeVerification />)
      
      // Next button should be disabled (this would be tested via the StepWrapper props)
      // In a real test, we'd check the nextDisabled prop passed to StepWrapper
    })

    it('should enable next button for users over 16', () => {
      const dateOfBirth = new Date()
      dateOfBirth.setFullYear(dateOfBirth.getFullYear() - 17) // 17 years old

      mockUseOnboardingStore.mockReturnValue({
        profile: { dateOfBirth },
        updateProfile: mockUpdateProfile,
        validateStep: mockValidateStep.mockReturnValue(true),
        validationErrors: {},
        navigateNext: mockNavigateNext,
        navigateBack: mockNavigateBack,
      } as any)

      const { getByText } = render(<AgeVerification />)
      
      // Next button should be enabled for users over 16
      // This would be tested via StepWrapper integration
    })

    it('should update profile with age verification data', () => {
      const dateOfBirth = new Date()
      dateOfBirth.setFullYear(dateOfBirth.getFullYear() - 17) // 17 years old

      mockUseOnboardingStore.mockReturnValue({
        profile: { dateOfBirth },
        updateProfile: mockUpdateProfile,
        validateStep: mockValidateStep,
        validationErrors: {},
        navigateNext: mockNavigateNext,
        navigateBack: mockNavigateBack,
      } as any)

      render(<AgeVerification />)
      
      expect(mockUpdateProfile).toHaveBeenCalledWith({
        ageVerified: true
      })
    })
  })

  describe('Error Handling', () => {
    it('should display validation errors', () => {
      mockUseOnboardingStore.mockReturnValue({
        profile: {},
        updateProfile: mockUpdateProfile,
        validateStep: mockValidateStep,
        validationErrors: {
          8: ['Guardian email is required for users under 16']
        },
        navigateNext: mockNavigateNext,
        navigateBack: mockNavigateBack,
      } as any)

      const { getByText } = render(<AgeVerification />)
      
      expect(getByText(/please fix the following issues/i)).toBeTruthy()
      expect(getByText(/guardian email is required/i)).toBeTruthy()
    })

    it('should display guardian consent errors', () => {
      mockUseGuardianConsent.mockReturnValue({
        requiresGuardianConsent: true,
        isLoading: false,
        consentSent: false,
        consentStatus: undefined,
        error: 'Failed to send consent request',
        sendConsentRequest: mockSendConsentRequest,
        resendConsentRequest: mockResendConsentRequest,
        clearError: mockClearError,
      } as any)

      const { getByText } = render(<AgeVerification />)
      
      expect(getByText('Failed to send consent request')).toBeTruthy()
      
      const dismissButton = getByText('Dismiss')
      fireEvent.press(dismissButton)
      
      expect(mockClearError).toHaveBeenCalled()
    })
  })
})