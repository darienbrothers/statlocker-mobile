import React, { useState, useEffect } from 'react'
import { View, Text, Alert, TouchableOpacity } from 'react-native'
import { StepWrapper } from '../StepWrapper'
import { FormInput } from '../FormInput'
import { FormToggle } from '../FormToggle'
import { useOnboardingStore } from '../../../stores/onboardingStore'
import { useGuardianConsent } from '../../../hooks/onboarding/useGuardianConsent'
import type { AgeVerificationData } from '../../../types/onboarding'

/**
 * Age Verification component for COPPA/GDPR-K compliance
 * Handles age calculation and guardian consent collection for minors
 */
export const AgeVerification: React.FC = () => {
  const { profile, updateProfile, validateStep, validationErrors } = useOnboardingStore()
  const guardianConsent = useGuardianConsent()
  const [guardianEmail, setGuardianEmail] = useState(profile.guardianEmail || '')
  const [consentGiven, setConsentGiven] = useState(false)
  const [userAge, setUserAge] = useState<number | null>(null)
  
  const stepErrors = validationErrors[8] || []

  // Calculate user age when component mounts or date of birth changes
  useEffect(() => {
    if (profile.dateOfBirth) {
      const age = calculateAge(profile.dateOfBirth)
      setUserAge(age)
      
      // Block registration for users under 13
      if (age < 13) {
        Alert.alert(
          'Age Requirement',
          'You must be at least 13 years old to create an account. Please have a parent or guardian create an account on your behalf.',
          [
            {
              text: 'OK',
              onPress: () => {
                // Navigate back to previous step or exit onboarding
                useOnboardingStore.getState().navigateBack()
              }
            }
          ]
        )
      }
    }
  }, [profile.dateOfBirth])

  // Update profile when age verification data changes
  useEffect(() => {
    const ageVerificationData: Partial<AgeVerificationData> = {
      ageVerified: userAge !== null && userAge >= 13,
    }

    if (guardianConsent.requiresGuardianConsent) {
      ageVerificationData.guardianEmail = guardianEmail
      ageVerificationData.consentTimestamp = consentGiven ? new Date() : undefined
    }

    updateProfile(ageVerificationData)
  }, [userAge, guardianEmail, consentGiven, guardianConsent.requiresGuardianConsent, updateProfile])

  const handleNext = () => {
    if (validateStep(8)) {
      useOnboardingStore.getState().navigateNext()
    }
  }

  const handleBack = () => {
    useOnboardingStore.getState().navigateBack()
  }

  const isNextDisabled = () => {
    if (!userAge || userAge < 13) return true
    
    if (guardianConsent.requiresGuardianConsent) {
      return !guardianEmail || !consentGiven || !isValidEmail(guardianEmail)
    }
    
    return false
  }

  const handleSendConsentRequest = async () => {
    if (!guardianEmail || !isValidEmail(guardianEmail)) {
      Alert.alert('Invalid Email', 'Please enter a valid guardian email address.')
      return
    }

    // Update profile with guardian email first
    updateProfile({ guardianEmail })
    
    try {
      await guardianConsent.sendConsentRequest()
      Alert.alert(
        'Consent Request Sent',
        `We've sent a consent request to ${guardianEmail}. They have 7 days to respond.`,
        [{ text: 'OK' }]
      )
    } catch (error) {
      Alert.alert(
        'Error',
        'Failed to send consent request. Please try again.',
        [{ text: 'OK' }]
      )
    }
  }

  const renderAgeStatus = () => {
    if (!userAge) return null

    if (userAge < 13) {
      return (
        <View className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <Text className="text-red-800 font-semibold mb-2">
            Age Requirement Not Met
          </Text>
          <Text className="text-red-700 text-sm leading-5">
            You must be at least 13 years old to create an account. Please have a parent or guardian create an account on your behalf.
          </Text>
        </View>
      )
    }

    if (guardianConsent.requiresGuardianConsent) {
      return (
        <View className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <Text className="text-blue-800 font-semibold mb-2">
            Guardian Consent Required
          </Text>
          <Text className="text-blue-700 text-sm leading-5 mb-3">
            Since you're under 16, we need your parent or guardian's consent to create your account. This helps us comply with privacy laws that protect young athletes.
          </Text>
          <Text className="text-blue-700 text-sm leading-5">
            We'll send them an email with information about StatLocker and ask for their permission.
          </Text>
          
          {guardianConsent.consentSent && (
            <View className="mt-3 p-3 bg-green-100 rounded-lg">
              <Text className="text-green-800 font-medium text-sm">
                ✓ Consent request sent!
              </Text>
              <Text className="text-green-700 text-xs mt-1">
                Check with your parent/guardian - they should receive an email shortly.
              </Text>
              {guardianConsent.daysUntilExpiration !== undefined && (
                <Text className="text-green-700 text-xs mt-1">
                  Expires in {guardianConsent.daysUntilExpiration} days
                </Text>
              )}
            </View>
          )}
        </View>
      )
    }

    return (
      <View className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
        <Text className="text-green-800 font-semibold mb-2">
          Age Verification Complete
        </Text>
        <Text className="text-green-700 text-sm leading-5">
          You meet the age requirements to create your own account. Let's continue!
        </Text>
      </View>
    )
  }

  const renderGuardianConsentForm = () => {
    if (!guardianConsent.requiresGuardianConsent) return null

    return (
      <View className="space-y-4">
        <FormInput
          label="Parent/Guardian Email"
          placeholder="parent@example.com"
          value={guardianEmail}
          onChangeText={setGuardianEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          error={stepErrors.find(error => error.includes('Guardian email'))}
          required
        />
        
        <View className="bg-gray-50 rounded-lg p-4">
          <Text className="text-gray-800 font-medium mb-3">
            What happens next?
          </Text>
          <Text className="text-gray-700 text-sm leading-5 mb-2">
            • We'll send your parent/guardian an email explaining StatLocker
          </Text>
          <Text className="text-gray-700 text-sm leading-5 mb-2">
            • They'll review what data we collect and how we use it
          </Text>
          <Text className="text-gray-700 text-sm leading-5 mb-2">
            • Once they give consent, you can start using your account
          </Text>
          <Text className="text-gray-700 text-sm leading-5">
            • They can withdraw consent at any time
          </Text>
        </View>

        {!guardianConsent.consentSent ? (
          <>
            <FormToggle
              label="I confirm this is my parent or guardian's email address"
              value={consentGiven}
              onValueChange={setConsentGiven}
              description="By checking this box, you confirm that the email address above belongs to your parent or legal guardian who has the authority to give consent on your behalf."
            />
            
            {consentGiven && guardianEmail && isValidEmail(guardianEmail) && (
              <TouchableOpacity
                onPress={handleSendConsentRequest}
                className="bg-blue-600 py-3 px-4 rounded-lg"
                disabled={guardianConsent.isLoading}
              >
                <Text className="text-white font-medium text-center">
                  {guardianConsent.isLoading ? 'Sending...' : 'Send Consent Request'}
                </Text>
              </TouchableOpacity>
            )}
          </>
        ) : (
          <View className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <Text className="text-yellow-800 font-medium mb-2">
              Waiting for Guardian Consent
            </Text>
            <Text className="text-yellow-700 text-sm leading-5 mb-3">
              We've sent a consent request to {guardianEmail}. You'll be able to continue once they approve.
            </Text>
            
            <TouchableOpacity
              onPress={guardianConsent.resendConsentRequest}
              className="bg-yellow-600 py-2 px-3 rounded-md self-start"
              disabled={guardianConsent.isLoading}
            >
              <Text className="text-white text-sm font-medium">
                {guardianConsent.isLoading ? 'Sending...' : 'Resend Email'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {guardianConsent.error && (
          <View className="bg-red-50 border border-red-200 rounded-lg p-3">
            <Text className="text-red-800 text-sm">
              {guardianConsent.error}
            </Text>
            <TouchableOpacity
              onPress={guardianConsent.clearError}
              className="mt-2"
            >
              <Text className="text-red-600 text-xs underline">
                Dismiss
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    )
  }

  return (
    <StepWrapper
      stepNumber={8}
      title="Age Verification"
      subtitle="We need to verify your age to comply with privacy laws"
      onNext={handleNext}
      onBack={handleBack}
      nextDisabled={isNextDisabled()}
    >
      <View className="flex-1 px-6">
        {userAge && (
          <View className="mb-6">
            <Text className="text-gray-600 text-sm mb-2">
              Based on your date of birth, you are {userAge} years old.
            </Text>
          </View>
        )}

        {renderAgeStatus()}
        {renderGuardianConsentForm()}

        {stepErrors.length > 0 && (
          <View className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
            <Text className="text-red-800 font-medium mb-2">
              Please fix the following issues:
            </Text>
            {stepErrors.map((error, index) => (
              <Text key={index} className="text-red-700 text-sm">
                • {error}
              </Text>
            ))}
          </View>
        )}

        <View className="bg-gray-50 rounded-lg p-4 mt-6">
          <Text className="text-gray-800 font-medium mb-2">
            Privacy Protection
          </Text>
          <Text className="text-gray-700 text-sm leading-5">
            We take privacy seriously, especially for young athletes. We only collect the minimum information needed to provide you with personalized training insights and comply with all applicable privacy laws including COPPA and GDPR-K.
          </Text>
        </View>
      </View>
    </StepWrapper>
  )
}

/**
 * Calculate age from date of birth
 */
function calculateAge(dateOfBirth: Date): number {
  const today = new Date()
  const birthDate = new Date(dateOfBirth)
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }
  
  return age
}

/**
 * Validate email format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}