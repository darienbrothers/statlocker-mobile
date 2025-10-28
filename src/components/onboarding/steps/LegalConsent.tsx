import React, { useState, useEffect } from 'react'
import { View, Text, TouchableOpacity, Linking, ScrollView } from 'react-native'
import { StepWrapper } from '../StepWrapper'
import { FormToggle } from '../FormToggle'
import { useOnboardingStore } from '../../../stores/onboardingStore'
import type { LegalConsentData } from '../../../types/onboarding'

/**
 * Legal Consent component for Terms of Service and Privacy Policy acceptance
 * Handles required and optional consent collection
 */
export const LegalConsent: React.FC = () => {
  const { profile, updateProfile, validateStep, validationErrors } = useOnboardingStore()
  
  const [tosAccepted, setTosAccepted] = useState(profile.tosAccepted || false)
  const [privacyAccepted, setPrivacyAccepted] = useState(profile.privacyAccepted || false)
  const [benchmarkingConsent, setBenchmarkingConsent] = useState(profile.benchmarkingConsent || false)
  
  const stepErrors = validationErrors[9] || []

  // Update profile when consent values change
  useEffect(() => {
    const consentData: LegalConsentData = {
      tosAccepted,
      privacyAccepted,
      benchmarkingConsent
    }

    updateProfile(consentData)
  }, [tosAccepted, privacyAccepted, benchmarkingConsent, updateProfile])

  const handleNext = () => {
    if (validateStep(9)) {
      useOnboardingStore.getState().navigateNext()
    }
  }

  const handleBack = () => {
    useOnboardingStore.getState().navigateBack()
  }

  const openTermsOfService = async () => {
    try {
      // TODO: Replace with actual Terms of Service URL
      const url = 'https://statlocker.app/terms'
      const supported = await Linking.canOpenURL(url)
      
      if (supported) {
        await Linking.openURL(url)
      } else {
        console.warn('Cannot open Terms of Service URL')
      }
    } catch (error) {
      console.error('Error opening Terms of Service:', error)
    }
  }

  const openPrivacyPolicy = async () => {
    try {
      // TODO: Replace with actual Privacy Policy URL
      const url = 'https://statlocker.app/privacy'
      const supported = await Linking.canOpenURL(url)
      
      if (supported) {
        await Linking.openURL(url)
      } else {
        console.warn('Cannot open Privacy Policy URL')
      }
    } catch (error) {
      console.error('Error opening Privacy Policy:', error)
    }
  }

  const isNextDisabled = () => {
    return !tosAccepted || !privacyAccepted
  }

  return (
    <StepWrapper
      stepNumber={9}
      title="Legal Agreements"
      subtitle="Please review and accept our terms and privacy policy"
      onNext={handleNext}
      onBack={handleBack}
      nextDisabled={isNextDisabled()}
    >
      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        <View className="space-y-6">
          {/* Introduction */}
          <View className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <Text className="text-blue-800 font-semibold mb-2">
              Almost there! 🎯
            </Text>
            <Text className="text-blue-700 text-sm leading-5">
              Before we create your account, we need you to review and accept our legal agreements. These help protect both you and StatLocker.
            </Text>
          </View>

          {/* Terms of Service */}
          <View className="bg-white border border-gray-200 rounded-lg p-4">
            <View className="flex-row items-start justify-between mb-3">
              <View className="flex-1 mr-3">
                <Text className="text-gray-900 font-semibold mb-1">
                  Terms of Service
                </Text>
                <Text className="text-gray-600 text-sm leading-5">
                  Our terms explain how you can use StatLocker, what we expect from users, and what you can expect from us.
                </Text>
              </View>
              <TouchableOpacity
                onPress={openTermsOfService}
                className="bg-blue-600 px-3 py-2 rounded-md"
              >
                <Text className="text-white text-sm font-medium">
                  Read
                </Text>
              </TouchableOpacity>
            </View>
            
            <FormToggle
              label="I have read and agree to the Terms of Service"
              value={tosAccepted}
              onValueChange={setTosAccepted}
              required
            />
          </View>

          {/* Privacy Policy */}
          <View className="bg-white border border-gray-200 rounded-lg p-4">
            <View className="flex-row items-start justify-between mb-3">
              <View className="flex-1 mr-3">
                <Text className="text-gray-900 font-semibold mb-1">
                  Privacy Policy
                </Text>
                <Text className="text-gray-600 text-sm leading-5">
                  Our privacy policy explains what personal information we collect, how we use it, and how we protect your privacy.
                </Text>
              </View>
              <TouchableOpacity
                onPress={openPrivacyPolicy}
                className="bg-blue-600 px-3 py-2 rounded-md"
              >
                <Text className="text-white text-sm font-medium">
                  Read
                </Text>
              </TouchableOpacity>
            </View>
            
            <FormToggle
              label="I have read and agree to the Privacy Policy"
              value={privacyAccepted}
              onValueChange={setPrivacyAccepted}
              required
            />
          </View>

          {/* Optional Benchmarking Consent */}
          <View className="bg-white border border-gray-200 rounded-lg p-4">
            <Text className="text-gray-900 font-semibold mb-2">
              Optional: Help Improve StatLocker
            </Text>
            <Text className="text-gray-600 text-sm leading-5 mb-4">
              You can help us improve StatLocker by allowing us to use your anonymized performance data for benchmarking and research. This helps us:
            </Text>
            
            <View className="space-y-2 mb-4">
              <Text className="text-gray-700 text-sm">
                • Create better performance benchmarks for your position
              </Text>
              <Text className="text-gray-700 text-sm">
                • Improve our AI insights and recommendations
              </Text>
              <Text className="text-gray-700 text-sm">
                • Develop new features based on real usage patterns
              </Text>
            </View>

            <View className="bg-gray-50 rounded-lg p-3 mb-4">
              <Text className="text-gray-800 font-medium text-sm mb-1">
                Your privacy is protected:
              </Text>
              <Text className="text-gray-700 text-xs leading-4">
                All data is completely anonymized and cannot be traced back to you. You can opt out at any time in your account settings.
              </Text>
            </View>
            
            <FormToggle
              label="Yes, use my anonymized data for benchmarking and research"
              value={benchmarkingConsent}
              onValueChange={setBenchmarkingConsent}
              description="This is completely optional and you can change this setting anytime."
            />
          </View>

          {/* Data Protection Summary */}
          <View className="bg-green-50 border border-green-200 rounded-lg p-4">
            <Text className="text-green-800 font-semibold mb-2">
              🔒 Your Data is Protected
            </Text>
            <Text className="text-green-700 text-sm leading-5 mb-3">
              We take your privacy seriously. Here's what you should know:
            </Text>
            
            <View className="space-y-1">
              <Text className="text-green-700 text-xs">
                • We only collect data necessary for your training insights
              </Text>
              <Text className="text-green-700 text-xs">
                • Your personal information is encrypted and secure
              </Text>
              <Text className="text-green-700 text-xs">
                • You can delete your account and data at any time
              </Text>
              <Text className="text-green-700 text-xs">
                • We never sell your personal information to third parties
              </Text>
            </View>
          </View>

          {/* Error Display */}
          {stepErrors.length > 0 && (
            <View className="bg-red-50 border border-red-200 rounded-lg p-4">
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

          {/* Legal Disclaimer */}
          <View className="bg-gray-50 rounded-lg p-4 mb-6">
            <Text className="text-gray-800 font-medium text-sm mb-2">
              Legal Information
            </Text>
            <Text className="text-gray-700 text-xs leading-4">
              By accepting these agreements, you confirm that you have the legal capacity to enter into this agreement. If you are under 18, your parent or guardian must review and approve these terms. You can withdraw your consent at any time by contacting us or deleting your account.
            </Text>
          </View>
        </View>
      </ScrollView>
    </StepWrapper>
  )
}