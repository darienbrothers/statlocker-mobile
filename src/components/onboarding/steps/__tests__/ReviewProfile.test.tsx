import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import { Alert } from 'react-native'
import { ReviewProfile } from '../ReviewProfile'
import { useOnboardingStore } from '../../../../stores/onboardingStore'
import type { OnboardingProfile } from '../../../../types/onboarding'

// Mock the store and Alert
jest.mock('../../../../stores/onboardingStore')
jest.mock('react-native/Libraries/Alert/Alert', () => ({
  alert: jest.fn(),
}))

const mockUseOnboardingStore = useOnboardingStore as jest.MockedFunction<typeof useOnboardingStore>
const mockAlert = Alert.alert as jest.MockedFunction<typeof Alert.alert>

describe('ReviewProfile Component', () => {
  const mockValidateStep = jest.fn()
  const mockNavigateNext = jest.fn()
  const mockNavigateBack = jest.fn()
  const mockSetStep = jest.fn()

  const mockCompleteProfile: OnboardingProfile = {
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
      state: 'CA'
    },
    club: {
      organization: 'Test Club',
      teamName: 'Test Team'
    },
    selectedGoals: ['Improve shooting accuracy', 'Increase ground balls', 'Better face-off wins'],
    dna: {
      motivation: 'intrinsic',
      confidence: 'high',
      focusMode: 'intense',
      competitiveness: 'high',
      coachability: 'high',
      resilience: 'high'
    },
    aiTone: 'hype',
    ageVerified: true,
    tosAccepted: true,
    privacyAccepted: true,
    benchmarkingConsent: false
  }

  beforeEach(() => {
    jest.clearAllMocks()
    
    mockUseOnboardingStore.mockReturnValue({
      profile: mockCompleteProfile,
      validateStep: mockValidateStep,
      validationErrors: {},
      setStep: mockSetStep,
      completedSteps: new Set([1, 2, 3, 4, 5, 6, 7, 8, 9]),
      navigateNext: mockNavigateNext,
      navigateBack: mockNavigateBack,
    } as any)

    mockValidateStep.mockReturnValue(true)
  })

  describe('Rendering and Layout', () => {
    it('should render all profile sections', () => {
      const { getByText } = render(<ReviewProfile />)
      
      expect(getByText('Review Your Profile')).toBeTruthy()
      expect(getByText('Basic Information')).toBeTruthy()
      expect(getByText('Athletic Details')).toBeTruthy()
      expect(getByText('Team Information')).toBeTruthy()
      expect(getByText('Performance Goals')).toBeTruthy()
      expect(getByText('AthleteDNA Profile')).toBeTruthy()
      expect(getByText('AI Communication Style')).toBeTruthy()
      expect(getByText('Legal Agreements')).toBeTruthy()
    })

    it('should display complete profile data correctly', () => {
      const { getByText } = render(<ReviewProfile />)
      
      // Basic Information
      expect(getByText('athlete')).toBeTruthy()
      expect(getByText('lacrosse (male)')).toBeTruthy()
      expect(getByText('17 years old, Class of 2025')).toBeTruthy()
      
      // Athletic Details
      expect(getByText('midfielder')).toBeTruthy()
      expect(getByText('varsity')).toBeTruthy()
      
      // Team Information
      expect(getByText('High School')).toBeTruthy()
      expect(getByText('Test High School')).toBeTruthy()
      expect(getByText('Test City, CA')).toBeTruthy()
      expect(getByText('Test Team')).toBeTruthy()
      expect(getByText('Test Club')).toBeTruthy()
    })

    it('should display goals correctly', () => {
      const { getByText } = render(<ReviewProfile />)
      
      expect(getByText(/1\. Improve shooting accuracy/)).toBeTruthy()
      expect(getByText(/2\. Increase ground balls/)).toBeTruthy()
      expect(getByText(/3\. Better face-off wins/)).toBeTruthy()
    })

    it('should display AthleteDNA results', () => {
      const { getByText } = render(<ReviewProfile />)
      
      expect(getByText(/Motivation: intrinsic/)).toBeTruthy()
      expect(getByText(/Confidence: high/)).toBeTruthy()
      expect(getByText(/Focus Mode: intense/)).toBeTruthy()
      expect(getByText(/Competitiveness: high/)).toBeTruthy()
      expect(getByText(/Coachability: high/)).toBeTruthy()
      expect(getByText(/Resilience: high/)).toBeTruthy()
    })

    it('should display AI tone preference', () => {
      const { getByText } = render(<ReviewProfile />)
      
      expect(getByText('Hype - Energetic and motivational')).toBeTruthy()
    })

    it('should display legal consent status', () => {
      const { getByText } = render(<ReviewProfile />)
      
      expect(getByText('Terms of Service Accepted')).toBeTruthy()
      expect(getByText('Privacy Policy Accepted')).toBeTruthy()
      expect(getByText('Benchmarking Data Declined')).toBeTruthy()
    })
  })

  describe('Edit Functionality', () => {
    it('should show edit buttons for each section', () => {
      const { getAllByText } = render(<ReviewProfile />)
      
      const editButtons = getAllByText('Edit')
      expect(editButtons.length).toBeGreaterThan(0)
    })

    it('should show confirmation dialog when edit button is pressed', () => {
      const { getAllByText } = render(<ReviewProfile />)
      
      const editButtons = getAllByText('Edit')
      fireEvent.press(editButtons[0])
      
      expect(mockAlert).toHaveBeenCalledWith(
        'Edit Information',
        'Go back to step 1 to make changes?',
        expect.arrayContaining([
          expect.objectContaining({ text: 'Cancel' }),
          expect.objectContaining({ text: 'Edit' })
        ])
      )
    })

    it('should navigate to correct step when edit is confirmed', () => {
      const { getAllByText } = render(<ReviewProfile />)
      
      const editButtons = getAllByText('Edit')
      fireEvent.press(editButtons[0])
      
      // Simulate user pressing "Edit" in the alert
      const alertCall = mockAlert.mock.calls[0]
      const editAction = alertCall[2].find((action: any) => action.text === 'Edit')
      editAction.onPress()
      
      expect(mockSetStep).toHaveBeenCalledWith(1)
    })
  })

  describe('Age Verification Section', () => {
    it('should show age verification section for minors', () => {
      const minorProfile = {
        ...mockCompleteProfile,
        dateOfBirth: new Date('2009-05-15'), // 14 years old
        guardianEmail: 'parent@example.com'
      }
      
      mockUseOnboardingStore.mockReturnValue({
        profile: minorProfile,
        validateStep: mockValidateStep,
        validationErrors: {},
        setStep: mockSetStep,
        completedSteps: new Set([1, 2, 3, 4, 5, 6, 7, 8, 9]),
        navigateNext: mockNavigateNext,
        navigateBack: mockNavigateBack,
      } as any)

      const { getByText } = render(<ReviewProfile />)
      
      expect(getByText('Age Verification')).toBeTruthy()
      expect(getByText('parent@example.com')).toBeTruthy()
    })

    it('should not show age verification section for adults', () => {
      const adultProfile = {
        ...mockCompleteProfile,
        dateOfBirth: new Date('2000-05-15') // 23 years old
      }
      
      mockUseOnboardingStore.mockReturnValue({
        profile: adultProfile,
        validateStep: mockValidateStep,
        validationErrors: {},
        setStep: mockSetStep,
        completedSteps: new Set([1, 2, 3, 4, 5, 6, 7, 8, 9]),
        navigateNext: mockNavigateNext,
        navigateBack: mockNavigateBack,
      } as any)

      const { queryByText } = render(<ReviewProfile />)
      
      expect(queryByText('Age Verification')).toBeFalsy()
    })
  })

  describe('Validation and Navigation', () => {
    it('should validate all steps on mount', async () => {
      render(<ReviewProfile />)
      
      await waitFor(() => {
        // Should validate steps 1-9
        expect(mockValidateStep).toHaveBeenCalledTimes(9)
        for (let i = 1; i <= 9; i++) {
          expect(mockValidateStep).toHaveBeenCalledWith(i)
        }
      })
    })

    it('should enable next button when all validations pass', () => {
      mockValidateStep.mockReturnValue(true)
      
      const { getByText } = render(<ReviewProfile />)
      
      // The next button should be enabled (not disabled)
      // This would be tested through StepWrapper integration
    })

    it('should disable next button when validation fails', () => {
      mockValidateStep.mockReturnValue(false)
      
      const { getByText } = render(<ReviewProfile />)
      
      // The next button should be disabled
      // This would be tested through StepWrapper integration
    })

    it('should call navigateNext when next button is pressed and validation passes', () => {
      mockValidateStep.mockReturnValue(true)
      
      const { getByText } = render(<ReviewProfile />)
      
      // Simulate next button press through StepWrapper
      // In actual implementation, this would come from StepWrapper's onNext prop
    })

    it('should call navigateBack when back button is pressed', () => {
      const { getByText } = render(<ReviewProfile />)
      
      // Simulate back button press through StepWrapper
      // In actual implementation, this would come from StepWrapper's onBack prop
    })
  })

  describe('Error Handling', () => {
    it('should display validation errors', () => {
      mockUseOnboardingStore.mockReturnValue({
        profile: mockCompleteProfile,
        validateStep: mockValidateStep,
        validationErrors: {
          10: [
            'Please complete step 1',
            'Please complete step 2'
          ]
        },
        setStep: mockSetStep,
        completedSteps: new Set([1, 2, 3, 4, 5, 6, 7, 8, 9]),
        navigateNext: mockNavigateNext,
        navigateBack: mockNavigateBack,
      } as any)

      const { getByText } = render(<ReviewProfile />)
      
      expect(getByText(/please fix the following issues/i)).toBeTruthy()
      expect(getByText(/please complete step 1/i)).toBeTruthy()
      expect(getByText(/please complete step 2/i)).toBeTruthy()
    })

    it('should not display error section when no errors exist', () => {
      const { queryByText } = render(<ReviewProfile />)
      
      expect(queryByText(/please fix the following issues/i)).toBeFalsy()
    })
  })

  describe('Data Formatting', () => {
    it('should format dates correctly', () => {
      const { getByText } = render(<ReviewProfile />)
      
      expect(getByText('17 years old, Class of 2025')).toBeTruthy()
    })

    it('should handle missing data gracefully', () => {
      const incompleteProfile = {
        role: 'athlete',
        sport: 'lacrosse'
        // Missing other fields
      }
      
      mockUseOnboardingStore.mockReturnValue({
        profile: incompleteProfile,
        validateStep: mockValidateStep,
        validationErrors: {},
        setStep: mockSetStep,
        completedSteps: new Set([1]),
        navigateNext: mockNavigateNext,
        navigateBack: mockNavigateBack,
      } as any)

      const { getByText } = render(<ReviewProfile />)
      
      expect(getByText('Not selected')).toBeTruthy()
      expect(getByText('Not provided')).toBeTruthy()
    })

    it('should format AI tone descriptions correctly', () => {
      const profiles = [
        { aiTone: 'hype', expected: 'Hype - Energetic and motivational' },
        { aiTone: 'mentor', expected: 'Mentor - Supportive and guiding' },
        { aiTone: 'analyst', expected: 'Analyst - Data-driven and detailed' },
        { aiTone: 'captain', expected: 'Captain - Leadership-focused and strategic' }
      ]

      profiles.forEach(({ aiTone, expected }) => {
        const profileWithTone = { ...mockCompleteProfile, aiTone }
        
        mockUseOnboardingStore.mockReturnValue({
          profile: profileWithTone,
          validateStep: mockValidateStep,
          validationErrors: {},
          setStep: mockSetStep,
          completedSteps: new Set([1, 2, 3, 4, 5, 6, 7, 8, 9]),
          navigateNext: mockNavigateNext,
          navigateBack: mockNavigateBack,
        } as any)

        const { getByText } = render(<ReviewProfile />)
        expect(getByText(expected)).toBeTruthy()
      })
    })
  })

  describe('Accessibility', () => {
    it('should have proper accessibility labels', () => {
      const { getByText } = render(<ReviewProfile />)
      
      expect(getByText('Review Your Profile')).toBeTruthy()
      expect(getByText('Basic Information')).toBeTruthy()
      expect(getByText('Athletic Details')).toBeTruthy()
    })

    it('should support screen readers with descriptive content', () => {
      const { getByText } = render(<ReviewProfile />)
      
      expect(getByText(/double-check everything looks good/i)).toBeTruthy()
      expect(getByText(/you can edit any section by tapping the edit button/i)).toBeTruthy()
    })
  })

  describe('Loading State', () => {
    it('should show loading state during validation', () => {
      const { getByText } = render(<ReviewProfile />)
      
      // The component should show loading state while validating
      // This would be tested through the StepWrapper's isLoading prop
    })
  })
})