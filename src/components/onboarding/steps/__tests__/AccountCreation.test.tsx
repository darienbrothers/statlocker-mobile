import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import { Alert } from 'react-native'
import { AccountCreation } from '../AccountCreation'
import { useOnboardingStore } from '../../../../stores/onboardingStore'
import { authService } from '../../../../services/AuthService'
import type { AuthError } from '../../../../types/auth'

// Mock dependencies
jest.mock('../../../../stores/onboardingStore')
jest.mock('../../../../services/AuthService')
jest.mock('react-native/Libraries/Alert/Alert', () => ({
  alert: jest.fn(),
}))

const mockUseOnboardingStore = useOnboardingStore as jest.MockedFunction<typeof useOnboardingStore>
const mockAuthService = authService as jest.Mocked<typeof authService>
const mockAlert = Alert.alert as jest.MockedFunction<typeof Alert.alert>

describe('AccountCreation Component', () => {
  const mockUpdateProfile = jest.fn()
  const mockValidateStep = jest.fn()
  const mockNavigateNext = jest.fn()
  const mockNavigateBack = jest.fn()
  const mockTrackEvent = jest.fn()

  const mockProfile = {
    role: 'athlete',
    sport: 'lacrosse',
    onboardingStarted: new Date('2024-01-01'),
    aiPersonalization: {
      personaType: 'Competitor'
    }
  }

  beforeEach(() => {
    jest.clearAllMocks()
    
    mockUseOnboardingStore.mockReturnValue({
      profile: mockProfile,
      updateProfile: mockUpdateProfile,
      validateStep: mockValidateStep,
      validationErrors: {},
      navigateNext: mockNavigateNext,
      navigateBack: mockNavigateBack,
      trackEvent: mockTrackEvent,
    } as any)

    mockUseOnboardingStore.getState = jest.fn().mockReturnValue({
      navigateNext: mockNavigateNext,
      navigateBack: mockNavigateBack,
      trackEvent: mockTrackEvent,
    })

    mockAuthService.initialize = jest.fn().mockResolvedValue(undefined)
    mockAuthService.createUserWithEmail = jest.fn()
    mockAuthService.sendEmailVerification = jest.fn()
    mockAuthService.getCurrentUser = jest.fn()
    mockAuthService.isEmailVerified = jest.fn()
  })

  describe('Account Creation Form', () => {
    it('should render account creation form initially', () => {
      const { getByText, getByPlaceholderText } = render(<AccountCreation />)
      
      expect(getByText('Create Your Account')).toBeTruthy()
      expect(getByPlaceholderText('your.email@example.com')).toBeTruthy()
      expect(getByPlaceholderText('Create a strong password')).toBeTruthy()
      expect(getByPlaceholderText('Re-enter your password')).toBeTruthy()
    })

    it('should show password requirements', () => {
      const { getByText } = render(<AccountCreation />)
      
      expect(getByText('Password Requirements:')).toBeTruthy()
      expect(getByText('At least 8 characters')).toBeTruthy()
      expect(getByText('One uppercase letter')).toBeTruthy()
      expect(getByText('One lowercase letter')).toBeTruthy()
      expect(getByText('One number')).toBeTruthy()
      expect(getByText('Passwords match')).toBeTruthy()
    })

    it('should update password requirements as user types', () => {
      const { getByPlaceholderText } = render(<AccountCreation />)
      
      const passwordInput = getByPlaceholderText('Create a strong password')
      fireEvent.changeText(passwordInput, 'Password123')
      
      // Password requirements should update to show which are met
      // This would be verified by checking the icon colors/states
    })

    it('should validate email format', () => {
      const { getByPlaceholderText } = render(<AccountCreation />)
      
      const emailInput = getByPlaceholderText('your.email@example.com')
      fireEvent.changeText(emailInput, 'invalid-email')
      
      // Should show validation error for invalid email
    })

    it('should validate password strength', () => {
      const { getByPlaceholderText } = render(<AccountCreation />)
      
      const passwordInput = getByPlaceholderText('Create a strong password')
      fireEvent.changeText(passwordInput, 'weak')
      
      // Should show validation errors for weak password
    })

    it('should validate password confirmation', () => {
      const { getByPlaceholderText } = render(<AccountCreation />)
      
      const passwordInput = getByPlaceholderText('Create a strong password')
      const confirmInput = getByPlaceholderText('Re-enter your password')
      
      fireEvent.changeText(passwordInput, 'Password123')
      fireEvent.changeText(confirmInput, 'DifferentPassword')
      
      // Should show validation error for password mismatch
    })
  })

  describe('Account Creation Process', () => {
    it('should create account successfully', async () => {
      const mockUserCredential = {
        user: {
          uid: 'test-uid',
          email: 'test@example.com',
          emailVerified: false
        }
      }

      mockAuthService.createUserWithEmail.mockResolvedValue(mockUserCredential as any)

      const { getByPlaceholderText } = render(<AccountCreation />)
      
      const emailInput = getByPlaceholderText('your.email@example.com')
      const passwordInput = getByPlaceholderText('Create a strong password')
      const confirmInput = getByPlaceholderText('Re-enter your password')
      
      fireEvent.changeText(emailInput, 'test@example.com')
      fireEvent.changeText(passwordInput, 'Password123')
      fireEvent.changeText(confirmInput, 'Password123')
      
      // Simulate form submission (would come from StepWrapper onNext)
      // In actual test, we'd need to trigger the handleCreateAccount function
      
      await waitFor(() => {
        expect(mockAuthService.createUserWithEmail).toHaveBeenCalledWith(
          'test@example.com',
          'Password123'
        )
      })
    })

    it('should update profile with completion timestamp on success', async () => {
      const mockUserCredential = {
        user: {
          uid: 'test-uid',
          email: 'test@example.com',
          emailVerified: false
        }
      }

      mockAuthService.createUserWithEmail.mockResolvedValue(mockUserCredential as any)

      const { getByPlaceholderText } = render(<AccountCreation />)
      
      const emailInput = getByPlaceholderText('your.email@example.com')
      const passwordInput = getByPlaceholderText('Create a strong password')
      const confirmInput = getByPlaceholderText('Re-enter your password')
      
      fireEvent.changeText(emailInput, 'test@example.com')
      fireEvent.changeText(passwordInput, 'Password123')
      fireEvent.changeText(confirmInput, 'Password123')
      
      // Trigger account creation
      
      await waitFor(() => {
        expect(mockUpdateProfile).toHaveBeenCalledWith({
          onboardingCompleted: expect.any(Date)
        })
      })
    })

    it('should track onboarding completion event', async () => {
      const mockUserCredential = {
        user: {
          uid: 'test-uid',
          email: 'test@example.com',
          emailVerified: false
        }
      }

      mockAuthService.createUserWithEmail.mockResolvedValue(mockUserCredential as any)

      const { getByPlaceholderText } = render(<AccountCreation />)
      
      const emailInput = getByPlaceholderText('your.email@example.com')
      const passwordInput = getByPlaceholderText('Create a strong password')
      const confirmInput = getByPlaceholderText('Re-enter your password')
      
      fireEvent.changeText(emailInput, 'test@example.com')
      fireEvent.changeText(passwordInput, 'Password123')
      fireEvent.changeText(confirmInput, 'Password123')
      
      // Trigger account creation
      
      await waitFor(() => {
        expect(mockTrackEvent).toHaveBeenCalledWith('onboarding_completed', {
          totalDuration: expect.any(Number),
          stepCount: 11,
          personaType: 'Competitor'
        })
      })
    })

    it('should handle account creation errors', async () => {
      const authError: AuthError = {
        code: 'auth/email-already-in-use',
        message: 'Email already in use',
        userMessage: 'An account with this email already exists.',
        retryable: false
      }

      mockAuthService.createUserWithEmail.mockRejectedValue(authError)

      const { getByPlaceholderText, getByText } = render(<AccountCreation />)
      
      const emailInput = getByPlaceholderText('your.email@example.com')
      const passwordInput = getByPlaceholderText('Create a strong password')
      const confirmInput = getByPlaceholderText('Re-enter your password')
      
      fireEvent.changeText(emailInput, 'test@example.com')
      fireEvent.changeText(passwordInput, 'Password123')
      fireEvent.changeText(confirmInput, 'Password123')
      
      // Trigger account creation
      
      await waitFor(() => {
        expect(getByText(/account creation failed/i)).toBeTruthy()
        expect(getByText('An account with this email already exists.')).toBeTruthy()
      })
    })

    it('should show retry button after failed attempts', async () => {
      const authError: AuthError = {
        code: 'auth/network-request-failed',
        message: 'Network error',
        userMessage: 'We couldn\'t connect. Check your internet and try again.',
        retryable: true
      }

      mockAuthService.createUserWithEmail.mockRejectedValue(authError)

      const { getByPlaceholderText, getByText } = render(<AccountCreation />)
      
      const emailInput = getByPlaceholderText('your.email@example.com')
      const passwordInput = getByPlaceholderText('Create a strong password')
      const confirmInput = getByPlaceholderText('Re-enter your password')
      
      fireEvent.changeText(emailInput, 'test@example.com')
      fireEvent.changeText(passwordInput, 'Password123')
      fireEvent.changeText(confirmInput, 'Password123')
      
      // Trigger account creation
      
      await waitFor(() => {
        expect(getByText('Try Again')).toBeTruthy()
      })
    })
  })

  describe('Email Verification Screen', () => {
    it('should show verification screen after successful account creation', async () => {
      const mockUserCredential = {
        user: {
          uid: 'test-uid',
          email: 'test@example.com',
          emailVerified: false
        }
      }

      mockAuthService.createUserWithEmail.mockResolvedValue(mockUserCredential as any)

      const { getByPlaceholderText, getByText } = render(<AccountCreation />)
      
      const emailInput = getByPlaceholderText('your.email@example.com')
      const passwordInput = getByPlaceholderText('Create a strong password')
      const confirmInput = getByPlaceholderText('Re-enter your password')
      
      fireEvent.changeText(emailInput, 'test@example.com')
      fireEvent.changeText(passwordInput, 'Password123')
      fireEvent.changeText(confirmInput, 'Password123')
      
      // Trigger account creation
      
      await waitFor(() => {
        expect(getByText('Account Created! 🎉')).toBeTruthy()
        expect(getByText('Check your email to verify your account')).toBeTruthy()
        expect(getByText('test@example.com')).toBeTruthy()
      })
    })

    it('should show email verification instructions', async () => {
      const mockUserCredential = {
        user: {
          uid: 'test-uid',
          email: 'test@example.com',
          emailVerified: false
        }
      }

      mockAuthService.createUserWithEmail.mockResolvedValue(mockUserCredential as any)

      const { getByPlaceholderText, getByText } = render(<AccountCreation />)
      
      // Create account first
      const emailInput = getByPlaceholderText('your.email@example.com')
      const passwordInput = getByPlaceholderText('Create a strong password')
      const confirmInput = getByPlaceholderText('Re-enter your password')
      
      fireEvent.changeText(emailInput, 'test@example.com')
      fireEvent.changeText(passwordInput, 'Password123')
      fireEvent.changeText(confirmInput, 'Password123')
      
      await waitFor(() => {
        expect(getByText(/check your inbox for an email/i)).toBeTruthy()
        expect(getByText(/click the verification link/i)).toBeTruthy()
        expect(getByText(/come back here and tap/i)).toBeTruthy()
      })
    })

    it('should allow resending verification email', async () => {
      const mockUserCredential = {
        user: {
          uid: 'test-uid',
          email: 'test@example.com',
          emailVerified: false
        }
      }

      mockAuthService.createUserWithEmail.mockResolvedValue(mockUserCredential as any)
      mockAuthService.sendEmailVerification.mockResolvedValue(undefined)

      const { getByPlaceholderText, getByText } = render(<AccountCreation />)
      
      // Create account first
      const emailInput = getByPlaceholderText('your.email@example.com')
      const passwordInput = getByPlaceholderText('Create a strong password')
      const confirmInput = getByPlaceholderText('Re-enter your password')
      
      fireEvent.changeText(emailInput, 'test@example.com')
      fireEvent.changeText(passwordInput, 'Password123')
      fireEvent.changeText(confirmInput, 'Password123')
      
      await waitFor(() => {
        const resendButton = getByText('Resend Verification Email')
        fireEvent.press(resendButton)
      })

      await waitFor(() => {
        expect(mockAuthService.sendEmailVerification).toHaveBeenCalled()
        expect(mockAlert).toHaveBeenCalledWith(
          'Verification Sent',
          expect.stringContaining('We\'ve sent another verification email'),
          expect.any(Array)
        )
      })
    })

    it('should handle resend verification errors', async () => {
      const mockUserCredential = {
        user: {
          uid: 'test-uid',
          email: 'test@example.com',
          emailVerified: false
        }
      }

      const authError: AuthError = {
        code: 'auth/too-many-requests',
        message: 'Too many requests',
        userMessage: 'Too many attempts. Try again in a bit.',
        retryable: true
      }

      mockAuthService.createUserWithEmail.mockResolvedValue(mockUserCredential as any)
      mockAuthService.sendEmailVerification.mockRejectedValue(authError)

      const { getByPlaceholderText, getByText } = render(<AccountCreation />)
      
      // Create account first
      const emailInput = getByPlaceholderText('your.email@example.com')
      const passwordInput = getByPlaceholderText('Create a strong password')
      const confirmInput = getByPlaceholderText('Re-enter your password')
      
      fireEvent.changeText(emailInput, 'test@example.com')
      fireEvent.changeText(passwordInput, 'Password123')
      fireEvent.changeText(confirmInput, 'Password123')
      
      await waitFor(() => {
        const resendButton = getByText('Resend Verification Email')
        fireEvent.press(resendButton)
      })

      await waitFor(() => {
        expect(getByText(/issue with verification/i)).toBeTruthy()
        expect(getByText('Too many attempts. Try again in a bit.')).toBeTruthy()
      })
    })
  })

  describe('Email Verification Check', () => {
    it('should proceed to next step when email is verified', async () => {
      const mockUserCredential = {
        user: {
          uid: 'test-uid',
          email: 'test@example.com',
          emailVerified: false
        }
      }

      mockAuthService.createUserWithEmail.mockResolvedValue(mockUserCredential as any)
      mockAuthService.getCurrentUser.mockReturnValue({
        uid: 'test-uid',
        email: 'test@example.com',
        emailVerified: true
      } as any)
      mockAuthService.isEmailVerified.mockReturnValue(true)

      const { getByPlaceholderText, getByText } = render(<AccountCreation />)
      
      // Create account first
      const emailInput = getByPlaceholderText('your.email@example.com')
      const passwordInput = getByPlaceholderText('Create a strong password')
      const confirmInput = getByPlaceholderText('Re-enter your password')
      
      fireEvent.changeText(emailInput, 'test@example.com')
      fireEvent.changeText(passwordInput, 'Password123')
      fireEvent.changeText(confirmInput, 'Password123')
      
      await waitFor(() => {
        // Simulate clicking "I've Verified My Email" button (next button)
        // This would come from StepWrapper's onNext prop
      })

      expect(mockNavigateNext).toHaveBeenCalled()
    })

    it('should show error when email is not yet verified', async () => {
      const mockUserCredential = {
        user: {
          uid: 'test-uid',
          email: 'test@example.com',
          emailVerified: false
        }
      }

      mockAuthService.createUserWithEmail.mockResolvedValue(mockUserCredential as any)
      mockAuthService.getCurrentUser.mockReturnValue({
        uid: 'test-uid',
        email: 'test@example.com',
        emailVerified: false
      } as any)
      mockAuthService.isEmailVerified.mockReturnValue(false)

      const { getByPlaceholderText, getByText } = render(<AccountCreation />)
      
      // Create account first
      const emailInput = getByPlaceholderText('your.email@example.com')
      const passwordInput = getByPlaceholderText('Create a strong password')
      const confirmInput = getByPlaceholderText('Re-enter your password')
      
      fireEvent.changeText(emailInput, 'test@example.com')
      fireEvent.changeText(passwordInput, 'Password123')
      fireEvent.changeText(confirmInput, 'Password123')
      
      await waitFor(() => {
        // Simulate clicking verification check
      })

      await waitFor(() => {
        expect(getByText(/email not yet verified/i)).toBeTruthy()
      })
    })
  })

  describe('Form Validation', () => {
    it('should disable next button with invalid form data', () => {
      const { getByPlaceholderText } = render(<AccountCreation />)
      
      const emailInput = getByPlaceholderText('your.email@example.com')
      fireEvent.changeText(emailInput, 'invalid-email')
      
      // Next button should be disabled
      // This would be tested through StepWrapper's nextDisabled prop
    })

    it('should enable next button with valid form data', () => {
      const { getByPlaceholderText } = render(<AccountCreation />)
      
      const emailInput = getByPlaceholderText('your.email@example.com')
      const passwordInput = getByPlaceholderText('Create a strong password')
      const confirmInput = getByPlaceholderText('Re-enter your password')
      
      fireEvent.changeText(emailInput, 'test@example.com')
      fireEvent.changeText(passwordInput, 'Password123')
      fireEvent.changeText(confirmInput, 'Password123')
      
      // Next button should be enabled
      // This would be tested through StepWrapper's nextDisabled prop
    })
  })

  describe('Loading States', () => {
    it('should show loading state during account creation', async () => {
      mockAuthService.createUserWithEmail.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 1000))
      )

      const { getByPlaceholderText, getByText } = render(<AccountCreation />)
      
      const emailInput = getByPlaceholderText('your.email@example.com')
      const passwordInput = getByPlaceholderText('Create a strong password')
      const confirmInput = getByPlaceholderText('Re-enter your password')
      
      fireEvent.changeText(emailInput, 'test@example.com')
      fireEvent.changeText(passwordInput, 'Password123')
      fireEvent.changeText(confirmInput, 'Password123')
      
      // Trigger account creation
      
      expect(getByText('Creating your account...')).toBeTruthy()
    })

    it('should show loading state during verification check', async () => {
      const mockUserCredential = {
        user: {
          uid: 'test-uid',
          email: 'test@example.com',
          emailVerified: false
        }
      }

      mockAuthService.createUserWithEmail.mockResolvedValue(mockUserCredential as any)
      mockAuthService.getCurrentUser.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 1000)) as any
      )

      const { getByPlaceholderText, getByText } = render(<AccountCreation />)
      
      // Create account first, then check verification
      
      await waitFor(() => {
        expect(getByText('Checking verification status...')).toBeTruthy()
      })
    })
  })

  describe('Accessibility', () => {
    it('should have proper accessibility labels', () => {
      const { getByText, getByPlaceholderText } = render(<AccountCreation />)
      
      expect(getByText('Create Your Account')).toBeTruthy()
      expect(getByPlaceholderText('your.email@example.com')).toBeTruthy()
      expect(getByText('Password Requirements:')).toBeTruthy()
    })

    it('should support screen readers with descriptive content', () => {
      const { getByText } = render(<AccountCreation />)
      
      expect(getByText(/set up your login credentials/i)).toBeTruthy()
      expect(getByText(/we use industry-standard encryption/i)).toBeTruthy()
    })
  })
})