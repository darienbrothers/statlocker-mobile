import { Text, View, Pressable } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Screen, StickyCTA } from '@/components';

const onboardingSteps = {
  profile: {
    title: 'Create Your Profile',
    description: 'Tell us about yourself and your sport',
    content: 'Profile setup form would go here',
    nextStep: 'goals',
  },
  goals: {
    title: 'Set Your Goals',
    description: 'What do you want to achieve this season?',
    content: 'Goal setting interface would go here',
    nextStep: 'notifications',
  },
  notifications: {
    title: 'Stay Updated',
    description: 'Get notified about your progress and achievements',
    content: 'Notification preferences would go here',
    nextStep: null, // Last step
  },
};

export default function OnboardingStepScreen() {
  const router = useRouter();
  const { step } = useLocalSearchParams<{ step: string }>();
  
  const currentStep = step && onboardingSteps[step as keyof typeof onboardingSteps];

  if (!currentStep) {
    // Invalid step, redirect to onboarding start
    router.replace('/(auth)/onboarding');
    return null;
  }

  const handleNext = () => {
    if (currentStep.nextStep) {
      router.push(`/(auth)/onboarding/${currentStep.nextStep}`);
    } else {
      // Last step, complete onboarding
      handleCompleteOnboarding();
    }
  };

  const handleCompleteOnboarding = () => {
    // TODO: Save onboarding completion state
    console.log('Onboarding completed');
    // Handle any pending deep links after onboarding
    const { deepLinkService } = require('@/services/DeepLinkService');
    deepLinkService.handleAuthSuccess();
  };

  const handleSkip = () => {
    router.replace('/(tabs)/dashboard');
  };

  const isLastStep = !currentStep.nextStep;

  return (
    <Screen
      title={currentStep.title}
      stickyCta={
        <StickyCTA variant="primary" onPress={handleNext}>
          {isLastStep ? 'Complete Setup' : 'Continue'}
        </StickyCTA>
      }
    >
      <View className="flex-1">
        <Text className="text-base text-gray-500 mb-8">
          {currentStep.description}
        </Text>

        {/* Placeholder content */}
        <View className="bg-gray-100 rounded-2xl p-6 mb-8">
          <Text className="text-gray-700 text-center">
            {currentStep.content}
          </Text>
        </View>

        {/* Progress indicator */}
        <View className="flex-row justify-center space-x-2 mb-8">
          {Object.keys(onboardingSteps).map((stepKey, index) => (
            <View
              key={stepKey}
              className={`w-2 h-2 rounded-full ${
                stepKey === step ? 'bg-primary-900' : 'bg-gray-200'
              }`}
            />
          ))}
        </View>

        {/* Skip button */}
        <Pressable
          className="self-center px-6 py-3 bg-gray-100 rounded-xl"
          onPress={handleSkip}
        >
          <Text className="text-gray-700 font-medium">
            Skip for now
          </Text>
        </Pressable>
      </View>
    </Screen>
  );
}