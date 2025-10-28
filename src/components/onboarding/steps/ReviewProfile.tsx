import React, { useState, useEffect } from 'react'
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native'
import { StepWrapper } from '../StepWrapper'
import { useOnboardingStore } from '../../../stores/onboardingStore'
import { Icon } from '../../Icon'
import type { OnboardingProfile } from '../../../types/onboarding'

/**
 * ReviewProfile component for data confirmation before account creation
 * Displays complete profile summary with edit links to previous steps
 */
export const ReviewProfile: React.FC = () => {
  const { 
    profile, 
    validateStep, 
    validationErrors, 
    setStep,
    completedSteps 
  } = useOnboardingStore()
  
  const [isValidating, setIsValidating] = useState(false)
  const stepErrors = validationErrors[10] || []

  // Validate all previous steps on component mount
  useEffect(() => {
    setIsValidating(true)
    
    // Validate all steps 1-9
    const allValid = Array.from({ length: 9 }, (_, i) => i + 1)
      .every(step => validateStep(step))
    
    setIsValidating(false)
  }, [validateStep])

  const handleNext = () => {
    if (validateStep(10)) {
      useOnboardingStore.getState().navigateNext()
    }
  }

  const handleBack = () => {
    useOnboardingStore.getState().navigateBack()
  }

  const handleEditStep = (stepNumber: number) => {
    Alert.alert(
      'Edit Information',
      `Go back to step ${stepNumber} to make changes?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Edit', 
          onPress: () => setStep(stepNumber)
        }
      ]
    )
  }

  const formatDate = (date: Date | undefined) => {
    if (!date) return 'Not provided'
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date)
  }

  const calculateAge = (dateOfBirth: Date | undefined) => {
    if (!dateOfBirth) return 'Unknown'
    const today = new Date()
    const birthDate = new Date(dateOfBirth)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    
    return age.toString()
  }

  const formatGoals = (goals: string[] | undefined) => {
    if (!goals || goals.length === 0) return 'None selected'
    return goals.map((goal, index) => `${index + 1}. ${goal}`).join('\n')
  }

  const formatDNA = (dna: OnboardingProfile['dna']) => {
    if (!dna) return 'Not completed'
    
    return [
      `Motivation: ${dna.motivation}`,
      `Confidence: ${dna.confidence}`,
      `Focus Mode: ${dna.focusMode}`,
      `Competitiveness: ${dna.competitiveness}`,
      `Coachability: ${dna.coachability}`,
      `Resilience: ${dna.resilience}`
    ].join('\n')
  }

  const formatAITone = (tone: string | undefined) => {
    if (!tone) return 'Not selected'
    
    const toneLabels = {
      hype: 'Hype - Energetic and motivational',
      mentor: 'Mentor - Supportive and guiding',
      analyst: 'Analyst - Data-driven and detailed',
      captain: 'Captain - Leadership-focused and strategic'
    }
    
    return toneLabels[tone as keyof typeof toneLabels] || tone
  }

  const isNextDisabled = () => {
    return isValidating || stepErrors.length > 0
  }

  return (
    <StepWrapper
      stepNumber={10}
      title="Review Your Profile"
      subtitle="Double-check everything looks good before we create your account"
      onNext={handleNext}
      onBack={handleBack}
      nextDisabled={isNextDisabled()}
      isLoading={isValidating}
    >
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="space-y-6">
          {/* Introduction */}
          <View className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
            <Text className="text-blue-400 font-semibold mb-2">
              🎯 Almost Ready!
            </Text>
            <Text className="text-blue-300 text-sm leading-5">
              Review your information below. You can edit any section by tapping the edit button. Once everything looks good, we'll create your account and get you started!
            </Text>
          </View>

          {/* Role & Basic Info */}
          <View className="bg-gray-800 rounded-lg p-4">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-white font-semibold text-lg">
                Basic Information
              </Text>
              <TouchableOpacity
                onPress={() => handleEditStep(1)}
                className="flex-row items-center bg-blue-600 px-3 py-2 rounded-md"
              >
                <Icon name="edit" size={16} color="white" />
                <Text className="text-white text-sm font-medium ml-2">
                  Edit
                </Text>
              </TouchableOpacity>
            </View>
            
            <View className="space-y-3">
              <View>
                <Text className="text-gray-400 text-sm">Role</Text>
                <Text className="text-white text-base capitalize">
                  {profile.role || 'Not selected'}
                </Text>
              </View>
              
              <View>
                <Text className="text-gray-400 text-sm">Sport & Gender</Text>
                <Text className="text-white text-base">
                  {profile.sport && profile.gender 
                    ? `${profile.sport} (${profile.gender})`
                    : 'Not selected'
                  }
                </Text>
              </View>
              
              <View>
                <Text className="text-gray-400 text-sm">Age & Graduation</Text>
                <Text className="text-white text-base">
                  {profile.dateOfBirth 
                    ? `${calculateAge(profile.dateOfBirth)} years old, Class of ${profile.graduationYear || 'Unknown'}`
                    : 'Not provided'
                  }
                </Text>
              </View>
            </View>
          </View>

          {/* Athletic Details */}
          <View className="bg-gray-800 rounded-lg p-4">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-white font-semibold text-lg">
                Athletic Details
              </Text>
              <TouchableOpacity
                onPress={() => handleEditStep(3)}
                className="flex-row items-center bg-blue-600 px-3 py-2 rounded-md"
              >
                <Icon name="edit" size={16} color="white" />
                <Text className="text-white text-sm font-medium ml-2">
                  Edit
                </Text>
              </TouchableOpacity>
            </View>
            
            <View className="space-y-3">
              <View>
                <Text className="text-gray-400 text-sm">Position</Text>
                <Text className="text-white text-base">
                  {profile.position || 'Not selected'}
                </Text>
              </View>
              
              <View>
                <Text className="text-gray-400 text-sm">Academic Level</Text>
                <Text className="text-white text-base capitalize">
                  {profile.academicLevel || 'Not selected'}
                </Text>
              </View>
            </View>
          </View>

          {/* Team Information */}
          <View className="bg-gray-800 rounded-lg p-4">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-white font-semibold text-lg">
                Team Information
              </Text>
              <TouchableOpacity
                onPress={() => handleEditStep(4)}
                className="flex-row items-center bg-blue-600 px-3 py-2 rounded-md"
              >
                <Icon name="edit" size={16} color="white" />
                <Text className="text-white text-sm font-medium ml-2">
                  Edit
                </Text>
              </TouchableOpacity>
            </View>
            
            <View className="space-y-3">
              <View>
                <Text className="text-gray-400 text-sm">Team Type</Text>
                <Text className="text-white text-base">
                  {profile.teamType === 'high_school' ? 'High School' : 
                   profile.teamType === 'club' ? 'Club' : 'Not selected'}
                </Text>
              </View>
              
              {profile.school && (
                <View>
                  <Text className="text-gray-400 text-sm">School</Text>
                  <Text className="text-white text-base">
                    {profile.school.name}
                  </Text>
                  <Text className="text-gray-300 text-sm">
                    {profile.school.city}, {profile.school.state}
                  </Text>
                </View>
              )}
              
              {profile.club && (
                <View>
                  <Text className="text-gray-400 text-sm">Club Team</Text>
                  <Text className="text-white text-base">
                    {profile.club.teamName}
                  </Text>
                  <Text className="text-gray-300 text-sm">
                    {profile.club.organization}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Goals */}
          <View className="bg-gray-800 rounded-lg p-4">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-white font-semibold text-lg">
                Performance Goals
              </Text>
              <TouchableOpacity
                onPress={() => handleEditStep(5)}
                className="flex-row items-center bg-blue-600 px-3 py-2 rounded-md"
              >
                <Icon name="edit" size={16} color="white" />
                <Text className="text-white text-sm font-medium ml-2">
                  Edit
                </Text>
              </TouchableOpacity>
            </View>
            
            <View>
              <Text className="text-gray-400 text-sm mb-2">Selected Goals</Text>
              <Text className="text-white text-base leading-6">
                {formatGoals(profile.selectedGoals)}
              </Text>
            </View>
          </View>

          {/* AthleteDNA */}
          <View className="bg-gray-800 rounded-lg p-4">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-white font-semibold text-lg">
                AthleteDNA Profile
              </Text>
              <TouchableOpacity
                onPress={() => handleEditStep(6)}
                className="flex-row items-center bg-blue-600 px-3 py-2 rounded-md"
              >
                <Icon name="edit" size={16} color="white" />
                <Text className="text-white text-sm font-medium ml-2">
                  Edit
                </Text>
              </TouchableOpacity>
            </View>
            
            <View>
              <Text className="text-gray-400 text-sm mb-2">Personality Assessment</Text>
              <Text className="text-white text-sm leading-5 font-mono">
                {formatDNA(profile.dna)}
              </Text>
            </View>
          </View>

          {/* AI Tone Preference */}
          <View className="bg-gray-800 rounded-lg p-4">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-white font-semibold text-lg">
                AI Communication Style
              </Text>
              <TouchableOpacity
                onPress={() => handleEditStep(7)}
                className="flex-row items-center bg-blue-600 px-3 py-2 rounded-md"
              >
                <Icon name="edit" size={16} color="white" />
                <Text className="text-white text-sm font-medium ml-2">
                  Edit
                </Text>
              </TouchableOpacity>
            </View>
            
            <View>
              <Text className="text-gray-400 text-sm mb-2">Preferred Tone</Text>
              <Text className="text-white text-base">
                {formatAITone(profile.aiTone)}
              </Text>
            </View>
          </View>

          {/* Legal Consents */}
          <View className="bg-gray-800 rounded-lg p-4">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-white font-semibold text-lg">
                Legal Agreements
              </Text>
              <TouchableOpacity
                onPress={() => handleEditStep(9)}
                className="flex-row items-center bg-blue-600 px-3 py-2 rounded-md"
              >
                <Icon name="edit" size={16} color="white" />
                <Text className="text-white text-sm font-medium ml-2">
                  Edit
                </Text>
              </TouchableOpacity>
            </View>
            
            <View className="space-y-2">
              <View className="flex-row items-center">
                <Icon 
                  name={profile.tosAccepted ? "check-circle" : "x-circle"} 
                  size={16} 
                  color={profile.tosAccepted ? "#22C55E" : "#EF4444"} 
                />
                <Text className="text-white text-sm ml-2">
                  Terms of Service {profile.tosAccepted ? 'Accepted' : 'Not Accepted'}
                </Text>
              </View>
              
              <View className="flex-row items-center">
                <Icon 
                  name={profile.privacyAccepted ? "check-circle" : "x-circle"} 
                  size={16} 
                  color={profile.privacyAccepted ? "#22C55E" : "#EF4444"} 
                />
                <Text className="text-white text-sm ml-2">
                  Privacy Policy {profile.privacyAccepted ? 'Accepted' : 'Not Accepted'}
                </Text>
              </View>
              
              <View className="flex-row items-center">
                <Icon 
                  name={profile.benchmarkingConsent ? "check-circle" : "minus-circle"} 
                  size={16} 
                  color={profile.benchmarkingConsent ? "#22C55E" : "#6B7280"} 
                />
                <Text className="text-white text-sm ml-2">
                  Benchmarking Data {profile.benchmarkingConsent ? 'Allowed' : 'Declined'}
                </Text>
              </View>
            </View>
          </View>

          {/* Age Verification (if applicable) */}
          {profile.dateOfBirth && calculateAge(profile.dateOfBirth) !== 'Unknown' && 
           parseInt(calculateAge(profile.dateOfBirth)) < 16 && (
            <View className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-yellow-400 font-semibold text-lg">
                  Age Verification
                </Text>
                <TouchableOpacity
                  onPress={() => handleEditStep(8)}
                  className="flex-row items-center bg-yellow-600 px-3 py-2 rounded-md"
                >
                  <Icon name="edit" size={16} color="white" />
                  <Text className="text-white text-sm font-medium ml-2">
                    Edit
                  </Text>
                </TouchableOpacity>
              </View>
              
              <View className="space-y-2">
                <View className="flex-row items-center">
                  <Icon 
                    name={profile.ageVerified ? "check-circle" : "clock"} 
                    size={16} 
                    color={profile.ageVerified ? "#22C55E" : "#F59E0B"} 
                  />
                  <Text className="text-yellow-300 text-sm ml-2">
                    Age Verification {profile.ageVerified ? 'Complete' : 'Pending'}
                  </Text>
                </View>
                
                {profile.guardianEmail && (
                  <View>
                    <Text className="text-yellow-400 text-sm">Guardian Email</Text>
                    <Text className="text-yellow-300 text-sm">
                      {profile.guardianEmail}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Error Display */}
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

          {/* Confirmation */}
          <View className="bg-green-900/20 border border-green-700 rounded-lg p-4">
            <Text className="text-green-400 font-semibold mb-2">
              ✅ Ready to Create Account
            </Text>
            <Text className="text-green-300 text-sm leading-5">
              Everything looks good! When you continue, we'll create your StatLocker account and activate your 7-day free trial. You'll be able to start logging games and tracking your progress right away.
            </Text>
          </View>

          {/* Data Accuracy Confirmation */}
          <View className="bg-blue-900/20 border border-blue-700 rounded-lg p-4 mb-6">
            <Text className="text-blue-400 font-medium text-sm mb-2">
              📋 Data Accuracy Confirmation
            </Text>
            <Text className="text-blue-300 text-xs leading-4">
              By continuing, you confirm that all the information above is accurate and complete. You can update most of this information later in your profile settings, but some changes may require verification.
            </Text>
          </View>
        </View>
      </ScrollView>
    </StepWrapper>
  )
}