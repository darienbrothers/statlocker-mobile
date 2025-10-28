import React, { useState, useEffect } from 'react'
import { View, Text, ScrollView, Alert, ActivityIndicator, TouchableOpacity } from 'react-native'
import { StepWrapper } from '../StepWrapper'
import { FormInput } from '../FormInput'
import { useOnboardingStore } from '../../../stores/onboardingStore'
import { authService } from '../../../services/AuthService'
import { Icon } from '../../Icon'
import type { AuthError } from '../../../types/auth'

interface AccountCreationState {
  email: string
  password: string
  confirmPassword: string
  isCreating: boolean
  isVerifying: boolean
  accountCreated: boolean
  emailVerificationSent: boolean
  error: string | null
  retryCount: number
}

/**
 * AccountCreation component with Firebase Auth integration
 * Handles email/password collection, account creation, and email verification
 */
export const AccountCreation: React.FC = () => {
  const { profile, updateProfile, validateStep, validationErrors } = useOnboardingStore()
  
  const [state, setState] = useState<AccountCreationState>({
    email: '',
    password: '',
    confirmPassword: '',
    isCreating: false,
    isVerifying: false,
    accountCreated: false,
    emailVerificationSent: false,
    error: null,
    retryCount: 0
  })
  
  const stepErrors = validationErrors[11] || []

  // Initialize auth service on component mount
  useEffect(() => {
    authService.initialize().catch(error => {
      console.error('Failed to initialize auth service:', error)
    })
  }, [])

  const handleEmailChange = (email: string) => {
    setState(prev => ({ ...prev, email, error: null }))
  }

  const handlePasswordChange = (password: string) => {
    setState(prev => ({ ...prev, password, error: null }))
  }

  const handleConfirmPasswordChange = (confirmPassword: string) => {
    setState(prev => ({ ...prev, confirmPassword, error: null }))
  }

  const validateForm = (): string | null => {
    if (!state.email.trim()) {
      return 'Email is required'
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(state.email)) {
      return 'Please enter a valid email address'
    }
    
    if (!state.password) {
      return 'Password is required'
    }
    
    if (state.password.length < 8) {
      return 'Password must be at least 8 characters long'
    }
    
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(state.password)) {
      return 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    }
    
    if (state.password !== state.confirmPassword) {
      return 'Passwords do not match'
    }
    
    return null
  }

  const handleCreateAccount = async () => {
    const validationError = validateForm()
    if (validationError) {
      setState(prev => ({ ...prev, error: validationError }))
      return
    }

    setState(prev => ({ 
      ...prev, 
      isCreating: true, 
      error: null 
    }))

    try {
      // Create Firebase Auth account
      const userCredential = await authService.createUserWithEmail(
        state.email.trim().toLowerCase(),
        state.password
      )

      // Update onboarding profile with account creation timestamp
      updateProfile({
        onboardingCompleted: new Date()
      })

      setState(prev => ({ 
        ...prev, 
        isCreating: false,
        accountCreated: true,
        emailVerificationSent: true
      }))

      // Track account creation event
      useOnboardingStore.getState().trackEvent('onboarding_completed', {
        totalDuration: profile.onboardingStarted 
          ? Date.now() - profile.onboardingStarted.getTime()
          : 0,
        stepCount: 11,
        personaType: profile.aiPersonalization?.personaType
      })

      console.log('Account created successfully:', userCredential.user.uid)
      
    } catch (error) {
      const authError = error as AuthError
      
      setState(prev => ({ 
        ...prev, 
        isCreating: false,
        error: authError.userMessage || authError.message || 'Failed to create account',
        retryCount: prev.retryCount + 1
      }))

      console.error('Account creation failed:', authError)
    }
  }

  const handleResendVerification = async () => {
    setState(prev => ({ ...prev, isVerifying: true, error: null }))

    try {
      await authService.sendEmailVerification()
      
      setState(prev => ({ 
        ...prev, 
        isVerifying: false,
        emailVerificationSent: true
      }))

      Alert.alert(
        'Verification Sent',
        'We\'ve sent another verification email. Check your inbox and spam folder.',
        [{ text: 'OK' }]
      )
      
    } catch (error) {
      const authError = error as AuthError
      
      setState(prev => ({ 
        ...prev, 
        isVerifying: false,
        error: authError.userMessage || 'Failed to send verification email'
      }))
    }
  }

  const handleCheckVerification = async () => {
    setState(prev => ({ ...prev, isVerifying: true, error: null }))

    try {
      // Reload user to get latest email verification status
      const currentUser = authService.getCurrentUser()
      if (currentUser && authService.isEmailVerified()) {
        // Email is verified, proceed to next step
        useOnboardingStore.getState().navigateNext()
      } else {
        setState(prev => ({ 
          ...prev, 
          isVerifying: false,
          error: 'Email not yet verified. Please check your inbox and click the verification link.'
        }))
      }
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        isVerifying: false,
        error: 'Failed to check verification status'
      }))
    }
  }

  const handleRetry = () => {
    setState(prev => ({ 
      ...prev, 
      error: null,
      accountCreated: false,
      emailVerificationSent: false
    }))
  }

  const handleBack = () => {
    useOnboardingStore.getState().navigateBack()
  }

  const isFormValid = () => {
    return validateForm() === null
  }

  const isNextDisabled = () => {
    if (!state.accountCreated) {
      return !isFormValid() || state.isCreating
    }
    return state.isVerifying
  }

  // Show account creation success screen
  if (state.accountCreated) {
    return (
      <StepWrapper
        stepNumber={11}
        title="Account Created! 🎉"
        subtitle="Check your email to verify your account"
        onNext={handleCheckVerification}
        onBack={handleBack}
        nextDisabled={isNextDisabled()}
      >
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <View className="space-y-6">
            {/* Success Message */}
            <View className="bg-green-900/20 border border-green-700 rounded-lg p-6 items-center">
              <Icon name="check-circle" size={48} color="#22C55E" />
              <Text className="text-green-400 font-bold text-xl mt-4 mb-2 text-center">
                Welcome to StatLocker!
              </Text>
              <Text className="text-green-300 text-center leading-6">
                Your account has been created successfully. We've sent a verification email to:
              </Text>
              <Text className="text-white font-semibold text-center mt-2">
                {state.email}
              </Text>
            </View>

            {/* Email Verification Instructions */}
            <View className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
              <Text className="text-blue-400 font-semibold mb-3">
                📧 Verify Your Email
              </Text>
              <View className="space-y-2">
                <Text className="text-blue-300 text-sm">
                  1. Check your inbox for an email from StatLocker
                </Text>
                <Text className="text-blue-300 text-sm">
                  2. Click the verification link in the email
                </Text>
                <Text className="text-blue-300 text-sm">
                  3. Come back here and tap "I've Verified My Email"
                </Text>
              </View>
              
              <Text className="text-blue-300 text-xs mt-3 leading-4">
                💡 Don't see the email? Check your spam folder or tap "Resend Email" below.
              </Text>
            </View>

            {/* Resend Email Option */}
            <View className="bg-gray-800 rounded-lg p-4">
              <Text className="text-white font-medium mb-3">
                Need another verification email?
              </Text>
              
              <TouchableOpacity
                onPress={handleResendVerification}
                disabled={state.isVerifying}
                className={`flex-row items-center justify-center py-3 px-4 rounded-lg ${
                  state.isVerifying 
                    ? 'bg-gray-600' 
                    : 'bg-blue-600'
                }`}
              >
                {state.isVerifying ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Icon name="mail" size={16} color="white" />
                )}
                <Text className="text-white font-medium ml-2">
                  {state.isVerifying ? 'Sending...' : 'Resend Verification Email'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Error Display */}
            {state.error && (
              <View className="bg-red-900/20 border border-red-700 rounded-lg p-4">
                <Text className="text-red-400 font-medium mb-2">
                  ⚠️ Issue with Verification
                </Text>
                <Text className="text-red-300 text-sm">
                  {state.error}
                </Text>
              </View>
            )}

            {/* What's Next */}
            <View className="bg-purple-900/20 border border-purple-700 rounded-lg p-4">
              <Text className="text-purple-400 font-semibold mb-2">
                🚀 What's Next?
              </Text>
              <Text className="text-purple-300 text-sm leading-5">
                Once your email is verified, we'll activate your 7-day free trial and take you to your personalized dashboard. You'll be ready to start logging games and tracking your progress!
              </Text>
            </View>

            {/* Loading State for Verification Check */}
            {state.isVerifying && (
              <View className="bg-gray-800 rounded-lg p-6 items-center">
                <ActivityIndicator size="large" color="#3B82F6" />
                <Text className="text-gray-400 text-center mt-3">
                  Checking verification status...
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      </StepWrapper>
    )
  }

  // Show account creation form
  return (
    <StepWrapper
      stepNumber={11}
      title="Create Your Account"
      subtitle="Set up your login credentials to access StatLocker"
      onNext={handleCreateAccount}
      onBack={handleBack}
      nextDisabled={isNextDisabled()}
    >
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="space-y-6">
          {/* Introduction */}
          <View className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
            <Text className="text-blue-400 font-semibold mb-2">
              🔐 Secure Account Setup
            </Text>
            <Text className="text-blue-300 text-sm leading-5">
              Create your login credentials. You'll use these to access StatLocker on any device. We'll send a verification email to confirm your account.
            </Text>
          </View>

          {/* Email Input */}
          <View>
            <FormInput
              label="Email Address"
              value={state.email}
              onChangeText={handleEmailChange}
              placeholder="your.email@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              required
              description="We'll use this to send you important account updates"
            />
          </View>

          {/* Password Input */}
          <View>
            <FormInput
              label="Password"
              value={state.password}
              onChangeText={handlePasswordChange}
              placeholder="Create a strong password"
              secureTextEntry
              autoComplete="new-password"
              required
              description="At least 8 characters with uppercase, lowercase, and numbers"
            />
          </View>

          {/* Confirm Password Input */}
          <View>
            <FormInput
              label="Confirm Password"
              value={state.confirmPassword}
              onChangeText={handleConfirmPasswordChange}
              placeholder="Re-enter your password"
              secureTextEntry
              autoComplete="new-password"
              required
              description="Must match the password above"
            />
          </View>

          {/* Password Requirements */}
          <View className="bg-gray-800 rounded-lg p-4">
            <Text className="text-white font-medium mb-3">
              Password Requirements:
            </Text>
            
            <View className="space-y-2">
              <View className="flex-row items-center">
                <Icon 
                  name={state.password.length >= 8 ? "check-circle" : "circle"} 
                  size={16} 
                  color={state.password.length >= 8 ? "#22C55E" : "#6B7280"} 
                />
                <Text className={`text-sm ml-2 ${
                  state.password.length >= 8 ? 'text-green-400' : 'text-gray-400'
                }`}>
                  At least 8 characters
                </Text>
              </View>
              
              <View className="flex-row items-center">
                <Icon 
                  name={/[A-Z]/.test(state.password) ? "check-circle" : "circle"} 
                  size={16} 
                  color={/[A-Z]/.test(state.password) ? "#22C55E" : "#6B7280"} 
                />
                <Text className={`text-sm ml-2 ${
                  /[A-Z]/.test(state.password) ? 'text-green-400' : 'text-gray-400'
                }`}>
                  One uppercase letter
                </Text>
              </View>
              
              <View className="flex-row items-center">
                <Icon 
                  name={/[a-z]/.test(state.password) ? "check-circle" : "circle"} 
                  size={16} 
                  color={/[a-z]/.test(state.password) ? "#22C55E" : "#6B7280"} 
                />
                <Text className={`text-sm ml-2 ${
                  /[a-z]/.test(state.password) ? 'text-green-400' : 'text-gray-400'
                }`}>
                  One lowercase letter
                </Text>
              </View>
              
              <View className="flex-row items-center">
                <Icon 
                  name={/\d/.test(state.password) ? "check-circle" : "circle"} 
                  size={16} 
                  color={/\d/.test(state.password) ? "#22C55E" : "#6B7280"} 
                />
                <Text className={`text-sm ml-2 ${
                  /\d/.test(state.password) ? 'text-green-400' : 'text-gray-400'
                }`}>
                  One number
                </Text>
              </View>
              
              <View className="flex-row items-center">
                <Icon 
                  name={state.password === state.confirmPassword && state.confirmPassword ? "check-circle" : "circle"} 
                  size={16} 
                  color={state.password === state.confirmPassword && state.confirmPassword ? "#22C55E" : "#6B7280"} 
                />
                <Text className={`text-sm ml-2 ${
                  state.password === state.confirmPassword && state.confirmPassword ? 'text-green-400' : 'text-gray-400'
                }`}>
                  Passwords match
                </Text>
              </View>
            </View>
          </View>

          {/* Error Display */}
          {state.error && (
            <View className="bg-red-900/20 border border-red-700 rounded-lg p-4">
              <Text className="text-red-400 font-medium mb-2">
                ⚠️ Account Creation Failed
              </Text>
              <Text className="text-red-300 text-sm mb-3">
                {state.error}
              </Text>
              
              {state.retryCount > 0 && (
                <TouchableOpacity
                  onPress={handleRetry}
                  className="bg-red-600 py-2 px-4 rounded-lg"
                >
                  <Text className="text-white font-medium text-center">
                    Try Again
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Step Validation Errors */}
          {stepErrors.length > 0 && (
            <View className="bg-red-900/20 border border-red-700 rounded-lg p-4">
              <Text className="text-red-400 font-medium mb-2">
                Please fix the following issues:
              </Text>
              {stepErrors.map((error, index) => (
                <Text key={index} className="text-red-300 text-sm">
                  • {error}
                </Text>
              ))}
            </View>
          )}

          {/* Security Notice */}
          <View className="bg-green-900/20 border border-green-700 rounded-lg p-4">
            <Text className="text-green-400 font-semibold mb-2">
              🔒 Your Data is Secure
            </Text>
            <Text className="text-green-300 text-sm leading-5">
              We use industry-standard encryption to protect your account. Your password is never stored in plain text, and we'll never share your personal information with third parties.
            </Text>
          </View>

          {/* Loading State */}
          {state.isCreating && (
            <View className="bg-gray-800 rounded-lg p-6 items-center">
              <ActivityIndicator size="large" color="#3B82F6" />
              <Text className="text-gray-400 text-center mt-3">
                Creating your account...
              </Text>
              <Text className="text-gray-500 text-center text-sm mt-1">
                This may take a few seconds
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </StepWrapper>
  )
}