/**
 * Email Verification Screen
 * 
 * Email verification screen with:
 * - Verification status display
 * - Resend verification email
 * - Rate limiting with countdown
 * - Email app integration
 * - Verification status polling
 */

import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, AppState } from 'react-native';
import { Link, useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  SLButton,
  SLToast,
  useToast,
  SLFormHint,
} from '@/components/auth';
import { useAuthStore } from '@/store/authStore';
import { AuthError } from '@/types/auth';

export default function VerifyEmailScreen() {
  const router = useRouter();
  const { email: paramEmail } = useLocalSearchParams<{ email?: string }>();
  const { user, sendEmailVerification, isLoading, clearError } = useAuthStore();
  const { toast, showError, showSuccess, showInfo, hideToast } = useToast();
  
  // State
  const [canResend, setCanResend] = useState(true);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [verificationChecks, setVerificationChecks] = useState(0);
  
  // Get email from user or params
  const email = user?.email || paramEmail || '';

  // Check verification status periodically
  useEffect(() => {
    if (!user) return;

    const checkVerification = () => {
      // In a real app, you'd refresh the user token to get updated emailVerified status
      // For now, we'll just track attempts
      setVerificationChecks(prev => prev + 1);
      
      if (user.emailVerified) {
        showSuccess('Email verified successfully!');
        // Navigate to main app or next step
        setTimeout(() => {
          router.replace('/(tabs)/dashboard');
        }, 1500);
      }
    };

    // Check on app state change (when user returns from email app)
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'active' && verificationChecks < 10) {
        checkVerification();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    // Initial check
    checkVerification();

    return () => {
      subscription?.remove();
    };
  }, [user, verificationChecks, router, showSuccess]);

  // Handle resend verification
  const handleResendVerification = async () => {
    clearError();

    try {
      await sendEmailVerification();
      setCanResend(false);
      
      // Start countdown for resend
      let countdown = 60;
      setResendCountdown(countdown);
      
      const timer = setInterval(() => {
        countdown -= 1;
        setResendCountdown(countdown);
        
        if (countdown <= 0) {
          clearInterval(timer);
          setCanResend(true);
          setResendCountdown(0);
        }
      }, 1000);

      showSuccess('Verification email sent! Check your inbox.');
    } catch (error) {
      const authError = error as AuthError;
      showError(authError.userMessage || 'Failed to send verification email. Please try again.');
    }
  };

  // Handle manual verification check
  const handleCheckVerification = () => {
    if (user?.emailVerified) {
      showSuccess('Email already verified!');
      router.replace('/(tabs)/dashboard');
    } else {
      showInfo('Email not yet verified. Please check your inbox and click the verification link.');
    }
  };

  // Handle change email
  const handleChangeEmail = () => {
    // Navigate back to sign up or profile settings
    router.back();
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView 
        className="flex-1" 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-1 px-6 pt-8">
            {/* Header */}
            <View className="items-center mb-8">
              <View className="w-20 h-20 bg-blue-100 rounded-full items-center justify-center mb-6">
                <View className="w-12 h-12 bg-blue-600 rounded-xl items-center justify-center">
                  <Text className="text-white text-xl">📧</Text>
                </View>
              </View>
              <Text className="text-3xl font-bold text-gray-900 mb-2 text-center">
                Verify your email
              </Text>
              <Text className="text-base text-gray-500 text-center">
                We sent a link to{' '}
                <Text className="font-medium text-gray-700">{email}</Text>
                {'. '}Tap it to continue.
              </Text>
            </View>

            {/* Main Content */}
            <View className="space-y-6">
              {/* Instructions */}
              <View className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
                <Text className="text-sm font-medium text-blue-800 mb-3">
                  What to do next:
                </Text>
                <View className="space-y-2">
                  <View className="flex-row items-start">
                    <Text className="text-blue-600 mr-2">1.</Text>
                    <Text className="text-sm text-blue-700 flex-1">
                      Check your inbox for an email from StatLocker
                    </Text>
                  </View>
                  <View className="flex-row items-start">
                    <Text className="text-blue-600 mr-2">2.</Text>
                    <Text className="text-sm text-blue-700 flex-1">
                      Click the "Verify Email" button in the email
                    </Text>
                  </View>
                  <View className="flex-row items-start">
                    <Text className="text-blue-600 mr-2">3.</Text>
                    <Text className="text-sm text-blue-700 flex-1">
                      Return to this app to continue
                    </Text>
                  </View>
                </View>
              </View>

              {/* Action Buttons */}
              <View className="space-y-4">
                {/* Open Email App */}
                <SLButton
                  variant="primary"
                  size="large"
                  fullWidth
                  onPress={() => {
                    // This would open the default email app
                    // Implementation depends on platform
                  }}
                  testID="open-email-button"
                >
                  Open Email App
                </SLButton>

                {/* Resend Verification */}
                <SLButton
                  variant="secondary"
                  size="large"
                  fullWidth
                  loading={isLoading}
                  disabled={!canResend}
                  onPress={handleResendVerification}
                  testID="resend-verification-button"
                >
                  {resendCountdown > 0 
                    ? `Resend in ${resendCountdown}s` 
                    : 'Resend Verification Email'
                  }
                </SLButton>

                {/* Manual Check */}
                <SLButton
                  variant="ghost"
                  size="large"
                  fullWidth
                  onPress={handleCheckVerification}
                  testID="check-verification-button"
                >
                  I've Verified My Email
                </SLButton>
              </View>

              {/* Help Section */}
              <View className="space-y-4 pt-4">
                <SLFormHint
                  text="Don't see the email? Check your spam or junk folder."
                  type="info"
                />
                
                <SLFormHint
                  text="The verification link will expire in 24 hours for security."
                  type="warning"
                />
              </View>

              {/* Troubleshooting */}
              <View className="bg-gray-50 rounded-2xl p-6">
                <Text className="text-sm font-medium text-gray-800 mb-3">
                  Still having trouble?
                </Text>
                <View className="space-y-3">
                  <SLButton
                    variant="ghost"
                    size="small"
                    onPress={handleChangeEmail}
                    testID="change-email-button"
                  >
                    Change Email Address
                  </SLButton>
                  
                  <SLButton
                    variant="ghost"
                    size="small"
                    onPress={() => {
                      // Navigate to support or help
                    }}
                    testID="contact-support-button"
                  >
                    Contact Support
                  </SLButton>
                </View>
              </View>
            </View>

            {/* Footer Links */}
            <View className="mt-auto mb-6 space-y-4">
              {/* Back to Sign In */}
              <View className="flex-row justify-center items-center">
                <Text className="text-gray-500 text-base">Want to use a different account? </Text>
                <Link href="/(auth)/sign-in" asChild>
                  <Text className="text-blue-600 text-base font-medium">
                    Sign in
                  </Text>
                </Link>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Toast Notifications */}
      <SLToast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onDismiss={hideToast}
        testID="verify-email-toast"
      />
    </SafeAreaView>
  );
}