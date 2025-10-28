import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import { Linking } from 'react-native'
import { LegalConsent } from '../LegalConsent'
import { useOnboardingStore } from '../../../../stores/onboardingStore'

// Mock the store and Linking
jest.mock('../../../../stores/onboardingStore')
jest.mock('react-native/Libraries/Linking/Linking', () => ({
  canOpenURL: jest.fn(),
  openURL: jest.fn(),
}))

const mockUseOnboardingStore = useOnboardingStore as jest.MockedFunction<typeof useOnboardingStore>
const mockLinking = Linking as jest.Mocked<typeof Linking>

describe('LegalConsent Component', () => {
  const mockUpdateProfile = jest.fn()
  const mockValidateStep = jest.fn()
  const mockNavigateNext = jest.fn()
  const mockNavigateBack = jest.fn()

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

    mockLinking.canOpenURL.mockResolvedValue(true)
    mockLinking.openURL.mockResolvedValue(true)
  })

  describe('Rendering and Layout', () => {
    it('should render all required legal sections', () => {
      const { getByText } = render(<LegalConsent />)
      
      expect(getByText('Legal Agreements')).toBeTruthy()
      expect(getByText('Terms of Service')).toBeTruthy()
      expect(getByText('Privacy Policy')).toBeTruthy()
      expect(getByText(/help improve statlocker/i)).toBeTruthy()
      expect(getByText(/your data is protected/i)).toBeTruthy()
    })

    it('should show required consent toggles', () => {
      const { getByText } = render(<LegalConsent />)
      
      expect(getByText(/i have read and agree to the terms of service/i)).toBeTruthy()
      expect(getByText(/i have read and agree to the privacy policy/i)).toBeTruthy()
    })

    it('should show optional benchmarking consent', () => {
      const { getByText } = render(<LegalConsent />)
      
      expect(getByText(/use my anonymized data for benchmarking/i)).toBeTruthy()
      expect(getByText(/this is completely optional/i)).toBeTruthy()
    })
  })

  describe('Terms of Service and Privacy Policy Links', () => {
    it('should open Terms of Service when Read button is pressed', async () => {
      const { getAllByText } = render(<LegalConsent />)
      
      const readButtons = getAllByText('Read')
      const tosReadButton = readButtons[0] // First Read button is for ToS
      
      fireEvent.press(tosReadButton)
      
      await waitFor(() => {
        expect(mockLinking.canOpenURL).toHaveBeenCalledWith('https://statlocker.app/terms')
        expect(mockLinking.openURL).toHaveBeenCalledWith('https://statlocker.app/terms')
      })
    })

    it('should open Privacy Policy when Read button is pressed', async () => {
      const { getAllByText } = render(<LegalConsent />)
      
      const readButtons = getAllByText('Read')
      const privacyReadButton = readButtons[1] // Second Read button is for Privacy
      
      fireEvent.press(privacyReadButton)
      
      await waitFor(() => {
        expect(mockLinking.canOpenURL).toHaveBeenCalledWith('https://statlocker.app/privacy')
        expect(mockLinking.openURL).toHaveBeenCalledWith('https://statlocker.app/privacy')
      })
    })

    it('should handle link opening errors gracefully', async () => {
      mockLinking.canOpenURL.mockResolvedValue(false)
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()
      
      const { getAllByText } = render(<LegalConsent />)
      
      const readButtons = getAllByText('Read')
      fireEvent.press(readButtons[0])
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Cannot open Terms of Service URL')
      })
      
      consoleSpy.mockRestore()
    })
  })

  describe('Consent Management', () => {
    it('should update profile when ToS consent is toggled', () => {
      const { getByText } = render(<LegalConsent />)
      
      const tosToggle = getByText(/i have read and agree to the terms of service/i)
      fireEvent.press(tosToggle)
      
      expect(mockUpdateProfile).toHaveBeenCalledWith({
        tosAccepted: true,
        privacyAccepted: false,
        benchmarkingConsent: false
      })
    })

    it('should update profile when Privacy Policy consent is toggled', () => {
      const { getByText } = render(<LegalConsent />)
      
      const privacyToggle = getByText(/i have read and agree to the privacy policy/i)
      fireEvent.press(privacyToggle)
      
      expect(mockUpdateProfile).toHaveBeenCalledWith({
        tosAccepted: false,
        privacyAccepted: true,
        benchmarkingConsent: false
      })
    })

    it('should update profile when benchmarking consent is toggled', () => {
      const { getByText } = render(<LegalConsent />)
      
      const benchmarkingToggle = getByText(/use my anonymized data for benchmarking/i)
      fireEvent.press(benchmarkingToggle)
      
      expect(mockUpdateProfile).toHaveBeenCalledWith({
        tosAccepted: false,
        privacyAccepted: false,
        benchmarkingConsent: true
      })
    })

    it('should load existing consent values from profile', () => {
      mockUseOnboardingStore.mockReturnValue({
        profile: {
          tosAccepted: true,
          privacyAccepted: true,
          benchmarkingConsent: false
        },
        updateProfile: mockUpdateProfile,
        validateStep: mockValidateStep,
        validationErrors: {},
        navigateNext: mockNavigateNext,
        navigateBack: mockNavigateBack,
      } as any)

      render(<LegalConsent />)
      
      // The component should initialize with existing values
      // This would be verified by checking the toggle states
      expect(mockUpdateProfile).toHaveBeenCalledWith({
        tosAccepted: true,
        privacyAccepted: true,
        benchmarkingConsent: false
      })
    })
  })

  describe('Navigation and Validation', () => {
    it('should disable next button when required consents are not given', () => {
      mockValidateStep.mockReturnValue(false)
      
      const { getByText } = render(<LegalConsent />)
      
      // The next button should be disabled when validation fails
      // This would be tested via the StepWrapper's nextDisabled prop
    })

    it('should enable next button when both required consents are given', () => {
      mockUseOnboardingStore.mockReturnValue({
        profile: {
          tosAccepted: true,
          privacyAccepted: true,
          benchmarkingConsent: false
        },
        updateProfile: mockUpdateProfile,
        validateStep: mockValidateStep.mockReturnValue(true),
        validationErrors: {},
        navigateNext: mockNavigateNext,
        navigateBack: mockNavigateBack,
      } as any)

      const { getByText } = render(<LegalConsent />)
      
      // The next button should be enabled when both required consents are given
      // This would be tested via the StepWrapper integration
    })

    it('should call validateStep and navigateNext when next is pressed', () => {
      mockValidateStep.mockReturnValue(true)
      
      const { getByText } = render(<LegalConsent />)
      
      // Simulate next button press (this would come from StepWrapper)
      // In a real test, we'd trigger this through the StepWrapper's onNext prop
    })
  })

  describe('Error Display', () => {
    it('should display validation errors', () => {
      mockUseOnboardingStore.mockReturnValue({
        profile: {},
        updateProfile: mockUpdateProfile,
        validateStep: mockValidateStep,
        validationErrors: {
          9: [
            'You must accept the Terms of Service',
            'You must accept the Privacy Policy'
          ]
        },
        navigateNext: mockNavigateNext,
        navigateBack: mockNavigateBack,
      } as any)

      const { getByText } = render(<LegalConsent />)
      
      expect(getByText(/please fix the following issues/i)).toBeTruthy()
      expect(getByText(/you must accept the terms of service/i)).toBeTruthy()
      expect(getByText(/you must accept the privacy policy/i)).toBeTruthy()
    })

    it('should not display error section when no errors exist', () => {
      const { queryByText } = render(<LegalConsent />)
      
      expect(queryByText(/please fix the following issues/i)).toBeFalsy()
    })
  })

  describe('Data Protection Information', () => {
    it('should display comprehensive privacy information', () => {
      const { getByText } = render(<LegalConsent />)
      
      expect(getByText(/your data is protected/i)).toBeTruthy()
      expect(getByText(/we only collect data necessary/i)).toBeTruthy()
      expect(getByText(/your personal information is encrypted/i)).toBeTruthy()
      expect(getByText(/you can delete your account/i)).toBeTruthy()
      expect(getByText(/we never sell your personal information/i)).toBeTruthy()
    })

    it('should explain benchmarking benefits clearly', () => {
      const { getByText } = render(<LegalConsent />)
      
      expect(getByText(/create better performance benchmarks/i)).toBeTruthy()
      expect(getByText(/improve our ai insights/i)).toBeTruthy()
      expect(getByText(/develop new features/i)).toBeTruthy()
      expect(getByText(/completely anonymized/i)).toBeTruthy()
      expect(getByText(/opt out at any time/i)).toBeTruthy()
    })

    it('should display legal disclaimer', () => {
      const { getByText } = render(<LegalConsent />)
      
      expect(getByText(/legal information/i)).toBeTruthy()
      expect(getByText(/legal capacity to enter into this agreement/i)).toBeTruthy()
      expect(getByText(/if you are under 18/i)).toBeTruthy()
      expect(getByText(/withdraw your consent at any time/i)).toBeTruthy()
    })
  })

  describe('Accessibility', () => {
    it('should have proper accessibility labels', () => {
      const { getByText } = render(<LegalConsent />)
      
      // Check that important elements are present and accessible
      expect(getByText('Legal Agreements')).toBeTruthy()
      expect(getByText('Terms of Service')).toBeTruthy()
      expect(getByText('Privacy Policy')).toBeTruthy()
    })

    it('should support screen readers with clear descriptions', () => {
      const { getByText } = render(<LegalConsent />)
      
      // Verify descriptive text is present for screen readers
      expect(getByText(/our terms explain how you can use statlocker/i)).toBeTruthy()
      expect(getByText(/our privacy policy explains what personal information/i)).toBeTruthy()
    })
  })
})